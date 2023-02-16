import { Component, OnInit } from '@angular/core';
import { Neo4jDb } from '../../../visuall/db-service/neo4j-db.service';
import { CytoscapeService } from '../../../visuall/cytoscape.service';
import { GlobalVariableService } from '../../../visuall/global-variable.service';
import { TableViewInput, TableDataType, TableFiltering, TableRowMeta, TableData } from '../../../shared/table-view/table-view-types';
import { Subject } from 'rxjs';
import { buildIdFilter, getOrderByExpression4Query, getQueryCondition4TxtFilter } from '../query-helper';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';

//This query is for 
export interface CommitData {
  id:string;
  name:string;
}
@Component({
  selector: 'app-query1',
  templateUrl: './query1.component.html',
  styleUrls: ['./query1.component.css']
})

export class Query1Component implements OnInit {

  developer: string;
  developers: string[];
  tableInput: TableViewInput = {
    columns:['name'], results: [], isEmphasizeOnHover: true, tableTitle: 'Query Results', classNameOfObjects: 'Commit', isShowExportAsCSV: true,
    resultCnt: 0, currPage: 1, pageSize: 0, isLoadGraph: false, isMergeGraph: true, isNodeData: true
  };
  tableFilled = new Subject<boolean>();
  tableResponse = null;
  graphResponse = null;
  clearTableFilter = new Subject<boolean>();

  constructor(private _dbService: Neo4jDb, private _cyService: CytoscapeService, private _g: GlobalVariableService) {
    this.developers = [];
  }

  ngOnInit() {
    this.developer = "Davide Palmisano";
  
    setTimeout(() => {
      this._dbService.runQuery("MATCH (n:Developer )RETURN distinct n.name", (x) => this.fillGenres(x), DbResponseType.table);
    }, 0);
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
    const isClientSidePagination = this._g.userPrefs.queryResultPagination.getValue() == 'Client';
    const cb = (x) => {
      const processedTableData = this.preprocessTableData(x);
      const limit4clientSidePaginated = this._g.userPrefs.dataPageSize.getValue() * this._g.userPrefs.dataPageLimit.getValue();
      let cnt = x.data[0][2];
      console.log(cnt)
      if (isClientSidePagination && cnt > limit4clientSidePaginated) {
        cnt = limit4clientSidePaginated;
        console.log(cnt)
      }
      if (isClientSidePagination) {
        this.fillTable(this.filterTableResponse(processedTableData, filter), cnt);
        console.log(cnt)
      } else {
        this.fillTable(processedTableData, cnt);
        console.log(cnt)
      }
      if (!filter) {
        this.tableResponse = processedTableData;
        console.log(cnt)
      }
    };
    if (isClientSidePagination && filter) {
      this.fillTable(this.filterTableResponse(this.tableResponse, filter), null);
      console.log("l")
      return;
    }
    const isIgnoreCase = this._g.userPrefs.isIgnoreCaseInText.getValue();
    const txtCondition = getQueryCondition4TxtFilter(filter, ['n.name'], isIgnoreCase);
    const ui2Db = { 'name': 'n.name' };
    console.log("k")
    const orderExpr = getOrderByExpression4Query(filter, 'n.name', 'desc', ui2Db);
    console.log("k")
    const dateFilter = this.getDateRangeCQL();
    let dataCnt = this.tableInput.pageSize;
    console.log("k")
    if (isClientSidePagination) {
      dataCnt = this._g.userPrefs.dataPageLimit.getValue() * this._g.userPrefs.dataPageSize.getValue();
    } 
    const r = `[${skip}..${skip + dataCnt}]`;

    const cql = `MATCH (Developer {name: '${this.developer}' })--(n:Commit)
    WHERE  ${dateFilter} ${txtCondition} 
    WITH DISTINCT n ORDER BY ${orderExpr}
    RETURN collect(ID(n))${r} as id, collect(n.name) as name, size(collect(ID(n))) as totalDataCount`;
    this._dbService.runQuery(cql, cb, DbResponseType.table);
    console.log("k")
    
  }

