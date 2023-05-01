import { Component, OnInit } from '@angular/core';
import { Neo4jDb } from '../../../visuall/db-service/neo4j-db.service';
import { CytoscapeService } from '../../../visuall/cytoscape.service';
import { GlobalVariableService } from '../../../visuall/global-variable.service';
import { TableViewInput, TableDataType, TableFiltering, TableRowMeta, TableData } from '../../../shared/table-view/table-view-types';
import { Subject } from 'rxjs';
import { buildIdFilter, getOrderByExpression4Query, getQueryCondition4TxtFilter } from '../query-helper';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';

export interface Anomaly {
  id: string;
  issue: string;
  anomalies: string;
}
@Component({
  selector: 'app-query6',
  templateUrl: './query6.component.html',
  styleUrls: ['./query6.component.css']
})
export class Query6Component implements OnInit {


  tableInput: TableViewInput = {
    columns: ['issue', 'anomalies'], results: [], results2: [], isEmphasizeOnHover: true, tableTitle: 'Query Results', classNameOfObjects: 'Commit', isShowExportAsCSV: true,
    resultCnt: 0, currPage: 1, pageSize: 0, isLoadGraph: false, isMergeGraph: true, isNodeData: true
  };
  tableFilled = new Subject<boolean>();
  tableResponse = null;
  graphResponse = null;
  clearTableFilter = new Subject<boolean>();
  count: number;
  issueList:string[] = [];
  constructor(private _dbService: Neo4jDb, private _cyService: CytoscapeService, private _g: GlobalVariableService) {
  }

  ngOnInit() {
    setTimeout(() => {

    }, 0);
    this.tableInput.results = [];
    this._g.userPrefs.dataPageSize.subscribe(x => { this.tableInput.pageSize = x; });
  }

  prepareQuery() {
    this.tableInput.currPage = 1;
    this.clearTableFilter.next(true);
    const skip = (this.tableInput.currPage - 1) * this.tableInput.pageSize;
    this.loadTable(skip);
    
  }

  //Anomaly Detection Queries




