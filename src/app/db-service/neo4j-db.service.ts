import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GlobalVariableService } from '../global-variable.service';
import { GraphResponse, TableResponse, DbService, DbQueryType, DbQueryMeta, Neo4jEdgeDirection } from './data-types';
import { Rule, ClassBasedRules, RuleNode } from '../operation-tabs/map-tab/query-types';
import { GENERIC_TYPE } from '../constants';
import AppDescription from '../../assets/app_description.json';
import properties from '../../assets/generated/properties.json'
import { TableFiltering } from '../table-view/table-view-types';

@Injectable({
  providedIn: 'root'
})
export class Neo4jDb implements DbService {

  // default database config, in case it is not read from visuall-config.json
  private dbConfig = {
    url: 'http://ivis.cs.bilkent.edu.tr:3001/db/data/transaction/commit',
    username: 'neo4j',
    password: '123'
  };

  constructor(private _http: HttpClient, private _g: GlobalVariableService) {
    this._g.getConfig().subscribe(x => { this.dbConfig = x['database'] }, error => console.log('getConfig err: ', error));
  }

  getNeighbors(elemIds: string[] | number[], callback: (x: GraphResponse) => any, meta?: DbQueryMeta) {
    let isEdgeQuery = meta && meta.isEdgeQuery;
    let idFilter = this.buildIdFilter(elemIds, false, isEdgeQuery);
    let edgeCql = '';
    if (meta && meta.edgeType != undefined && typeof meta.edgeType == 'string' && meta.edgeType.length > 0) {
      edgeCql = `-[e:${meta.edgeType}`;
    } else if (meta && meta.edgeType != undefined && typeof meta.edgeType == 'object') {
      edgeCql = `-[e:${meta.edgeType.join('|')}`;
    } else {
      edgeCql = `-[e`;
    }
    let targetCql = '';
    if (meta && meta.targetType != undefined && meta.targetType.length > 0) {
      edgeCql += '*' + meta.depth;
      targetCql = ':' + meta.targetType;
    }
    edgeCql += ']-';

    let f2 = this.dateFilterFromUserPref('n', true);
    f2 += this.dateFilterFromUserPref('e', false);

    this.runQuery(`MATCH p=(n)${edgeCql}(${targetCql}) WHERE ${idFilter} ${f2} RETURN p`, callback);
  }

  getElems(ids: string[] | number[], callback: (x: GraphResponse) => any, meta: DbQueryMeta) {
    const isEdgeQuery = meta && meta.isEdgeQuery;
    let idFilter = this.buildIdFilter(ids, false, isEdgeQuery);
    let edgepart = isEdgeQuery ? '-[e]-(n2)' : '';
    let returnPart = isEdgeQuery ? 'n,e,n2' : 'n';
    this.runQuery(`MATCH (n)${edgepart} WHERE ${idFilter} RETURN ${returnPart}`, callback);
  }

  getSampleData(callback: (x: GraphResponse) => any) {
    this.runQuery(`MATCH (n)-[e]-() RETURN n,e limit 100`, callback);
  }

  getFilteringResult(rules: ClassBasedRules, filter: TableFiltering, skip: number, limit: number, type: DbQueryType, callback: (x: GraphResponse | TableResponse) => any) {
    const cql = this.rule2cql2(rules, skip, limit, type, filter);
    this.runQuery(cql, callback, type == DbQueryType.std);
  }

  filterTable(rules: ClassBasedRules, filter: TableFiltering, skip: number, limit: number, type: DbQueryType, callback: (x: GraphResponse | TableResponse) => any) {
    const cql = this.rule2cql2(rules, skip, limit, type, filter);
    this.runQuery(cql, callback, type == DbQueryType.std);
  }

  getCount4Q0(d1: number, d2: number, movieCount: number, callback: (x) => any, filter?: TableFiltering) {
    let txtCondition = this.getQueryCondition4TxtFilter(filter, ['n.primary_name', 'degree']);
    let cql = `MATCH (n:Person)-[r:ACTOR|ACTRESS]->(:Title)
    WHERE r.act_begin >= ${d1} AND r.act_end <= ${d2}  
    WITH n, SIZE(COLLECT(r)) as degree
    WHERE degree >= ${movieCount} ${txtCondition}
    RETURN DISTINCT COUNT(*)`;
    this.runQuery(cql, callback, false);
  }

