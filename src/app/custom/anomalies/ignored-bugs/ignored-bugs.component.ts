import { Component, OnInit } from '@angular/core';
import { Neo4jDb } from '../../../visuall/db-service/neo4j-db.service';
import { CytoscapeService } from '../../../visuall/cytoscape.service';
import { GlobalVariableService } from '../../../visuall/global-variable.service';
import { TableViewInput, TableDataType, TableFiltering, TableRowMeta, TableData } from '../../../shared/table-view/table-view-types';
import { Subject } from 'rxjs';
import { buildIdFilter, getOrderByExpression4Query, getQueryCondition4TxtFilter } from '../../queries/query-helper';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { getCyStyleFromColorAndWid } from 'src/app/visuall/constants';

export interface Anomaly {
  Issue: string;
  Assignee: string;
  From: Date;
  To: Date;
}

@Component({
  selector: 'app-ignored-bugs',
  templateUrl: './ignored-bugs.component.html',
  styleUrls: ['./ignored-bugs.component.css']
})
export class IgnoredBugsComponent implements OnInit {
  time:number ;

  
  tableInput: TableViewInput = {
    columns: ['issue','assignee','from','to'], results: [], results2: [],isEmphasizeOnHover: true, tableTitle: 'Query Results', classNameOfObjects: 'Issue', isShowExportAsCSV: true,
    resultCnt: 0, currPage: 1, pageSize: 0, isLoadGraph: false, isMergeGraph: true, isNodeData: true, isSelect: false
  };
  tableFilled = new Subject<boolean>();
  tableResponse = null;
  graphResponse = null;
  clearTableFilter = new Subject<boolean>();

  constructor(private _dbService: Neo4jDb, private _cyService: CytoscapeService, private _g: GlobalVariableService) {
    this.time=  this._g.userPrefs?.anomalyDefaultValues?.ignoreBug.getValue() ||1;
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
    this.time = this._g.userPrefs.anomalyDefaultValues.ignoreBug.getValue()
    const isClientSidePagination = this._g.userPrefs.queryResultPagination.getValue() == 'Client';
    const cb = (x) => {
      const processedTableData = this.preprocessTableData(x);
      const limit4clientSidePaginated = this._g.userPrefs.dataPageSize.getValue() * this._g.userPrefs.dataPageLimit.getValue();
      let cnt = x.data.length;
      console.log(x)
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
      return;
    }
    const isIgnoreCase = this._g.userPrefs.isIgnoreCaseInText.getValue();
    const txtCondition = getQueryCondition4TxtFilter(filter, ['Issue'], isIgnoreCase);
    const ui2Db = {'issue': 'n.name' };
    const orderExpr = getOrderByExpression4Query(filter, 'issue', 'desc', ui2Db);
    const dateFilter = this.getDateRangeCQL();
    let dataCnt = this.tableInput.pageSize;
    if (isClientSidePagination) {
      dataCnt = this._g.userPrefs.dataPageLimit.getValue() * this._g.userPrefs.dataPageSize.getValue();
    }

    const r = `[${skip}..${skip + dataCnt}]`;
    const cql=`MATCH (n:Issue)
    WHERE exists(n.history) AND size(n.history) >= 2
    WITH n, range(0, size(n.history)-2) as index_range
    UNWIND index_range as i
    WITH n, i, datetime(n.history[i]) as from, datetime(n.history[i+1]) as to
    WHERE duration.between(from, to).months > ${this.time}
    OPTIONAL MATCH (n)-[r:ASSIGNED]-(d) 
    RETURN  distinct ID(n) as id , n.name as issue, d.name as assignee, from, to ORDER BY ${orderExpr}`
    this._dbService.runQuery(cql, cb, DbResponseType.table);
  }
  loadGraph(skip: number, filter?: TableFiltering) {
    this.time = this._g.userPrefs.anomalyDefaultValues.ignoreBug.getValue()
    if (!this.tableInput.isLoadGraph) {    
      return;
    } 
    const isClientSidePagination = this._g.userPrefs.queryResultPagination.getValue() == 'Client';   
    
    const cb = (x) => {
      const positions2 = [
        "top",
        "top-right",
        "top-left",
        "right",
        "left",
        "center",
        "bottom",
        "bottom-right",
        "bottom-left",
      ];
      console.log(x)
      const node = this._g.cy.$(':selected')[0];
      node.addCue({
        htmlElem: document.createElement("div"),
        position: positions2[1],
        marginX: "%-20",
        marginY: "%-20",
      });  

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
    const ui2Db = { 'issue': 'n.name'};
    const orderExpr = getOrderByExpression4Query(null, 'Count', 'desc', ui2Db);
    const dateFilter = this.getDateRangeCQL();
    
    const cql = `MATCH (n:Issue)
    WHERE exists(n.history) AND size(n.history) >= 2
    WITH n, range(0, size(n.history)-2) as indices
    WHERE any(i in indices WHERE duration.between(datetime(n.history[i]), datetime(n.history[i+1])).months >${this.time})
    OPTIONAL MATCH (n)-[r:ASSIGNED]-(d) 
    RETURN n,d,r`
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
    const columnTypes = [TableDataType.string, TableDataType.string, TableDataType.string, TableDataType.datetime, TableDataType.datetime];

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
    console.log(this.tableInput)
    this.tableFilled.next(true);
  }

  getDataForQueryResult(e: TableRowMeta) {
    this.time = this._g.userPrefs.anomalyDefaultValues.ignoreBug.getValue()
    const cb = (x) => {
      console.log(x)
      this._cyService.loadElementsFromDatabase(x, this.tableInput.isMergeGraph);
    }
    const idFilter = buildIdFilter(e.dbIds);
    console.log(e)
    const ui2Db = {'issue': 'n.name'};
    
    const cql = ` MATCH (n:Issue)
    WHERE exists(n.history) AND size(n.history) >= 2 and ${idFilter}
    WITH n, range(0, size(n.history)-2) as indices
    WHERE any(i in indices WHERE duration.between(datetime(n.history[i]), datetime(n.history[i+1])).months >${this.time}) 
    OPTIONAL MATCH (n)-[r:ASSIGNED]-(d) 
    RETURN n,d,r `
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
    console.log(objArr)
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
