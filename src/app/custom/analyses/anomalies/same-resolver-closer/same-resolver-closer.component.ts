import { Component, OnInit } from '@angular/core';
import { Neo4jDb } from '../../../../visuall/db-service/neo4j-db.service';
import { CytoscapeService } from '../../../../visuall/cytoscape.service';
import { GlobalVariableService } from '../../../../visuall/global-variable.service';
import { TableViewInput, TableDataType, TableFiltering, TableRowMeta, TableData } from '../../../../shared/table-view/table-view-types';
import { Subject } from 'rxjs';
import { QueryHelperService} from '../../query-helper.service';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { getCyStyleFromColorAndWid } from 'src/app/visuall/constants';

export interface Anomaly {
  Developer: string;
  Issues: string;
  Count: number;
}
@Component({
  selector: 'app-same-resolver-closer',
  templateUrl: './same-resolver-closer.component.html',
  styleUrls: ['./same-resolver-closer.component.css']
})
export class SameResolverCloserComponent implements OnInit {


  
  tableInput: TableViewInput = {
    columns: ['Developer','Issues','Count'], results: [], results2: [],isEmphasizeOnHover: true, tableTitle: 'Query Results', classNameOfObjects: 'Developer', isShowExportAsCSV: true,
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
    const txtCondition =this._h.getQueryCondition4TxtFilter(filter, ['Developer'], isIgnoreCase);
    const ui2Db = { 'Developer': 'Developer' ,'Issues': 'Issues','Count': 'Count'};
    const orderExpr =this._h. getOrderByExpression4Query(filter, 'Count', 'desc', ui2Db);
    const dateFilter =  this._h.getDateRangeCQL();
    let dataCnt = this.tableInput.pageSize;
    if (isClientSidePagination) {
      dataCnt = this._g.userPrefs.dataPageLimit.getValue() * this._g.userPrefs.dataPageSize.getValue();
    }
    const r = `[${skip}..${skip + dataCnt}]`;

    const cql = ` MATCH (n:Developer)-[r]->(issue:Issue)
    WHERE issue.resolver= n.name and issue.closer = n.name and ${dateFilter}
    RETURN  ElementId(n) as id,  n.name AS Developer, Collect(distinct issue.name) AS Issues, count(distinct issue.name) as Count ORDER BY ${orderExpr} `
    this._dbService.runQuery(cql, cb, DbResponseType.table);
  }
  loadGraph(skip: number, filter?: TableFiltering) {
    if (!this.tableInput.isLoadGraph) {    
      return;
    } 
    
    const cb = (x) => {
      this._cyService.loadElementsFromDatabase(x, this.tableInput.isMergeGraph)
      
      let nodeIds = []
      let edegeIds = []
      
      x.nodes.forEach(node => {
        nodeIds.push(node.id)
      });
      x.edges.forEach(edge => {
        edegeIds.push(edge.id)
      });
    }

    const ui2Db = { 'Developer': 'Developer' ,'Issues': 'Issues','Count': 'Count'};
    const orderExpr =this._h.getOrderByExpression4Query(null, 'Count', 'desc', ui2Db);
    const dateFilter =  this._h.getDateRangeCQL();
    
    const cql = ` MATCH (n:Developer)-[r1:RESOLVED ]->(issue:Issue)
    MATCH (n)-[r2:CLOSED]->(issue)
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
      if (nodeIdDict[x.edges[i].endNodeElementId]) {
        nodeIdDict[x.edges[i].startNodeElementId] = true;
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
    const columnTypes = [TableDataType.string, TableDataType.string, TableDataType.string,TableDataType.number];
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
    if (totalDataCount) {
      this.tableInput.resultCnt = totalDataCount;
    }
    

    this.tableFilled.next(true);
  }


  getDataForQueryResult(e: TableRowMeta) {
    const cb = (x) => {
      this._cyService.loadElementsFromDatabase(x, this.tableInput.isMergeGraph)
      let nodeIds = []
      let edegeIds = []
      
      x.nodes.forEach(node => {
        nodeIds.push(node.id)
      });
      x.edges.forEach(edge => {
        edegeIds.push(edge.id)
      });
    }
    const idFilter = this._h. buildIdFilter(e.dbIds);
    const ui2Db = { 'Developer': 'Developer' ,'Issues': 'Issues','Count': 'Count'};
    const orderExpr =this._h.getOrderByExpression4Query(null, 'Count', 'desc', ui2Db);
    const dateFilter = this._h.getDateRangeCQL();
    
    const cql = ` MATCH (n:Developer)-[r1:RESOLVED ]->(issue:Issue)
    MATCH (n)-[r2:CLOSED]->(issue)
    WHERE issue.resolver= n.name and issue.closer = n.name  AND ${idFilter} AND ${dateFilter} 
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

}