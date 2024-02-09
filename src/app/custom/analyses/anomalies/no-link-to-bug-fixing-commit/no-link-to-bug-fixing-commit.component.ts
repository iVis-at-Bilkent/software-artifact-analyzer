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
  Assignee: string;
  Resolver: string;
}
@Component({
  selector: 'app-no-link-to-bug-fixing-commit',
  templateUrl: './no-link-to-bug-fixing-commit.component.html',
  styleUrls: ['./no-link-to-bug-fixing-commit.component.css']
})
export class NoLinkToBugFixingCommitComponent implements OnInit, QueryComponent<Anomaly> {


  
  tableInput: TableViewInput = {
    columns: ['issue', 'assignee','resolver'],results: [], results2: [],isEmphasizeOnHover: true, tableTitle: 'Query Results', classNameOfObjects: 'Issue', isShowExportAsCSV: true,
    resultCnt: 0, currPage: 1, pageSize: 0, isLoadGraph: false, isMergeGraph: true, isNodeData: true, isSelect: false
  };
  tableFilled = new Subject<boolean>();
  tableResponse = null;
  graphResponse = null;
  clearTableFilter = new Subject<boolean>();

  constructor(private _dbService: Neo4jDb, private _cyService: CytoscapeService, private _g: GlobalVariableService, private _h: QueryHelperService) {
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
    const orderExpr =this._h. getOrderByExpression4Query(filter, 'id', 'desc', ui2Db);
    const dateFilter = this._h.getDateRangeCQL();
    let dataCnt = this.tableInput.pageSize;
    if (isClientSidePagination) {
      dataCnt = this._g.userPrefs.dataPageLimit.getValue() * this._g.userPrefs.dataPageSize.getValue();
    }
    const r = `[${skip}..${skip + dataCnt}]`;
    const cql=`MATCH (n:Issue)
    WHERE 'No link to bug fixing commit or pull request' IN n.anomalyList AND ${dateFilter}
    OPTIONAL MATCH (n)-[r:ASSIGNED_TO]-(d) 
    OPTIONAL MATCH (n)-[r2:RESOLVED]-(d2) 
    RETURN  ElementId(n) as id,  n.name AS issue, d.name as assignee, d2.name as resolver ORDER BY ${orderExpr}`
    this._dbService.runQuery(cql, cb, DbResponseType.table);
  }
  loadGraph(skip: number, filter?: TableFiltering) {
    if (!this.tableInput.isLoadGraph) {    
      return;
    } 
    const isClientSidePagination = this._g.userPrefs.queryResultPagination.getValue() == 'Client';   
    let fn = (x) => { cb(x); this._g.add2GraphHistory(`Get Anomalies: No link to bug fixing commit bugs`); };
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
    const cql = `MATCH (n:Issue)
    WHERE 'No link to bug fixing commit or pull request' IN n.anomalyList AND ${dateFilter}
    OPTIONAL MATCH (n)-[r:ASSIGNED_TO]-(d) 
    OPTIONAL MATCH (n)-[r2:RESOLVED]-(d2) return n,r,r2 `
    this._dbService.runQuery(cql, fn);
   
  }
  filterGraphResponse(x: GraphResponse): GraphResponse {
    const r: GraphResponse = { nodes: [], edges: x.edges };
   
    const nodeIdDict = {};
    for (let i = 0; i < this.tableInput.results.length; i++) {
      nodeIdDict[this.tableInput.results[i][0].val] = true;
    }
    // add a node if an edge ends with that
    for (let i = 0; i < x.edges.length; i++) {
      if (nodeIdDict[x.edges[i].endNodeElementId]) {
        if(x.edges[i].type ==="RESOLVED"){
          nodeIdDict[x.edges[i].startNodeElementId] = true;
        }
        
      }
      else if (nodeIdDict[x.edges[i].startNodeElementId]) {
        if(x.edges[i].type ==="ASSIGNED_TO"){
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
    const columnTypes = [TableDataType.string, TableDataType.string,TableDataType.string, TableDataType.string];

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
      this._cyService.loadElementsFromDatabase(x, this.tableInput.isMergeGraph);
      const names = []
      e.dbIds.forEach(nodeId => {
        names.push(this._g.cy.$id(`n${nodeId}`)._private.data.name)
      });
      this._g.add2GraphHistory(`Get Anomalies: No link to bug fixing commit bugs (${names.join(", ")})`);
    }
    const idFilter = this._h. buildIdFilter(e.dbIds);
    const ui2Db = {'issue': 'n.name'};
    
    const cql = `MATCH (n:Issue)
    WHERE 'No link to bug fixing commit or pull request' IN n.anomalyList AND  ${idFilter}
    OPTIONAL MATCH (n)-[r:ASSIGNED_TO]-(d) 
    OPTIONAL MATCH (n)-[r2:RESOLVED]-(d2) return n,d,d2,r,r2`
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