  loadGraph(skip: number, filter?: TableFiltering) {
    if (!this.tableInput.isLoadGraph) {    
      console.log("bu")
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

    const isIgnoreCase = this._g.userPrefs.isIgnoreCaseInText.getValue();
    const txtCondition = getQueryCondition4TxtFilter(filter, ['n.name'], isIgnoreCase);
    const ui2Db = { 'name': 'n.name' };
    const orderExpr = getOrderByExpression4Query(filter, 'n.name', 'desc', ui2Db);
    const dateFilter = this.getDateRangeCQL();
    let dataCnt = this.tableInput.pageSize;
    if (isClientSidePagination) {
      dataCnt = this._g.userPrefs.dataPageLimit.getValue() * this._g.userPrefs.dataPageSize.getValue();
    }
    const cql =`MATCH (Developer {name:'${this.developer}' })-[r:COMMITS]->(n:Commit)
    WHERE  ${dateFilter} ${txtCondition}
    RETURN n,r
    SKIP ${skip} LIMIT ${dataCnt}`;
    this._dbService.runQuery(cql, cb);
   
  }

  fillTable(data: CommitData[], totalDataCount: number | null) {
    const uiColumns = ['id'].concat(this.tableInput.columns);
    const columnTypes = [ TableDataType.string,TableDataType.string];
    
    this.tableInput.results = [];
  
    for (let i = 0; i < data.length; i++) {
      const row: TableData[] = [];
      for (let j = 0; j < uiColumns.length; j++) {

        row.push({ type: columnTypes[j], val: data[i][uiColumns[j]] })
      }
      this.tableInput.results.push(row)
    }
    if (totalDataCount) {
      this.tableInput.resultCnt = totalDataCount;
    }
    
    this.tableFilled.next(true);
  }

  fillGenres(data) {
    this.developers = [];
    for (let i = 0; i < data.data.length; i++) {
      this.developers.push(data.data[i].join(''));
      
    }
  }
  getDataForQueryResult(e: TableRowMeta) {
    const cb = (x) => this._cyService.loadElementsFromDatabase(x, this.tableInput.isMergeGraph)

    const idFilter = buildIdFilter(e.dbIds);
    const ui2Db = { 'name': 'n.name' };
    const orderExpr = getOrderByExpression4Query(null, 'n.name', 'desc', ui2Db);
    const dateFilter = this.getDateRangeCQL();


    const cql =`MATCH (Developer {name: '${this.developer}' })-[r:COMMITS]->(n:Commit)
    WHERE  ${idFilter} ${dateFilter}
    RETURN n,r,Developer
    SKIP 0 LIMIT ${this.tableInput.pageSize}`;
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
  private preprocessTableData(data): CommitData[] {
      
    
    const dbColumns = data.columns as string[];
    const uiColumns = ['id'].concat(this.tableInput.columns);
    let columnMapping = [];
    for (let i = 0; i < uiColumns.length; i++) {
      columnMapping.push(dbColumns.indexOf(uiColumns[i]));
      
    }
    const rawData = data.data[0];
    const objArr: CommitData[] = [];
    for (let i = 0; i < rawData[0].length; i++) {
      const obj = {};
      for (let j = 0; j < columnMapping.length; j++) {
        obj[uiColumns[j]] = rawData[columnMapping[j]][i];
      }
      objArr.push(obj as CommitData)
    }
    return objArr;
  }

  private filterTableResponse(x: CommitData[], filter: TableFiltering): CommitData[] {
    if (!filter || ((!filter.txt || filter.txt.length < 1) && filter.orderDirection == '' && (!filter.skip || filter.skip == 0))) {
      const skip = filter && filter.skip ? filter.skip : 0;
      this.tableInput.resultCnt = x.length;
      return x.slice(skip, skip + this._g.userPrefs.dataPageSize.getValue());
    }
    const isIgnoreCase = this._g.userPrefs.isIgnoreCaseInText.getValue();
    let filtered: CommitData[] = [];

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
    }
    for (let i = 0; i < x.nodes.length; i++) {
      if (nodeIdDict[x.nodes[i].id]) {
        r.nodes.push(x.nodes[i]);
      }
    }
    return r;
  }

  private getDateRangeCQL() {
    const isLimit = this._g.userPrefs.isLimitDbQueries2range.getValue();
    if (!isLimit) {
      return 'TRUE';
    }
    const d1 = this._g.userPrefs.dbQueryTimeRange.start.getValue();
    const d2 = this._g.userPrefs.dbQueryTimeRange.end.getValue();
    const a = new Date(d1 );
    const c = new Date(d2);
    const b = a.toISOString()
    const d =c.toISOString()
    console.log(b)

    return `n.createdAt > ${d1}  AND  n.createdAt < ${d2} `;
  }

}
 