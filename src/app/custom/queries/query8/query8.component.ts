import { Component, OnInit } from '@angular/core';
import { Neo4jDb } from '../../../visuall/db-service/neo4j-db.service';
import { CytoscapeService } from '../../../visuall/cytoscape.service';
import { GlobalVariableService } from '../../../visuall/global-variable.service';
import { TableViewInput, TableDataType, TableFiltering, TableRowMeta, TableData } from '../../../shared/table-view/table-view-types';
import { Subject } from 'rxjs';
import { buildIdFilter, getOrderByExpression4Query, getQueryCondition4TxtFilter } from '../../queries/query-helper';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { GENERIC_TYPE, LONG_MAX, LONG_MIN } from 'src/app/visuall/constants';
import { TimebarGraphInclusionTypes } from 'src/app/visuall/user-preference';
export interface Collaborator {
  Name: string;
  CollaborationCount: number;
  CollaborationScore: number;
}
@Component({
  selector: 'app-query8',
  templateUrl: './query8.component.html',
  styleUrls: ['./query8.component.css']
})
export class Query8Component implements OnInit {
  
  developer: String = "";
  developers: number [] = [];
  developersName : String [] = [];
  scores: number [] = [];
  tableInput: TableViewInput = {
    columns: ['name','collaboration', 'score'], results: [], results2: [],isEmphasizeOnHover: true, tableTitle: 'Query Results', classNameOfObjects: 'Developer', isShowExportAsCSV: true,
    resultCnt: 0, currPage: 1, pageSize: 0, isLoadGraph: false, isMergeGraph: true, isNodeData: true, isSelect: false
  };
  tableFilled = new Subject<boolean>();
  tableResponse = null;
  graphResponse = null;
  clearTableFilter = new Subject<boolean>();
  number: Number = 3;
  constructor(private _dbService: Neo4jDb, private _cyService: CytoscapeService, private _g: GlobalVariableService) {
  }

  ngOnInit() {
    this.developer = this._g.cy.$(':selected')[0]._private.data.name;
    let name = "";
    setInterval(() => {
      if (this._g.cy.$(':selected').length > 0 && this._g.cy.$(':selected')[0]._private.classes.values().next().value === "Developer" && this._g.cy.$(':selected')[0]._private.data.name !== name) {
        name = this._g.cy.$(':selected')[0]._private.data.name
        this.developer = this._g.cy.$(':selected')[0]._private.data.name;
      }
    }, 500)
    this.tableInput.results = [];
    this._g.userPrefs.dataPageSize.subscribe(x => { this.tableInput.pageSize = x; });
  }

  prepareQuery() {
    this.tableInput.currPage = 1;
    this.clearTableFilter.next(true);
    const skip = (this.tableInput.currPage - 1) * this.tableInput.pageSize;
    this.loadTable(skip);
    this.loadGraph(skip);
  }