  getTable4Q0(d1: number, d2: number, movieCnt: number, skip: number, limit: number, callback: (x) => any, filter?: TableFiltering) {
    let txtCondition = this.getQueryCondition4TxtFilter(filter, ['n.primary_name', 'degree']);
    let ui2Db = { 'Actor': 'Actor', 'Count': 'Count' };
    let orderExpr = this.getOrderByExpression4Query(filter, 'degree', 'desc', ui2Db);

    let cql = `MATCH (n:Person)-[r:ACTOR|ACTRESS]->(:Title)
    WHERE r.act_begin >= ${d1} AND r.act_end <= ${d2}  
    WITH n, SIZE(COLLECT(r)) as degree
    WHERE degree >= ${movieCnt} ${txtCondition}
    RETURN DISTINCT ID(n) as id, n.primary_name as Actor, degree as Count 
    ORDER BY ${orderExpr} SKIP ${skip} LIMIT ${limit}`;
    this.runQuery(cql, callback, false);
  }

  getGraph4Q0(d1: number, d2: number, movieCnt: number, skip: number, limit: number, callback: (x) => any, ids: string[] | number[], filter: TableFiltering) {
    let idFilter = this.buildIdFilter(ids, true);
    let txtCondition = this.getQueryCondition4TxtFilter(filter, ['n.primary_name', 'degree']);
    let ui2Db = { 'Actor': 'n.primary_name', 'Count': 'degree' };
    let orderExpr = this.getOrderByExpression4Query(filter, 'degree', 'desc', ui2Db);

    let cql = `MATCH (n:Person)-[r:ACTOR|ACTRESS]->(:Title)
      WHERE ${idFilter} r.act_begin >= ${d1} AND r.act_end <= ${d2}  
      WITH n, SIZE(COLLECT(r)) as degree, COLLECT(r) as edges
      WHERE degree >= ${movieCnt} ${txtCondition}
      RETURN DISTINCT n, edges, degree 
      ORDER BY ${orderExpr} SKIP ${skip} LIMIT ${limit}`;
    this.runQuery(cql, callback);
  }

  getCount4Q1(d1: number, d2: number, genre: string, callback: (x) => any, filter?: TableFiltering) {
    let txtCondition = this.getQueryCondition4TxtFilter(filter, ['m.primary_title']);
    let cql = ` MATCH (m:Title)<-[:ACTOR|ACTRESS]-(:Person)
    WHERE '${genre}' IN m.genres AND m.start_year> ${d1} AND m.start_year < ${d2} ${txtCondition} 
    RETURN COUNT( DISTINCT m)`;
    this.runQuery(cql, callback, false);
  }

  getTable4Q1(d1: number, d2: number, genre: string, skip: number, limit: number, callback: (x) => any, filter?: TableFiltering) {
    let txtCondition = this.getQueryCondition4TxtFilter(filter, ['m.primary_title']);
    let ui2Db = { 'Title': 'm.primary_title' };
    let orderExpr = this.getOrderByExpression4Query(filter, 'm.primary_title', 'desc', ui2Db);

    let cql = ` MATCH (m:Title)<-[r:ACTOR|ACTRESS]-(:Person)
    WHERE '${genre}' IN m.genres AND m.start_year > ${d1} AND m.start_year < ${d2} ${txtCondition} 
    RETURN DISTINCT ID(m) as id, m.primary_title
    ORDER BY ${orderExpr} SKIP ${skip} LIMIT ${limit}`;
    this.runQuery(cql, callback, false);
  }

