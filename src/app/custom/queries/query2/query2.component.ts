  import { Component, OnInit } from '@angular/core';
  import { Neo4jDb } from '../../../visuall/db-service/neo4j-db.service';
  import { CytoscapeService } from '../../../visuall/cytoscape.service';
  import { GlobalVariableService } from '../../../visuall/global-variable.service';
  import { TableViewInput, TableDataType, TableFiltering, TableRowMeta, TableData } from '../../../shared/table-view/table-view-types';
  import { Subject } from 'rxjs';
  import { buildIdFilter, getOrderByExpression4Query, getQueryCondition4TxtFilter } from '../../queries/query-helper';
  import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
  import { getCyStyleFromColorAndWid } from 'src/app/visuall/constants';
  
  export interface Developer {
    Developer: string;
    Count: string;
  }
  @Component({
    selector: 'app-query2',
    templateUrl: './query2.component.html',
    styleUrls: ['./query2.component.css']
  })
  export class Query2Component implements OnInit {
    tableInput: TableViewInput = {
      columns: ['developer','count'], results: [], results2: [],isEmphasizeOnHover: true, tableTitle: 'Query Results', classNameOfObjects: 'Issue', isShowExportAsCSV: true,
      resultCnt: 0, currPage: 1, pageSize: 0, isLoadGraph: false, isMergeGraph: true, isNodeData: true, isSelect: false
    };
    tableFilled = new Subject<boolean>();
    tableResponse = null;
    graphResponse = null;
    clearTableFilter = new Subject<boolean>();
    issue = ""
    constructor(private _dbService: Neo4jDb, private _cyService: CytoscapeService, private _g: GlobalVariableService) {
    }
  
    ngOnInit() {
      let name = "";
      setInterval(() => {
        if (this._g.cy.$(':selected').length > 0 && this._g.cy.$(':selected')[0]._private.classes.values().next().value === "Issue" && this._g.cy.$(':selected')[0]._private.data.name !== name) {
          name = this._g.cy.$(':selected')[0]._private.data.name
          this.issue = this._g.cy.$(':selected')[0]._private.data.name;
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
      const isClientSidePagination = this._g.userPrefs.queryResultPagination.getValue() == 'Client';
      const cb = (x) => {
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
      const txtCondition = getQueryCondition4TxtFilter(filter, ['Issue'], isIgnoreCase);
      const ui2Db = {'issue': 'n.name' };
      const orderExpr = getOrderByExpression4Query(filter, 'count', 'desc', ui2Db);
      const dateFilter = this.getDateRangeCQL();
      let dataCnt = this.tableInput.pageSize;
      if (isClientSidePagination) {
        dataCnt = this._g.userPrefs.dataPageLimit.getValue() * this._g.userPrefs.dataPageSize.getValue();
      }
  
      const r = `[${skip}..${skip + dataCnt}]`;
      const cql=`MATCH (issue:Issue {name:'${this.issue}'})
      WITH issue, [collabs in issue.collaborators] AS collaborators
      UNWIND collaborators AS collaborator
      WITH issue as issue, apoc.convert.fromJsonMap(collaborator) as collab
      MATCH (n:Developer {name: collab.name})
      WHERE ${dateFilter} 
      RETURN ID(n) as id, n.name as developer, collab.count as count ORDER BY ${orderExpr}`
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
      };
      if (isClientSidePagination && filter && this.graphResponse) {
        this._cyService.loadElementsFromDatabase(this.filterGraphResponse(this.graphResponse), this.tableInput.isMergeGraph);
        return;
      }
      const ui2Db = { 'issue': 'n.name'};
      const orderExpr = getOrderByExpression4Query(null, 'Count', 'desc', ui2Db);
      const dateFilter = this.getDateRangeCQL();
  
      const cql =  `MATCH (issue:Issue {name:'${this.issue}'})
      WITH issue, [collabs in issue.collaborators] AS collaborators
      UNWIND collaborators AS collaborator
      WITH issue as issue, apoc.convert.fromJsonMap(collaborator) as collab
      MATCH (n:Developer {name: collab.name})
      WITH issue, n
      WHERE ${dateFilter}
      MATCH path = shortestPath((issue)-[*1..3]-(n))
      RETURN issue, n, nodes(path) AS path_nodes, relationships(path) AS path_relationships`
      this._dbService.runQuery(cql, cb);
     
    }
    private filterGraphResponse(x: GraphResponse): GraphResponse {
      const r: GraphResponse = { nodes: x.nodes, edges: x.edges };
      return r;
    }
  
  
    fillTable(data: Developer[], totalDataCount: number | null) {
      const uiColumns = ['id'].concat(this.tableInput.columns);
      const columnTypes = [TableDataType.string, TableDataType.string, TableDataType.string, TableDataType.string];
  
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
      const dateFilter = this.getDateRangeCQL();
      const ui2Db = {'issue': 'n.name'};
      const cql =`MATCH (issue:Issue {name:'${this.issue}'})
      WITH issue, [collabs in issue.collaborators] AS collaborators
      UNWIND collaborators AS collaborator
      WITH issue as issue, apoc.convert.fromJsonMap(collaborator) as collab
      MATCH (n:Developer {name: collab.name})
      WITH issue, n
      WHERE ${idFilter}
      MATCH path = shortestPath((issue)-[*1..3]-(n))
      RETURN issue, n, nodes(path) AS path_nodes, relationships(path) AS path_relationships`
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
    private preprocessTableData(data): Developer[] {
      const dbColumns = data.columns as string[];
      const uiColumns = ['id'].concat(this.tableInput.columns);
      let columnMapping = [];
      for (let i = 0; i < uiColumns.length; i++) {
        columnMapping.push(dbColumns.indexOf(uiColumns[i]));
      }
      const rawData = data.data;
      const objArr: Developer[] = [];
      for (let i = 0; i < rawData.length; i++) {
        const obj = {};
        for (let j = 0; j < columnMapping.length; j++) {
          obj[uiColumns[j]] = rawData[i][columnMapping[j]];
        }
        objArr.push(obj as Developer)
      }
      
      return objArr;
    }
  
    private filterTableResponse(x: Developer[], filter: TableFiltering): Developer[] {
      if (!filter || ((!filter.txt || filter.txt.length < 1) && filter.orderDirection == '' && (!filter.skip || filter.skip == 0))) {
        const skip = filter && filter.skip ? filter.skip : 0;
        this.tableInput.resultCnt = x.length;
        return x.slice(skip, skip + this._g.userPrefs.dataPageSize.getValue());
      }
      const isIgnoreCase = this._g.userPrefs.isIgnoreCaseInText.getValue();
      let filtered: Developer[] = [];
  
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
      const a = new Date(d1 );
      const c = new Date(d2);
      const b = a.toISOString()
      const d =c.toISOString()
  
      return ` ${d2} >= n.start  AND ${d1}<= n.end`;
    }
  }
  
  