  loadTable(skip: number, filter?: TableFiltering) {
    this.developers = [];
    this.developersName = [];
    this.scores = [];
    const isClientSidePagination = this._g.userPrefs.queryResultPagination.getValue() == 'Client';
    const cb = (x) => {
      x.data.forEach(element => {
        this.developers.push(element[3])
        this.developersName.push("'" + element[2] + "'")
        this.scores.push(element[0])
      });
      const processedTableData = this.preprocessTableData(x);
      const limit4clientSidePaginated = this._g.userPrefs.dataPageSize.getValue() * this._g.userPrefs.dataPageLimit.getValue();
      let cnt = x.data.length;
      
      if (isClientSidePagination && cnt > limit4clientSidePaginated) {
        cnt = limit4clientSidePaginated;
        
      }
      if (isClientSidePagination) {
        this.fillTable(this.filterTableResponse(processedTableData, filter), cnt);
        
      } else {
        this.fillTable(processedTableData, cnt);
        
      }
      if (!filter) {
        this.tableResponse = processedTableData;
        
      }
    };
    if (isClientSidePagination && filter) {
      this.fillTable(this.filterTableResponse(this.tableResponse, filter), null);
      return;
    }
    const isIgnoreCase = this._g.userPrefs.isIgnoreCaseInText.getValue();
    const txtCondition = getQueryCondition4TxtFilter(filter, ['Developer'], isIgnoreCase);
    const ui2Db = {'name': 'n.name' };
    const orderExpr = getOrderByExpression4Query(filter, 'score', 'desc', ui2Db);
    const f1 = this.dateFilterFromUserPref('n', true);
    const f2 = this.dateFilterFromUserPref('issue', true);
    const f3 = this.dateFilterFromUserPref('d1', true);
    let f = '';
    if (f1.length > 0) {
      f += ' WHERE ' + f1.substr(5);
    }
    if (f2.length > 0) {
      f += f2;
    }
    if (f3.length > 0) {
      f += f3;
    }
    let dataCnt = this.tableInput.pageSize;
    if (isClientSidePagination) {
      dataCnt = this._g.userPrefs.dataPageLimit.getValue() * this._g.userPrefs.dataPageSize.getValue();
    }
    const r = `[${skip}..${skip + dataCnt}]`;
    const cql=`
    MATCH (d1:Developer {name: '${this.developer}'})
    MATCH (n:Developer)
    WHERE d1 <> n 
    MATCH (d1)-[comment1:COMMENTED]->(issue:Issue)<-[comment2:COMMENTED]-(n)  ${f} 
    WITH n, COUNT(DISTINCT issue) AS sharedIssues,
    SUM(comment1.commentCount + comment2.commentCount) AS totalComments
    WITH n, sharedIssues, totalComments, sharedIssues * totalComments AS score
    WHERE score > 0
    RETURN ElementId(n) as id, n.name AS name, sharedIssues AS collaboration, score ORDER BY ${orderExpr}
    LIMIT ${this.number}`
    this._dbService.runQuery(cql, cb, DbResponseType.table);
  }
  loadGraph(skip: number, filter?: TableFiltering) {
    if (!this.tableInput.isLoadGraph) {    
      return;
    } 
    const isClientSidePagination = this._g.userPrefs.queryResultPagination.getValue() == 'Client';   
    
    const cb = (x) => {
      
      if (isClientSidePagination) {
        this._cyService.loadElementsFromDatabase(this.filterGraphResponse(x), this.tableInput.isMergeGraph);
      } else {
        this._cyService.loadElementsFromDatabase(x, this.tableInput.isMergeGraph);
      }
      if (!filter || this.graphResponse == null) {
        this.graphResponse = x;
      }
      const seedNodes = this._g.cy.nodes(this.developers.map(x => '#n' + x).join());
      const currHighlightIdx = this._g.userPrefs.currHighlightIdx.getValue();
      if (currHighlightIdx == 0) {
        this._g.viewUtils.highlight(seedNodes, 1);
      } else {
        this._g.viewUtils.highlight(seedNodes, 0);
      }
    };
    if (isClientSidePagination && filter && this.graphResponse) {
      this._cyService.loadElementsFromDatabase(this.filterGraphResponse(this.graphResponse), this.tableInput.isMergeGraph);
      return;
    }
    const isIgnoreCase = this._g.userPrefs.isIgnoreCaseInText.getValue();
    const txtCondition = getQueryCondition4TxtFilter(filter, ['Developer'], isIgnoreCase);
    const ui2Db = {'name': 'n.name' };
    const orderExpr = getOrderByExpression4Query(filter, 'collaborationScore', 'desc', ui2Db);
    const f1 = this.dateFilterFromUserPref('n', true);
    const f2 = this.dateFilterFromUserPref('issue', true);
    const f3 = this.dateFilterFromUserPref('d1', true);
    let f = '';
    if (f1.length > 0) {
      f += ' WHERE ' + f1.substr(5);
    }
    if (f2.length > 0) {
      f += f2;
    }
    if (f3.length > 0) {
      f += f3;
    }
    const cql=`
    MATCH (d1:Developer {name: '${this.developer}'})
    MATCH (n:Developer)
    WHERE d1 <> n
    MATCH p =  (d1)-[comment1:COMMENTED]->(issue:Issue)<-[comment2:COMMENTED]-(n)  ${f} 
    WITH n, COUNT(DISTINCT issue) AS sharedIssues,
    SUM(comment1.commentCount + comment2.commentCount) AS totalComments, collect(p) AS paths
    WITH sharedIssues * totalComments AS collaborationScore,paths
    ORDER BY ${orderExpr}
    LIMIT ${this.number}
    RETURN paths`
    this._dbService.runQuery(cql, cb);
   
  }
  private filterGraphResponse(x: GraphResponse): GraphResponse {
    const r: GraphResponse = { nodes: [], edges: x.edges };
   
    const nodeIdDict = {};
    for (let i = 0; i < this.tableInput.results.length; i++) {
      nodeIdDict[this.tableInput.results[i][0].val] = true;
    }
    // add a node if an edge ends with that
    for (let i = 0; i < x.edges.length; i++) {
      if (nodeIdDict[x.edges[i].endNodeElementId]) {
        nodeIdDict[x.edges[i].startNodeElementId] = true;
      }
      else if (nodeIdDict[x.edges[i].startNodeElementId]) {
        nodeIdDict[x.edges[i].endNodeElementId] = true;
      }
    }
    for (let i = 0; i < x.nodes.length; i++) {
      if (nodeIdDict[x.nodes[i].elementId]) {
        r.nodes.push(x.nodes[i]);
      }
    }
    return r;
  }