  async anomaly11(issue_name): Promise<any> {
    const count = this._g.userPrefs?.anomalyDefaultValues?.reopenCount.getValue() || 1;
    const cql = ` MATCH (n:Developer)-[r]->(issue:Issue)
    WHERE issue.resolver= n.name and issue.closer = n.name and issue.name = '${issue_name}'
    WITH count(n) AS count
    RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, "Same resolver closer");
  }
  async anomaly10(issue_name): Promise<any> {
    const count = this._g.userPrefs?.anomalyDefaultValues?.reopenCount.getValue() || 1;
    const cql = `MATCH (n:Issue)  WHERE n.duplicate='True' 
    AND NOT (n)-[:DUPLICATES]-() and  n.name = '${issue_name}'
    WITH count(n) AS count
    RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, "Not Referenced duplicates");
  }
  async anomaly9(issue_name): Promise<any> {
    const count = this._g.userPrefs?.anomalyDefaultValues?.reopenCount.getValue() || 1;
    const cql = ` MATCH (n:Issue) 
    WHERE n.reopenCount>=${count} and  n.name = '${issue_name}'
    WITH count(n) AS count
    RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, "Closed reopen ping pong");
  }


  async anomaly8(issue_name): Promise<any> {
    const cql = `MATCH (n:Issue)
    WHERE EXISTS(n.assignee) AND EXISTS(n.resolver) AND  EXISTS(n.assignee) AND EXISTS(n.resolver) and  n.name = '${issue_name}'
    WITH n, n.assignee AS assignee, n.resolver AS resolver
    WHERE assignee <> resolver  
    WITH count(n) AS count,assignee,resolver
    RETURN CASE WHEN count = 0 THEN false ELSE true END, assignee, resolver`;
    return await this.runAnomalyQuery(cql, "No assignee resolver:");

  }


  async anomaly7(issue_name): Promise<any> {
    const cql = `MATCH (n) 
    WHERE NOT  EXISTS(n.environment) and n.affectedVersion = '' and n.name = '${issue_name}'
    WITH count(n) AS count
    RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, "No comment on issue");
  }
  async anomaly6(): Promise<any> {


  }
  async anomaly5(issue_name): Promise<any> {
    const cql = ` MATCH (n:Issue) WHERE NOT EXISTS(n.priority)  and  n.name = '${issue_name}'
    WITH count(n) AS count
     RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, "Missing priority");

  }


  async anomaly4(): Promise<any> {
    return "";
  }


  async anomaly3(issue_name): Promise<any> {
    const time = this._g.userPrefs?.anomalyDefaultValues?.ignoreBug.getValue() || 1;
    const cql = `MATCH (n:Issue)
    WHERE exists(n.history) AND size(n.history) >= 2 and n.name = '${issue_name}'
    WITH n, range(0, size(n.history)-2) as index_range
    UNWIND index_range as i
    WITH n, i, datetime(n.history[i]) as from, datetime(n.history[i+1]) as to
    WHERE duration.between(from, to).months > ${time} 
    WITH  from, to, count(n) AS count
    RETURN CASE WHEN count = 0 THEN false ELSE true  END, from, to`;
    return await this.runAnomalyQuery(cql, `Ignored bug:`);
  }

  async anomaly2(issue_name): Promise<any> {
    const cql = `MATCH (n:Issue{status:'Done' })
    WHERE NOT (n)-[:REFERENCES]->() and n.commitIds=[] and n.name = '${issue_name}'
    WITH count(n) AS count
    RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, "No link to bug fixing commit or pull request");

  }

  async anomaly1(issue_name): Promise<any> {
    const cql = `MATCH (n:Issue {status: 'Done'})
      WHERE NOT EXISTS(n.assignee) AND n.name = '${issue_name}'
      WITH count(n) AS count
      RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, "Unassigned issue");
  }
  async runAnomalyQuery(cql: string, name: string) {
    return new Promise((resolve, reject) => {
      const cb = (x) => {
        const result = x.data[0]
        if (result && result[0]) {
          resolve(true);
        }
        else {
          resolve(false);
        }
      };
      this._dbService.runQuery(cql, cb, DbResponseType.table);
    });
  }

  async activateAnomalyCues(issue) {

    //TODO:Number of detected anomalies 
    let anomalies = [
      { text: 'Unassigned Bugs', isEnable: false, path2userPref: this.anomaly1.bind(this) },
      { text: 'No Link to Bug-Fixing Commit', isEnable: false, path2userPref: this.anomaly2.bind(this) },
      { text: 'Ignored Bugs', isEnable: false, path2userPref: this.anomaly3.bind(this) },
      { text: 'Bugs Assigned to a Team', isEnable: false, path2userPref: this.anomaly4.bind(this) },
      { text: 'Missing Priority', isEnable: false, path2userPref: this.anomaly5.bind(this) },
      { text: 'Missing Environment Information', isEnable: false, path2userPref: this.anomaly6.bind(this) },
      { text: 'No comment bugs', isEnable: false, path2userPref: this.anomaly7.bind(this) },
      { text: 'Non-Assignee Resolver of Bug', isEnable: false, path2userPref: this.anomaly8.bind(this) },
      { text: 'Closed-Reopen Ping Pong', isEnable: false, path2userPref: this.anomaly9.bind(this) },
      { text: 'Not Referenced Duplicates', isEnable: false, path2userPref: this.anomaly10.bind(this) },
      { text: 'Same Resolver Closer', isEnable: false, path2userPref: this.anomaly11.bind(this) }
    ];


    const queries = anomalies.map((anomaly) => anomaly.path2userPref(issue[0]));
    const queryResults = await Promise.all(queries);
    let anomaliesWithTrueResults = anomalies
      .filter((anomaly, index) => queryResults[index]) // filter out items whose function returns false
      .map(anomaly => anomaly.text);
    let number = anomaliesWithTrueResults.length;
    if (number == this.count) {
      let item={
        id: issue[1],
        issue: issue[0],
        anomalies: anomaliesWithTrueResults.toString()
      }
      return item
    }
    else{
      return false
    }

  }


  async loadTable(skip: number, filter?: TableFiltering) {
    const isClientSidePagination = this._g.userPrefs.queryResultPagination.getValue() == 'Client';
    const cb = (x) => {
      const processedTableData = [];
      this.issueList = []
      const promises = x.data.map((issue) => {
        return this.activateAnomalyCues(issue);
      });
    
      Promise.all(promises).then((results) => {
        results.forEach((result) => {
          if (result) {
            processedTableData.push(result);
          } else {
          }
        });
        const limit4clientSidePaginated = this._g.userPrefs.dataPageSize.getValue() * this._g.userPrefs.dataPageLimit.getValue();
        let cnt = processedTableData.length;
    
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
        processedTableData.forEach(issue => {
          this.issueList.push(`'${issue.issue}'`);
        });
        this.loadGraph(skip);
      }).catch((error) => {
      });
      
    };
    if (isClientSidePagination && filter) {
      this.fillTable(this.filterTableResponse(this.tableResponse, filter), null);
      return;
    }
    const isIgnoreCase = this._g.userPrefs.isIgnoreCaseInText.getValue();
    const txtCondition = getQueryCondition4TxtFilter(filter, ['Issue'], isIgnoreCase);
    const ui2Db = { 'issue': 'n.name' };
    const orderExpr = getOrderByExpression4Query(filter, 'id', 'desc', ui2Db);
    const dateFilter = this.getDateRangeCQL();
    let dataCnt = this.tableInput.pageSize;
    if (isClientSidePagination) {
      dataCnt = this._g.userPrefs.dataPageLimit.getValue() * this._g.userPrefs.dataPageSize.getValue();
    }
    const r = `[${skip}..${skip + dataCnt}]`;
    const cql = `MATCH(n:Issue) 
    RETURN  ID(n) as id,  n.name AS issue ORDER BY ${orderExpr} LIMIT 100`
    this._dbService.runQuery(cql, cb, DbResponseType.table);
  }




  loadGraph(skip: number, filter?: TableFiltering) {
    if (!this.tableInput.isLoadGraph) {
      return;
    }
    const isClientSidePagination = this._g.userPrefs.queryResultPagination.getValue() == 'Client';

    const cb = (x) => {
      console.log(x)
      if (isClientSidePagination) {
        this._cyService.loadElementsFromDatabase(this.filterGraphResponse(x), this.tableInput.isMergeGraph);
      } else {
        this._cyService.loadElementsFromDatabase(x, this.tableInput.isMergeGraph);
      }
      if (!filter || this.graphResponse == null) {
        this.graphResponse = x;
      }
    };
    if (isClientSidePagination && filter && this.graphResponse) {
      this._cyService.loadElementsFromDatabase(this.filterGraphResponse(this.graphResponse), this.tableInput.isMergeGraph);
      return;
    }
    const ui2Db = { 'issue': 'n.name' };
    const orderExpr = getOrderByExpression4Query(null, 'Count', 'desc', ui2Db);
    const dateFilter = this.getDateRangeCQL();
    const cql = `MATCH (n:Issue) WHERE n.name in [${this.issueList}] OPTIONAL MATCH  (n)-[r]-(d) return n,d,r`
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
      if (nodeIdDict[x.edges[i].endNode]) {
        nodeIdDict[x.edges[i].startNode] = true;
      }
      else if (nodeIdDict[x.edges[i].startNode]) {
        nodeIdDict[x.edges[i].endNode] = true;
      }
    }
    for (let i = 0; i < x.nodes.length; i++) {
      if (nodeIdDict[x.nodes[i].id]) {
        r.nodes.push(x.nodes[i]);
      }
    }
    return r;
  }


  fillTable(data: Anomaly[], totalDataCount: number | null) {
    const uiColumns = ['id'].concat(this.tableInput.columns);
    const columnTypes = [TableDataType.string, TableDataType.string, TableDataType.string];

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
    const ui2Db = { 'issue': 'n.name' };

    const cql = `MATCH (n:Issue) WHERE ${idFilter}  OPTIONAL MATCH  (n)-[r]-(d) return n,d,r`
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
  private preprocessTableData(data): Anomaly[] {
    const dbColumns = data.columns as string[];
    const uiColumns = ['id'].concat(this.tableInput.columns);
    let columnMapping = [];
    for (let i = 0; i < uiColumns.length; i++) {
      columnMapping.push(dbColumns.indexOf(uiColumns[i]));
    }
    const rawData = data.data;
    const objArr: Anomaly[] = [];
    for (let i = 0; i < rawData.length; i++) {
      const obj = {};
      for (let j = 0; j < columnMapping.length; j++) {
        obj[uiColumns[j]] = rawData[i][columnMapping[j]];
      }
      objArr.push(obj as Anomaly)
    }
    return objArr;
  }

  private filterTableResponse(x: Anomaly[], filter: TableFiltering): Anomaly[] {
    if (!filter || ((!filter.txt || filter.txt.length < 1) && filter.orderDirection == '' && (!filter.skip || filter.skip == 0))) {
      const skip = filter && filter.skip ? filter.skip : 0;
      this.tableInput.resultCnt = x.length;
      return x.slice(skip, skip + this._g.userPrefs.dataPageSize.getValue());
    }
    const isIgnoreCase = this._g.userPrefs.isIgnoreCaseInText.getValue();
    let filtered: Anomaly[] = [];

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


  private getDateRangeCQL() {
    const isLimit = this._g.userPrefs.isLimitDbQueries2range.getValue();
    if (!isLimit) {
      return 'TRUE';
    }
    const d1 = this._g.userPrefs.dbQueryTimeRange.start.getValue();
    const d2 = this._g.userPrefs.dbQueryTimeRange.end.getValue();
    return `n.start > ${d1} AND n.end < ${d2}`;
  }
}