  getGraph4Q1(d1: number, d2: number, genre: string, skip: number, limit: number, callback: (x) => any, ids: string[] | number[], filter: TableFiltering) {
    let idFilter = this.buildIdFilter(ids, true);
    let txtCondition = this.getQueryCondition4TxtFilter(filter, ['n.primary_title']);
    let ui2Db = { 'Title': 'n.primary_title' };
    let orderExpr = this.getOrderByExpression4Query(filter, 'n.primary_title', 'desc', ui2Db);

    let cql = `MATCH (n:Title)<-[r:ACTOR|ACTRESS]-(:Person)
    WHERE '${genre}' IN n.genres AND ${idFilter}  n.start_year > ${d1} AND n.start_year < ${d2}  ${txtCondition}
    WITH n, COLLECT(r) as edges
    RETURN  DISTINCT n, edges
    ORDER BY ${orderExpr} SKIP ${skip} LIMIT ${limit}`;
    this.runQuery(cql, callback);
  }

  getDataForQ1(id: number, d1: number, d2: number, genre: string, callback: (x) => any) {
    let cql =
      `MATCH p=(m:Title)<-[:ACTOR|ACTRESS]-(a:Person) 
      WHERE '${genre}' IN m.genres AND ID(m) = ${id} AND m.start_year > ${d1} AND m.start_year < ${d2}
     RETURN nodes(p), relationships(p)`;
    this.runQuery(cql, callback);
  }

  getMovieGenres(callback: (x: any) => any) {
    this.runQuery('MATCH (m:Title) UNWIND m.genres as g return distinct g', callback, false);
  }

  getGraphOfInterest(dbIds: (string | number)[], ignoredTypes: string[], lengthLimit: number, isDirected: boolean, type: DbQueryType, filter: TableFiltering, cb: (x) => void) {
    const t = filter.txt ?? '';
    const isIgnoreCase = this._g.userPrefs.isIgnoreCaseInText.getValue();
    const pageSize = this._g.userPrefs.dataPageSize.getValue();
    const currPage = filter.skip ? Math.floor(filter.skip / pageSize) + 1 : 1;
    const orderBy = filter.orderBy ? `'${filter.orderBy}'` : null;
    let orderDir = 0;
    if (filter.orderDirection == 'desc') {
      orderDir = 1;
    } else if (filter.orderDirection == '') {
      orderDir = 2;
    }
    const timeMap = this.getTimebarMapping4Java();
    let d1 = this._g.userPrefs.dbQueryTimeRange.start.getValue();
    let d2 = this._g.userPrefs.dbQueryTimeRange.end.getValue();
    if (!this._g.userPrefs.isLimitDbQueries2range.getValue()) {
      d1 = 0;
      d2 = 0;
    }

    if (type == DbQueryType.count) {
      this.runQuery(`CALL graphOfInterestCount([${dbIds.join()}], [${ignoredTypes.join()}], ${lengthLimit}, ${isDirected}, '${t}', ${isIgnoreCase},
       ${pageSize}, ${timeMap}, ${d1}, ${d2})`, cb, false);
    } else if (type == DbQueryType.table) {
      this.runQuery(`CALL graphOfInterest([${dbIds.join()}], [${ignoredTypes.join()}], ${lengthLimit}, ${isDirected},
      ${pageSize}, ${currPage}, '${t}', ${isIgnoreCase}, ${orderBy}, ${orderDir}, ${timeMap}, ${d1}, ${d2})`, cb, false);
    }
  }

