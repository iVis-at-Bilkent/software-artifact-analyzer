  import { Component, OnInit } from '@angular/core';
  import { Neo4jDb } from '../../../visuall/db-service/neo4j-db.service';
  import { CytoscapeService } from '../../../visuall/cytoscape.service';
  import { GlobalVariableService } from '../../../visuall/global-variable.service';
  import { TableViewInput, TableDataType, TableFiltering, TableRowMeta, TableData } from '../../../shared/table-view/table-view-types';
  import { Subject } from 'rxjs';
  import { QueryHelperService} from '../query-helper.service';
  import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
  import { getCyStyleFromColorAndWid } from 'src/app/visuall/constants';
  
  export interface Developer {
    Developer: string;
    Count: string;
  }
  @Component({
    selector: 'app-comment-contributors',
    templateUrl: './comment-contributors.component.html',
    styleUrls: ['./comment-contributors.component.css']
  })
  export class CommentContributorsComponent implements OnInit {
    tableInput: TableViewInput = {
      columns: ['developer','count'], results: [], results2: [],isEmphasizeOnHover: true, tableTitle: 'Query Results', classNameOfObjects: 'Issue', isShowExportAsCSV: true,
      resultCnt: 0, currPage: 1, pageSize: 0, isLoadGraph: false, isMergeGraph: true, isNodeData: true, isSelect: false
    };
    tableFilled = new Subject<boolean>();
    tableResponse = null;
    graphResponse = null;
    clearTableFilter = new Subject<boolean>();
    issue = ""
    constructor(private _dbService: Neo4jDb, private _cyService: CytoscapeService, private _g: GlobalVariableService, private _h: QueryHelperService) {
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
        const processedTableData = this._h.preprocessTableData(x,['id'].concat(this.tableInput.columns));
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
      const txtCondition =this._h.getQueryCondition4TxtFilter(filter, ['Issue'], isIgnoreCase);
      const ui2Db = {'issue': 'n.name' };
      const orderExpr =this._h. getOrderByExpression4Query(filter, 'count', 'desc', ui2Db);
      const dateFilter = this._h.getDateRangeCQL(); 
      let dataCnt = this.tableInput.pageSize;
      if (isClientSidePagination) {
        dataCnt = this._g.userPrefs.dataPageLimit.getValue() * this._g.userPrefs.dataPageSize.getValue();
      }
  
      const r = `[${skip}..${skip + dataCnt}]`;
      const cql=`MATCH (issue:Issue {name:'${this.issue}'})
      WITH issue, [cmtr in issue.commenterList] AS commenterList
      UNWIND commenterList AS commenter
      WITH issue as issue, apoc.convert.fromJsonMap(commenter) as cmtr
      MATCH (n:Developer {name: cmtr.name})
      WHERE ${dateFilter} 
      RETURN elementId(n) as id, n.name as developer, cmtr.count as count ORDER BY ${orderExpr}`
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
      const orderExpr =this._h.getOrderByExpression4Query(null, 'Count', 'desc', ui2Db);
      const dateFilter = this._h.getDateRangeCQL(); 
  
      const cql =  `MATCH (issue:Issue {name:'${this.issue}'})
      WITH issue, [cmtr in issue.commenterList] AS commenterList
      UNWIND commenterList AS commenter
      WITH issue as issue, apoc.convert.fromJsonMap(commenter) as cmtr
      MATCH (n:Developer {name: cmtr.name})
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
      const idFilter = this._h. buildIdFilter(e.dbIds);
      const dateFilter = this._h.getDateRangeCQL(); 
      const ui2Db = {'issue': 'n.name'};
      const cql =`MATCH (issue:Issue {name:'${this.issue}'})
      WITH issue, [cmtr in issue.commenterList] AS commenterList
      UNWIND commenterList AS commenter
      WITH issue as issue, apoc.convert.fromJsonMap(commenter) as cmtr
      MATCH (n:Developer {name: cmtr.name})
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
  
  }
  
  