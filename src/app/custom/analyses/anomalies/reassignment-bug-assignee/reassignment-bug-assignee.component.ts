import { Component, OnInit } from '@angular/core';
import { Neo4jDb } from '../../../../visuall/db-service/neo4j-db.service';
import { CytoscapeService } from '../../../../visuall/cytoscape.service';
import { GlobalVariableService } from '../../../../visuall/global-variable.service';
import { TableViewInput, TableDataType, TableFiltering, TableRowMeta, TableData } from '../../../../shared/table-view/table-view-types';
import { Subject } from 'rxjs';
import { QueryHelperService} from '../../query-helper.service';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { QueryComponent } from '../../query.component.interface';

export interface Anomaly {
  Issue: string;
  History: string[];
  Count: string;
}
@Component({
  selector: 'app-reassignment-bug-assignee',
  templateUrl: './reassignment-bug-assignee.component.html',
  styleUrls: ['./reassignment-bug-assignee.component.css']
})
export class ReassignmentBugAssigneeComponent implements OnInit, QueryComponent<Anomaly>  {
  count :number;

  tableInput: TableViewInput = {
    columns: ['issue','history','count'], results: [], results2: [],isEmphasizeOnHover: true, tableTitle: 'Query Results', classNameOfObjects: 'Issue', isShowExportAsCSV: true,
    resultCnt: 0, currPage: 1, pageSize: 0, isLoadGraph: false, isMergeGraph: true, isNodeData: true, isSelect: false
  };
  tableFilled = new Subject<boolean>();
  tableResponse = null;
  graphResponse = null;
  clearTableFilter = new Subject<boolean>();

  constructor(private _dbService: Neo4jDb, private _cyService: CytoscapeService, private _g: GlobalVariableService, private _h: QueryHelperService) {
    this.count=  this._g.userPrefs?.anomalyDefaultValues?.assigneeChangeCount.getValue() ||1;
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
    this.count=  this._g.userPrefs?.anomalyDefaultValues?.assigneeChangeCount.getValue() ||1;
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
    const cql=` MATCH (n:Issue)
    WHERE 'Reassignment of Bug Assignee' IN n.anomalyList AND ${dateFilter} 
    RETURN  ElementId(n) as id,  n.name AS issue, n.assigneeHistory as history,  n.assigneeChangeCount as count ORDER BY ${orderExpr}`
    this._dbService.runQuery(cql, cb, DbResponseType.table);
  }
  loadGraph(skip: number, filter?: TableFiltering) {
    this.count=  this._g.userPrefs?.anomalyDefaultValues?.assigneeChangeCount.getValue() ||1;
    if (!this.tableInput.isLoadGraph) {    
      return;
    } 
    const isClientSidePagination = this._g.userPrefs.queryResultPagination.getValue() == 'Client';   
    let fn = (x) => { cb(x); this._g.add2GraphHistory(`Get Anomalies: Reassignment bug assignee`); };
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

    const cql =  ` MATCH (n:Issue)
    WHERE 'Reassignment of Bug Assignee' IN n.anomalyList 
    WITH n, [assignee IN n.assigneeHistory ] AS assignees
    UNWIND assignees AS assignee
    OPTIONAL MATCH path =(n)-[*1..2]-(developer: Developer)
    WHERE developer.name =assignee and  ${dateFilter} 
    RETURN n,  developer AS assignee,relationships(path) AS edges`
    this._dbService.runQuery(cql, fn);
   
  }
  filterGraphResponse(x: GraphResponse): GraphResponse {
    const r: GraphResponse = { nodes: [], edges: x.edges };
    const nodeIdDict = {};
    const start_edges  = ["ASSIGNED_TO","ASSIGNED_BY", "REFERENCED"]
    const sink_edges  = ["COMMITTED","OPENED","MERGED", "REVIEWED", "CLOSED", "RESOLVED","REPORTED"]
    for (let i = 0; i < this.tableInput.results.length; i++) {
      nodeIdDict[this.tableInput.results[i][0].val] = true;
    }
    // add a node if an edge ends with that
    for (let i = 0; i < x.edges.length; i++) {
      if (nodeIdDict[x.edges[i].endNodeElementId]) {
        if(sink_edges.includes(x.edges[i].type )){
          nodeIdDict[x.edges[i].startNodeElementId] = true;
        }
        
      }
      else if (nodeIdDict[x.edges[i].startNodeElementId]) {
        if(start_edges.includes(x.edges[i].type)){
          nodeIdDict[x.edges[i].endNodeElementId] = true;
        }
      }
      else{

      }
    }
    for (let i = 0; i < x.nodes.length; i++) {
      if (nodeIdDict[x.nodes[i].elementId]) {
        r.nodes.push(x.nodes[i]);
      }
    }
    return r;
  }


  fillTable(data: Anomaly[], totalDataCount: number | null) {
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
    this.count=  this._g.userPrefs?.anomalyDefaultValues?.assigneeChangeCount.getValue() ||1;
    const cb = (x) => {
      this._cyService.loadElementsFromDatabase(x, this.tableInput.isMergeGraph)
      const names = []
      e.dbIds.forEach(nodeId => {
        names.push(this._g.cy.$id(`n${nodeId}`)._private.data.name)
      });
      this._g.add2GraphHistory(`Get Anomalies: Get Anomalies: Reassignment bug assignee (${names.join(", ")})`);
    }
    const idFilter = this._h. buildIdFilter(e.dbIds);
    const ui2Db = {'issue': 'n.name'};
    const cql = `  MATCH (n:Issue) 
    WHERE 'Reassignment of Bug Assignee' IN n.anomalyList and ${idFilter} 
    OPTIONAL MATCH (n)-[r]-(d) 
    return n,d,r`
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

  filterTableResponse(x: Anomaly[], filter: TableFiltering): Anomaly[] {
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
}