  getCommonStream(dbIds: (string | number)[], ignoredTypes: string[], lengthLimit: number, dir: Neo4jEdgeDirection, type: DbQueryType, filter: TableFiltering, cb: (x) => void) {
    const t = filter.txt ?? '';
    const isIgnoreCase = this._g.userPrefs.isIgnoreCaseInText.getValue();
    const pageSize = this._g.userPrefs.dataPageSize.getValue();
    const currPage = filter.skip ? Math.floor(filter.skip / pageSize) + 1 : 1;
    const orderBy = filter.orderBy ? `'${filter.orderBy}'` : null;
    let orderDir = 0;
    if (filter.orderDirection == 'desc') {
      orderDir = 1;
    } else if (filter.orderDirection == '') {
      orderDir = 2;
    }
    const timeMap = this.getTimebarMapping4Java();
    let d1 = this._g.userPrefs.dbQueryTimeRange.start.getValue();
    let d2 = this._g.userPrefs.dbQueryTimeRange.end.getValue();
    if (!this._g.userPrefs.isLimitDbQueries2range.getValue()) {
      d1 = 0;
      d2 = 0;
    }

    if (type == DbQueryType.count) {
      this.runQuery(`CALL commonStreamCount([${dbIds.join()}], [${ignoredTypes.join()}], ${lengthLimit}, ${dir}, '${t}', ${isIgnoreCase},
       ${pageSize}, ${timeMap}, ${d1}, ${d2})`, cb, false);
    } else if (type == DbQueryType.table) {
      this.runQuery(`CALL commonStream([${dbIds.join()}], [${ignoredTypes.join()}], ${lengthLimit}, ${dir},
      ${pageSize}, ${currPage}, '${t}', ${isIgnoreCase}, ${orderBy}, ${orderDir}, ${timeMap}, ${d1}, ${d2})`, cb, false);
    }
  }

  private getTimebarMapping4Java(): string {
    // {Person:["start_t", "end_t"]}
    const mapping = AppDescription.timebarDataMapping;
    let s = '{'
    for (const k in mapping) {
      s += k + ':["' + mapping[k].begin_datetime + '","' + mapping[k].end_datetime + '"],';
    }
    s = s.slice(0, -1);
    s += '}'
    return s;
  }

  private dateFilterFromUserPref(varName: string, isNode: boolean): string {
    if (!this._g.userPrefs.isLimitDbQueries2range.getValue()) {
      return '';
    }
    let s = '';
    let keys = [];

    if (isNode) {
      keys = Object.keys(AppDescription.objects);
    } else {
      keys = Object.keys(AppDescription.relations);
    }

    const d1 = this._g.userPrefs.dbQueryTimeRange.start.getValue();
    const d2 = this._g.userPrefs.dbQueryTimeRange.end.getValue();
    s = ' AND ('
    for (const k of keys) {
      const p1 = varName + '.' + AppDescription.timebarDataMapping[k].begin_datetime;
      const p2 = varName + '.' + AppDescription.timebarDataMapping[k].end_datetime;
      // const 
      s += `(${p1} IS NULL OR ${p1} > ${d1}) AND (${p2} IS NULL OR ${p2} < ${d2}) AND`
    }
    s = s.slice(0, -4)
    s += ')'
    return s;
  }

  private runQuery(query: string, callback: (x: any) => any, isGraphResponse = true) {
    const url = this.dbConfig.url;
    const username = this.dbConfig.username;
    const password = this.dbConfig.password;
    let requestType = isGraphResponse ? 'graph' : 'row';
    this._g.setLoadingStatus(true);
    console.log(query);
    this._g.statusMsg.next('Executing database query...')
    const requestBody = {
      'statements': [{
        'statement': query,
        'parameters': null,
        'resultDataContents': [requestType]
      }]
    };
    this._http.post(url, requestBody, {
      headers: {
        Accept: 'application/json; charset=UTF-8',
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(username + ':' + password)
      }
    }).subscribe(x => {
      this._g.setLoadingStatus(false);
      if (isGraphResponse) {
        callback(this.extractGraph(x));
      } else {
        callback(this.extractTable(x));
      }
    })
  }

  private extractGraph(response): GraphResponse {
    let nodes = [];
    let edges = [];

    const results = response.results[0];
    if (!results) {
      console.error('Invalid query!', response.errors[0]);
      return;
    }

    const data = response.results[0].data;
    for (let i = 0; i < data.length; i++) {
      const graph = data[i].graph;
      const graph_nodes = graph.nodes;
      const graph_edges = graph.relationships;

      for (let node of graph_nodes) {
        nodes.push(node);
      }

      for (let edge of graph_edges) {
        edges.push(edge);
      }
    }

    return { 'nodes': nodes, 'edges': edges };
  }

  private extractTable(response): TableResponse {
    if (response.errors && response.errors.length > 0) {
      console.error('DB server returns erronous result', response.errors);
      this._g.setLoadingStatus(false);
      return;
    }
    return { columns: response.results[0].columns, data: response.results[0].data.map(x => x.row) };
  }

