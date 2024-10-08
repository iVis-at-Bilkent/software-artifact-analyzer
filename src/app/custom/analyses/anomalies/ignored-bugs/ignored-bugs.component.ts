
import { Component, OnInit } from '@angular/core';
import { Neo4jDb } from '../../../../visuall/db-service/neo4j-db.service';
import { CytoscapeService } from '../../../../visuall/cytoscape.service';
import { GlobalVariableService } from '../../../../visuall/global-variable.service';
import { TableViewInput, TableDataType, TableFiltering, TableRowMeta, TableData } from '../../../../shared/table-view/table-view-types';
import { Subject } from 'rxjs';
import { QueryHelperService} from '../../query-helper.service';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { QueryComponent } from '../../query.component.interface'

export interface Anomaly {
  Issue: string;
  Assignee: string;
  Dates: string;
}
@Component({
  selector: 'app-ignored-bugs',
  templateUrl: './ignored-bugs.component.html',
  styleUrls: ['./ignored-bugs.component.css']
})
export class IgnoredBugsComponent implements OnInit, QueryComponent<Anomaly> {

  time:number ;
  
  tableInput: TableViewInput = {
    columns: ['issue','assignee','dates'], results: [], results2: [],isEmphasizeOnHover: true, tableTitle: 'Query Results', classNameOfObjects: 'Issue', isShowExportAsCSV: true,
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
    this.time = this._g.userPrefs.anomalyDefaultValues.ignoreBug.getValue()
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
    const cql=`MATCH (n)
    WHERE n.history IS NOT NULL AND size(n.history) >= 2  AND ${dateFilter}
    WITH n, range(0, size(n.history)-2) as index_range 
    UNWIND index_range as i
    WITH n, i, toInteger(n.history[i]) as fromMillis, toInteger(n.history[i+1]) as toMillis\
    WITH n, i, datetime({epochMillis: fromMillis}) as from, datetime({epochMillis: toMillis}) as to\
    WHERE duration.between(from, to).months > ${this.time} 
    RETURN  distinct ElementId(n) as id , n.name as issue,  n.assignee as assignee, collect([from, to]) as dates ORDER BY  ${orderExpr} 
    SKIP ${skip} LIMIT ${dataCnt}`
    this._dbService.runQuery(cql, cb, DbResponseType.table);
  }
  loadGraph(skip: number, filter?: TableFiltering) {
    this.time = this._g.userPrefs.anomalyDefaultValues.ignoreBug.getValue()
    if (!this.tableInput.isLoadGraph) {    
      return;
    } 
    const isClientSidePagination = this._g.userPrefs.queryResultPagination.getValue() == 'Client';   
    let fn = (x) => { cb(x); this._g.add2GraphHistory(`Get Anomalies: Ignored bugs`); };
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
    const orderExpr =this._h. getOrderByExpression4Query(null, 'n.name', 'desc', ui2Db);
    const dateFilter = this._h.getDateRangeCQL();
    
    const cql =`MATCH (n)
    WHERE 'Ignored bug' IN n.anomalyList AND ${dateFilter}
    OPTIONAL MATCH (n) -[r:ASSIGNED_TO]-(t) WHERE t.name = n.assignee
    RETURN  n , t ,r   `
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
      if (nodeIdDict[x.edges[i].startNodeElementId]) {
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


  fillTable(data: Anomaly[], totalDataCount: number | null) {
    const uiColumns = ['id'].concat(this.tableInput.columns);
    const columnTypes = [TableDataType.string, TableDataType.string,TableDataType.string,TableDataType.string];

    this.tableInput.results = [];
    for (let i = 0; i < data.length; i++) {
      const row: TableData[] = [];
      for (let j = 0; j < uiColumns.length; j++) {
        if(uiColumns[j] == "dates" && data[i][uiColumns[j]].length>3 && Array.isArray(data[i][uiColumns[j]]) ){
          const formattedDates = data[i][uiColumns[j]].map(subArray => {
            return subArray.map(dateString => {
              const date = new Date(dateString);
              return date.toLocaleDateString('en-GB'); // use your preferred locale here
            }).join(' - ');
          });
          
          data[i][uiColumns[j]] = formattedDates.slice(0,3).join(" , ")
          data[i][uiColumns[j]]  = "[" + data[i][uiColumns[j]] + " ...]"
          row.push({ type: columnTypes[j], val: data[i][uiColumns[j]] })
        }
        else if (uiColumns[j] == "dates" && data[i][uiColumns[j]].length<=3  && Array.isArray(data[i][uiColumns[j]]) ){
          const formattedDates = data[i][uiColumns[j]].map(subArray => {
            return subArray.map(dateString => {
              const date = new Date(dateString);
              return date.toLocaleDateString('en-GB'); // use your preferred locale here
            }).join(' - ');
          });
          
          data[i][uiColumns[j]] = formattedDates.join(" , ")
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
      const names = []
      e.dbIds.forEach(nodeId => {
        names.push(this._g.cy.$id(`n${nodeId}`)._private.data.name)
      });
      this._g.add2GraphHistory(`Get Anomalies: Ignored bugs (${names.join(", ")})`);
    }
    const idFilter = this._h. buildIdFilter(e.dbIds);
    const ui2Db = {'issue': 'n.name'};
    
    const cql = `MATCH (n)
    WHERE 'Ignored bug' IN n.anomalyList AND ${idFilter}
    OPTIONAL MATCH (n) -[r:ASSIGNED_TO]-(t) WHERE t.name = n.assignee
    RETURN  n,r,t `
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