  fillTable(data: Collaborator[], totalDataCount: number | null) {
    const uiColumns = ['id'].concat(this.tableInput.columns);
    const columnTypes = [TableDataType.string, TableDataType.string,TableDataType.number,TableDataType.number];

    this.tableInput.results = [];
    for (let i = 0; i < data.length; i++) {
      const row: TableData[] = [];
      for (let j = 0; j < uiColumns.length; j++) {
        row.push({ type: columnTypes[j], val: String(data[i][uiColumns[j]]) })
      }
      row.push(); 
      this.tableInput.results.push(row)

    }
    if (totalDataCount) {
      this.tableInput.resultCnt = totalDataCount;
    }
    
    this.tableFilled.next(true);
  }

  getDataForQueryResult(e: TableRowMeta) {
    const cb = (x) => {
      this._cyService.loadElementsFromDatabase(x, this.tableInput.isMergeGraph)
    }
    const idFilter = buildIdFilter(e.dbIds);
    const ui2Db = {'issue': 'n.name'};

    const cql=`
    MATCH (d1:Developer {name: '${this.developer}'})
    MATCH (n:Developer)
    WHERE d1 <> n and and ${idFilter} 
    MATCH p =  (d1)-[comment1:COMMENTED]->(issue:Issue)<-[comment2:COMMENTED]-(n)
    WITH n, COUNT(DISTINCT issue) AS sharedIssues,
    SUM(comment1.commentCount + comment2.commentCount) AS totalComments, p
    WITH n, sharedIssues, totalComments, sharedIssues * totalComments AS collaborationScore, collect(p) AS paths
    WHERE collaborationScore > 0
    RETURN paths`

    this._dbService.runQuery(cql, cb);
  }

  filterTable(filter: TableFiltering) {
    this.tableInput.currPage = 1;
    let skip = filter.skip ? filter.skip : 0;
    this.loadTable(skip, filter);
    if (this.tableInput.isLoadGraph) {
      this.loadGraph(skip, filter);
    }
  }

  // zip paralel arrays 
  private preprocessTableData(data): Collaborator[] {
    const dbColumns = data.columns as string[];
    const uiColumns = ['id'].concat(this.tableInput.columns);
    let columnMapping = [];
    for (let i = 0; i < uiColumns.length; i++) {
      columnMapping.push(dbColumns.indexOf(uiColumns[i]));
    }
    const rawData = data.data;
    const objArr: Collaborator[] = [];
    for (let i = 0; i < rawData.length; i++) {
      const obj = {};
      for (let j = 0; j < columnMapping.length; j++) {
        obj[uiColumns[j]] = rawData[i][columnMapping[j]];
      }
      objArr.push(obj as Collaborator)
    }
    return objArr;
  }