  // ------------------------------------------------- methods for conversion to CQL -------------------------------------------------
  private rule2cql2(rules: ClassBasedRules, skip: number, limit: number, type: DbQueryType, filter: TableFiltering = null) {
    let query = '';
    query += this.getCql4Rules2(rules, filter);
    query += this.generateFinalQueryBlock(filter, skip, limit, type);
    return query;
  }

  private getCql4Rules2(rule: ClassBasedRules, filter: TableFiltering = null) {
    let isGenericType = false;
    if (rule.className == GENERIC_TYPE.ANY_CLASS || rule.className == GENERIC_TYPE.EDGES_CLASS || rule.className == GENERIC_TYPE.NODES_CLASS) {
      isGenericType = true;
    }
    let classFilter = ':' + rule.className;
    if (isGenericType) {
      classFilter = '';
    }
    let matchClause: string;
    if (rule.isEdge) {
      let s = AppDescription.relations[rule.className].source;
      let t = AppDescription.relations[rule.className].target;
      let conn = '>';
      let isBidirectional = AppDescription.relations[rule.className].isBidirectional;
      if (isBidirectional) {
        conn = '';
      }
      matchClause = `OPTIONAL MATCH (:${s})-[x${classFilter}]-${conn}(:${t})\n`;
    }
    else {
      matchClause = `OPTIONAL MATCH (x${classFilter})\n`;
    }

    let conditions = this.getCondtion4RuleNode(rule.rules);

    if (filter != null && filter.txt.length > 0) {
      let s = this.getCondition4TxtFilter(rule.isEdge, rule.className, filter.txt);
      conditions = '(' + conditions + ') AND ' + s;
    }
    conditions += this.dateFilterFromUserPref('x', !rule.isEdge);

    return matchClause + 'WHERE ' + conditions + '\n';
  }

  private getCondition4TxtFilter(isEdge: boolean, className: string, txt: string): string {
    let s = '';
    let t = 'nodes';
    if (isEdge) {
      t = 'edges';
    }
    let p = properties[t][className];
    for (let k in p) {
      if (p[k] !== 'list') {
        if (this._g.userPrefs.isIgnoreCaseInText.getValue()) {
          s += ` LOWER(toString(x.${k})) CONTAINS LOWER('${txt}') OR `;
        } else {
          s += ` toString(x.${k}) CONTAINS '${txt}' OR `;
        }
      } else {
        if (this._g.userPrefs.isIgnoreCaseInText.getValue()) {
          s += ` LOWER(REDUCE(s='', w IN x.${k} | s + w)) CONTAINS LOWER('${txt}') OR `;
        } else {
          s += ` REDUCE(s = "", w IN x.${k} | s + w) CONTAINS '${txt}' OR `;
        }
      }
    }
    s = s.slice(0, -3)
    s = '(' + s + ')'
    return s;
  }

  private getCondtion4RuleNode(node: RuleNode): string {
    let s = '(';
    if (!node.r.ruleOperator) {
      s += ' ' + this.getCondition4Rule(node.r) + ' ';
    } else {
      for (let i = 0; i < node.children.length; i++) {
        if (i != node.children.length - 1) {
          s += ' ' + this.getCondtion4RuleNode(node.children[i]) + ' ' + node.r.ruleOperator;
        } else {
          s += ' ' + this.getCondtion4RuleNode(node.children[i]) + ' ';
        }
      }
    }
    return s + ')';
  }

