import { Component, OnInit } from '@angular/core';
import { Neo4jDb } from '../../../visuall/db-service/neo4j-db.service';
import { CytoscapeService } from '../../../visuall/cytoscape.service';
import { GlobalVariableService } from '../../../visuall/global-variable.service';
import { TableViewInput, TableDataType, TableFiltering, TableRowMeta, TableData } from '../../../shared/table-view/table-view-types';
import { Subject } from 'rxjs';
import { buildIdFilter, getOrderByExpression4Query, getQueryCondition4TxtFilter } from '../query-helper';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { getCyStyleFromColorAndWid } from 'src/app/visuall/constants';

export interface Anomaly {
  id:number;
  Developer: string;
  Issues: string;
  Count: number;
}
@Component({
  selector: 'app-query4',
  templateUrl: './query4.component.html',
  styleUrls: ['./query4.component.css']
})
export class Query4Component implements OnInit {


  
  tableInput: TableViewInput = {
    columns: ['Developer','Issues','Count'], results: [], isEmphasizeOnHover: true, tableTitle: 'Query Results', classNameOfObjects: 'Developer', isShowExportAsCSV: true,
    resultCnt: 0, currPage: 1, pageSize: 0, isLoadGraph: false, isMergeGraph: true, isNodeData: true
  };
  tableFilled = new Subject<boolean>();
  tableResponse = null;
  graphResponse = null;
  clearTableFilter = new Subject<boolean>();

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
    this.loadGraph(skip);
  }

  loadTable(skip: number, filter?: TableFiltering) {
    const isClientSidePagination = this._g.userPrefs.queryResultPagination.getValue() == 'Client';
    const cb = (x) => {
      console.log(x.data)
      const processedTableData = this.preprocessTableData(x);
      const limit4clientSidePaginated = this._g.userPrefs.dataPageSize.getValue() * this._g.userPrefs.dataPageLimit.getValue();
      let cnt = x.data.length;
      if (isClientSidePagination && cnt > limit4clientSidePaginated) {
        cnt = limit4clientSidePaginated;
      }
      if (isClientSidePagination) {
        console.log(cnt)
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
    const ui2Db = { 'Developer': 'Developer' ,'Issues': 'Issues','Count': 'Count'};
    const orderExpr = getOrderByExpression4Query(filter, 'Count', 'desc', ui2Db);
    const dateFilter = this.getDateRangeCQL();
    let dataCnt = this.tableInput.pageSize;
    if (isClientSidePagination) {
      dataCnt = this._g.userPrefs.dataPageLimit.getValue() * this._g.userPrefs.dataPageSize.getValue();
    }
    const r = `[${skip}..${skip + dataCnt}]`;

    const cql = ` MATCH (n:Developer)-[r]->(issue:Issue)
    WHERE issue.resolver= n.name and issue.closer = n.name and ${dateFilter}
    RETURN  ID(n) as id,  n.name AS Developer, Collect(distinct issue.name) AS Issues, count(distinct issue.name) as Count ORDER BY ${orderExpr} `
    this._dbService.runQuery(cql, cb, DbResponseType.table);
  }
  loadGraph(skip: number, filter?: TableFiltering) {
    if (!this.tableInput.isLoadGraph) {    
      return;
    } 
    const isClientSidePagination = this._g.userPrefs.queryResultPagination.getValue() == 'Client';
    
    const cb = (x) => {
      this._cyService.loadElementsFromDatabase(x, this.tableInput.isMergeGraph)
      console.log(x)
      let nodeIds = []
      let edegeIds = []
      console.log(x)
      x.nodes.forEach(node => {
        nodeIds.push(node.id)
      });
      x.edges.forEach(edge => {
        edegeIds.push(edge.id)
      });
      const seedEdges = this._g.cy.edges(edegeIds.map(x => '#e' + x).join());
      const seedNodes = this._g.cy.nodes(nodeIds.map(x => '#n' + x).join());
      this._g.viewUtils.highlight(seedNodes, 3);
      this._g.viewUtils.highlight(seedEdges, 3);
    }

    const ui2Db = { 'Developer': 'Developer' ,'Issues': 'Issues','Count': 'Count'};
    const orderExpr = getOrderByExpression4Query(null, 'Count', 'desc', ui2Db);
    const dateFilter = this.getDateRangeCQL();
    
    const cql = ` MATCH (n:Developer)-[r1:RESOLVE ]->(issue:Issue)
    MATCH (n)-[r2:CLOSE]->(issue)
    WHERE issue.resolver= n.name and issue.closer = n.name  AND ${dateFilter}
    RETURN  n, r1,r2, issue SKIP 0 `
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

    console.log(uiColumns)
    const columnTypes = [TableDataType.number, TableDataType.string, TableDataType.string,TableDataType.number];
    console.log(data)
    this.tableInput.results = [];
  
    for (let i = 0; i < data.length; i++) {
      const row: TableData[] = []     
      for (let j = 0; j < uiColumns.length; j++) {
        if(uiColumns[j] == "Issues" && data[i][uiColumns[j]].length>3 ){
          data[i][uiColumns[j]] = data[i][uiColumns[j]].slice(0,3).join(" , ")
          data[i][uiColumns[j]]  = "[" + data[i][uiColumns[j]] + " ...]"
          row.push({ type: columnTypes[j], val: data[i][uiColumns[j]] })
        }
        else if (uiColumns[j] == "Issues" && data[i][uiColumns[j]].length<=3 ){
          data[i][uiColumns[j]] = data[i][uiColumns[j]].join(" , ")
          data[i][uiColumns[j]]  = "[" + data[i][uiColumns[j]] + " ]";
          row.push({ type: columnTypes[j], val: data[i][uiColumns[j]] })
        }
        else{
          row.push({ type: columnTypes[j], val: data[i][uiColumns[j]] })
        }
        
      }
      this.tableInput.results.push(row)
    }
    console.log(this.tableInput.results )
    if (totalDataCount) {
      this.tableInput.resultCnt = totalDataCount;
    }
    console.log(this.tableInput)

    this.tableFilled.next(true);
  }


  getDataForQueryResult(e: TableRowMeta) {
    const cb = (x) => {
      this._cyService.loadElementsFromDatabase(x, this.tableInput.isMergeGraph)
      let nodeIds = []
      let edegeIds = []
      console.log(x)
      x.nodes.forEach(node => {
        nodeIds.push(node.id)
      });
      x.edges.forEach(edge => {
        edegeIds.push(edge.id)
      });
      const seedEdges = this._g.cy.edges(edegeIds.map(x => '#e' + x).join());
      const seedNodes = this._g.cy.nodes(nodeIds.map(x => '#n' + x).join());
      this._g.viewUtils.highlight(seedNodes, 3);
      this._g.viewUtils.highlight(seedEdges, 3);
    }
    const idFilter = buildIdFilter(e.dbIds);
    const ui2Db = { 'Developer': 'Developer' ,'Issues': 'Issues','Count': 'Count'};
    const orderExpr = getOrderByExpression4Query(null, 'Count', 'desc', ui2Db);
    const dateFilter = this.getDateRangeCQL();
    
    const cql = ` MATCH (n:Developer)-[r1:RESOLVE ]->(issue:Issue)
    MATCH (n)-[r2:CLOSE]->(issue)
    WHERE issue.resolver= n.name and issue.closer = n.name  AND ${idFilter}
    RETURN  n, r1,r2, issue SKIP 0 `
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