  private filterTableResponse(x: Collaborator[], filter: TableFiltering): Collaborator[] {
    if (!filter || ((!filter.txt || filter.txt.length < 1) && filter.orderDirection == '' && (!filter.skip || filter.skip == 0))) {
      const skip = filter && filter.skip ? filter.skip : 0;
      this.tableInput.resultCnt = x.length;
      return x.slice(skip, skip + this._g.userPrefs.dataPageSize.getValue());
    }
    const isIgnoreCase = this._g.userPrefs.isIgnoreCaseInText.getValue();
    let filtered: Collaborator[] = [];

    for (let i = 0; i < x.length; i++) {
      const s = Object.values(x[i]).join('');
      if ((isIgnoreCase && s.toLowerCase().includes(filter.txt.toLowerCase())) || (!isIgnoreCase && s.includes(filter.txt))) {
        filtered.push(x[i]);
      }
    }

    // order by
    if (filter && filter.orderDirection.length > 0) {
      const o = filter.orderBy;
      if (filter.orderDirection == 'asc') {
        filtered = filtered.sort((a, b) => { if (!a[o]) return 1; if (!b[o]) return -1; if (a[o] > b[o]) return 1; if (b[o] > a[o]) return -1; return 0 });
      } else {
        filtered = filtered.sort((a, b) => { if (!a[o]) return 1; if (!b[o]) return -1; if (a[o] < b[o]) return 1; if (b[o] < a[o]) return -1; return 0 });
      }
    }
    if (filter) {
      this.tableInput.resultCnt = filtered.length;
    }
    const skip = filter && filter.skip ? filter.skip : 0;
    return filtered.slice(skip, skip + this._g.userPrefs.dataPageSize.getValue());
  }
  // tableInput is already filtered. Use that to filter graph elements.
  // For this query, we should specifically bring the related nodes and their 1-neighborhood


  private dateFilterFromUserPref(varName: string, isNode: boolean): string {
    if (!this._g.userPrefs.isLimitDbQueries2range.getValue()) {
      return '';
    }
    let s = '';
    let keys = [];

    if (isNode) {
      keys = Object.keys(this._g.appDescription.getValue().objects);
    } else {
      keys = Object.keys(this._g.appDescription.getValue().relations);
    }

    const d1 = this._g.userPrefs.dbQueryTimeRange.start.getValue();
    const d2 = this._g.userPrefs.dbQueryTimeRange.end.getValue();
    const inclusionType = this._g.userPrefs.objectInclusionType.getValue();
    const mapping = this._g.appDescription.getValue().timebarDataMapping;

    if (!mapping || Object.keys(mapping).length < 1) {
      return '';
    }

    s = ' AND (';
    for (const k of keys) {
      if (!mapping[k]) {
        continue;
      }
      const p1 = `COALESCE(${varName}.${mapping[k].begin_datetime}, ${LONG_MIN})`;
      const p2 = `COALESCE(${varName}.${mapping[k].end_datetime}, ${LONG_MAX})`;
      const bothNull = `(${varName}.${mapping[k].end_datetime} IS NULL AND ${varName}.${mapping[k].begin_datetime} IS NULL)`
      if (inclusionType == TimebarGraphInclusionTypes.overlaps) {
        s += `(${bothNull} OR (${p1} <= ${d2} AND ${p2} >= ${d1})) AND`;
      } else if (inclusionType == TimebarGraphInclusionTypes.contains) {
        s += `(${bothNull} OR (${d1} <= ${p1} AND ${d2} >= ${p2})) AND`;
      } else if (inclusionType == TimebarGraphInclusionTypes.contained_by) {
        s += `(${bothNull} OR (${p1} <= ${d1} AND ${p2} >= ${d2})) AND`;
      }

    }
    s = s.slice(0, -4)
    s += ')'
    return s;
  }
}