  private getCondition4Rule(rule: Rule): string {
    if (!rule.propertyOperand || rule.propertyOperand == GENERIC_TYPE.NOT_SELECTED) {
      return '(TRUE)';
    }
    let inputOp = '';
    if (rule.propertyType == 'string' || rule.propertyType == 'list' || rule.propertyType.startsWith('enum')) {
      inputOp = `'${rule.rawInput}'`;
    } else {
      inputOp = '' + rule.rawInput;
    }
    if (rule.propertyType == 'list') {
      return `(${inputOp} IN x.${rule.propertyOperand})`;
    } else if (rule.propertyType == 'edge') {
      if (!rule.operator || !rule.inputOperand || rule.inputOperand.length < 1) {
        return `( size((x)-[:${rule.propertyOperand}]-()) > 0 )`;
      }
      let i = this.transformInp(rule, rule.inputOperand);
      return `( size((x)-[:${rule.propertyOperand}]-()) ${rule.operator} ${i} )`;
    } else {
      if (rule.propertyType == 'string' && this._g.userPrefs.isIgnoreCaseInText.getValue()) {
        inputOp = inputOp.toLowerCase();
        inputOp = this.transformInp(rule, inputOp);
        let op = rule.operator != 'One of' ? rule.operator : 'IN';
        return `(LOWER(x.${rule.propertyOperand}) ${op} ${inputOp})`;
      }
      inputOp = this.transformInp(rule, inputOp);
      let op = rule.operator != 'One of' ? rule.operator : 'IN';
      return `(x.${rule.propertyOperand} ${op} ${inputOp})`;
    }
  }

  private transformInp(rule: Rule, inputOp: string): string {
    if (rule.operator != 'One of') {
      return inputOp;
    }
    let s = inputOp;
    s = s.replace(/'/g, '');
    if (rule.propertyType == 'string') {
      let arr = s.split(',').map(x => `'${x}'`);
      return `[${arr.join(',')}]`
    } else {
      return `[${s}]`
    }
  }

  private generateFinalQueryBlock(filter: TableFiltering, skip: number, limit: number, type: DbQueryType) {
    if (type == DbQueryType.table) {
      if (filter != null && filter.orderDirection.length > 0) {
        return `RETURN ID(x), x ORDER BY x.${filter.orderBy} ${filter.orderDirection} SKIP ${skip} LIMIT ${limit}`;
      }
      return `RETURN ID(x), x  SKIP ${skip} LIMIT ${limit}`;
    } else if (type == DbQueryType.std) {
      if (filter != null && filter.orderDirection.length > 0) {
        return `RETURN x ORDER BY x.${filter.orderBy} ${filter.orderDirection} SKIP ${skip} LIMIT ${limit}`;
      }
      return `RETURN x SKIP ${skip} LIMIT ${limit}`;
    } else if (type == DbQueryType.count) {
      return `RETURN COUNT(x)`;
    }
    return '';
  }

  private getQueryCondition4TxtFilter(filter: TableFiltering, cols: string[]): string {
    if (filter == null || filter.txt.length < 1) {
      return '';
    }
    let s = '';

    for (let i = 0; i < cols.length; i++) {
      if (this._g.userPrefs.isIgnoreCaseInText.getValue()) {
        s += ` LOWER(toString(${cols[i]})) CONTAINS LOWER('${filter.txt}') OR `;
      } else {
        s += ` toString(${cols[i]}) CONTAINS '${filter.txt}' OR `;
      }
    }
    s = s.slice(0, -3);
    s = 'AND (' + s + ')';
    return s;
  }

  private getOrderByExpression4Query(filter: TableFiltering, orderBy: string, orderDirection: string, ui2Db: any) {
    if (filter != null && filter.orderDirection.length > 0 && filter.orderBy.length > 0) {
      orderBy = ui2Db[filter.orderBy];
      orderDirection = filter.orderDirection;
    }
    return orderBy + ' ' + orderDirection;
  }

  private buildIdFilter(ids: string[] | number[], hasEnd = false, isEdgeQuery = false): string {
    if (ids === undefined) {
      return '';
    }
    let varName = 'n';
    if (isEdgeQuery) {
      varName = 'e';
    }
    let cql = '';
    if (ids.length > 0) {
      cql = '(';
    }
    for (let i = 0; i < ids.length; i++) {
      cql += `ID(${varName})=${ids[i]} OR `
    }

    if (ids.length > 0) {
      cql = cql.slice(0, -4);

      cql += ')';
      if (hasEnd) {
        cql += ' AND ';
      }
    }
    return cql;
  }
  // ------------------------------------------------- end of methods for conversion to CQL -------------------------------------------------
}
