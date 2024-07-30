import { Component, OnInit } from '@angular/core';
import { Neo4jDb } from '../../../visuall/db-service/neo4j-db.service';
import { CytoscapeService } from '../../../visuall/cytoscape.service';
import { GlobalVariableService } from '../../../visuall/global-variable.service';
import { TableViewInput, TableDataType, TableFiltering, TableRowMeta, TableData } from '../../../shared/table-view/table-view-types';
import { Subject } from 'rxjs';
import { QueryHelperService} from '../query-helper.service';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { QueryComponent } from '../query.component.interface';
//This query is for 
export interface CommitData {
  id: string;
  commit: string;
}
@Component({
  selector: 'app-developer-commits',
  templateUrl: './developer-commits.component.html',
  styleUrls: ['./developer-commits.component.css']
})

export class DeveloperCommitsComponent implements OnInit, QueryComponent<CommitData> {
  developer: string;
  developers: string[];
  filteredDevelopers: string[] = [];
  tableInput: TableViewInput = {
    columns: ['commit'], results: [], results2: [], isEmphasizeOnHover: true, tableTitle: 'Query Results', classNameOfObjects: 'Commit', isShowExportAsCSV: true,
    resultCnt: 0, currPage: 1, pageSize: 0, isLoadGraph: false, isMergeGraph: true, isNodeData: true
  };
  tableFilled = new Subject<boolean>();
  tableResponse = null;
  graphResponse = null;
  clearTableFilter = new Subject<boolean>();

  constructor(private _dbService: Neo4jDb, private _cyService: CytoscapeService, private _g: GlobalVariableService, private _h: QueryHelperService) {
    this.developers = [];
  }

  ngOnInit() {
    if (this._g.cy.$(':selected').length > 0 && this._g.cy.$(':selected')[0]._private.classes.values().next().value === "Developer") {
      this.developer = this._g.cy.$(':selected')[0]._private.data.name;
    }
    setTimeout(() => {
      const dateFilter = this._h.getDateRangeCQL();
      this._dbService.runQuery(`MATCH (n:Developer) RETURN distinct n.name`, (x) => this.fillGenres(x), DbResponseType.table);
    }, 5);
    let name = ""
    setInterval(() => {
      if (this._g.cy.$(':selected').length > 0 && this._g.cy.$(':selected')[0]._private.classes.values().next().value === "Developer" && this._g.cy.$(':selected')[0]._private.data.name != name) {
        name = this._g.cy.$(':selected')[0]._private.data.name
        this.developer = this._g.cy.$(':selected')[0]._private.data.name;
      }
    }, 1500)
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
      const processedTableData =  this._h.preprocessTableData(x,['id'].concat(this.tableInput.columns));
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
    const txtCondition =this._h.getQueryCondition4TxtFilter(filter, ['n.name'], isIgnoreCase);
    const ui2Db = { 'name': 'n.name' };
    const orderExpr =this._h. getOrderByExpression4Query(filter, 'n.name', 'desc', ui2Db);
    const dateFilter =this._h.getDateRangeCQL(); 
    let dataCnt = this.tableInput.pageSize;
    if (isClientSidePagination) {
      dataCnt = this._g.userPrefs.dataPageLimit.getValue() * this._g.userPrefs.dataPageSize.getValue();
    }
    const r = `[${skip}..${skip + dataCnt}]`;

    const cql = `MATCH (n:Commit) <-[r:COMMITTED]-(d:Developer {name: '${this.developer}' })
    WHERE  ${dateFilter} 
    RETURN collect(ElementId(n))${r} as id, n.name as commit, size(collect(ElementId(n))) as totalDataCount`;
    this._dbService.runQuery(cql, cb, DbResponseType.table);

  }

  loadGraph(skip: number, filter?: TableFiltering) {
    if (!this.tableInput.isLoadGraph) {
      return;
    }
    const isClientSidePagination = this._g.userPrefs.queryResultPagination.getValue() == 'Client';
    let fn = (x) => { cb(x); this._g.add2GraphHistory(`Get commits of the developer ${this.developer}`); };
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

    const isIgnoreCase = this._g.userPrefs.isIgnoreCaseInText.getValue();
    const txtCondition =this._h.getQueryCondition4TxtFilter(filter, ['n.name'], isIgnoreCase);
    const ui2Db = { 'name': 'n.name' };
    const orderExpr =this._h. getOrderByExpression4Query(filter, 'n.name', 'desc', ui2Db);
    const dateFilter =  this._h.getDateRangeCQL();
    let dataCnt = this.tableInput.pageSize;
    if (isClientSidePagination) {
      dataCnt = this._g.userPrefs.dataPageLimit.getValue() * this._g.userPrefs.dataPageSize.getValue();
    }
    const cql = `MATCH (n:Commit) <-[r:COMMITTED]-(d:Developer {name: '${this.developer}' })
    WHERE  ${dateFilter} 
    RETURN d,n,r
    SKIP ${skip} LIMIT ${dataCnt}`;
    this._dbService.runQuery(cql, fn);

  }


  fillTable(data: CommitData[], totalDataCount: number | null) {
    const uiColumns = ['id'].concat(this.tableInput.columns);
    const columnTypes = [TableDataType.string, TableDataType.string];

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


  fillGenres(data) {
    this.developers = [];
    for (let i = 0; i < data.data.length; i++) {
      this.developers.push(data.data[i].join(''));
    }
    this.filteredDevelopers = this.developers.slice();
  }

  filterOptions(value: string) {
    this.filteredDevelopers = this.developers.filter(dev =>
      dev.toLowerCase().includes(value.toLowerCase())
    );
  }
  getDataForQueryResult(e: TableRowMeta) {
    const cb = (x) => {
      this._cyService.loadElementsFromDatabase(x, this.tableInput.isMergeGraph)
      const names = []
      e.dbIds.forEach(nodeId => {
        names.push(this._g.cy.$id(`n${nodeId}`)._private.data.name)
      });
      this._g.add2GraphHistory(`Get commits of the developer ${this.developer} (${names.join(", ")})`);
    }

    const idFilter = this._h. buildIdFilter(e.dbIds);
    const ui2Db = { 'name': 'n.name' };
    const orderExpr =this._h. getOrderByExpression4Query(null, 'n.name', 'desc', ui2Db);
    const dateFilter = this._h.getDateRangeCQL();


    const cql = `MATCH (n:Commit) <-[r:COMMITTED]-(d:Developer {name: '${this.developer}' })
    WHERE  ${idFilter} and ${dateFilter}
    RETURN n,r,d
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

  filterTableResponse(x: CommitData[], filter: TableFiltering): CommitData[] {
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

  filterGraphResponse(x: GraphResponse): GraphResponse {
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
}
