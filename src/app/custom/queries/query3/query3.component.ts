import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as C from 'src/app/visuall/constants';
import { Neo4jDb } from '../../../visuall/db-service/neo4j-db.service';
import { CytoscapeService } from '../../../visuall/cytoscape.service';
import { GlobalVariableService } from '../../../visuall/global-variable.service';
import { formatNumber } from '@angular/common';
import { TableViewInput, TableDataType, TableFiltering, TableRowMeta, TableData } from '../../../shared/table-view/table-view-types';
import { Subject } from 'rxjs';
import { buildIdFilter, getOrderByExpression4Query, getQueryCondition4TxtFilter } from '../query-helper';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { getCyStyleFromColorAndWid, readTxtFile, isJson } from 'src/app/visuall/constants';
import { GroupingOptionTypes } from '../../../visuall/user-preference';
import { GroupCustomizationService } from 'src/app/custom/group-customization.service';
import { debounce2, debounce, COLLAPSED_EDGE_CLASS, mapColor } from 'src/app/visuall/constants';
import { GraphTheoreticPropertiesTabComponent } from 'src/app/visuall/operation-tabs/map-tab/graph-theoretic-properties-tab/graph-theoretic-properties-tab.component'
export interface DeveloperData {
  name: string;
  score: number;
  id: number;

}
@Component({
  selector: 'app-query3',
  templateUrl: './query3.component.html',
  styleUrls: ['./query3.component.css']
})
export class Query3Component implements OnInit {
  githubHttpOptions:any;
  authentication: any;
  pr: string;
  prId : number;
  prs: string[];
  prIds: number[];
  developers = [];
  scores = [];
  developersName = [];
  reviewers:string[] = [];

  commits = [];
  seeds = [];
  number = 3;
  assigned:boolean= false
  tableFilter: TableFiltering = { orderBy: null, orderDirection: null, txt: '', skip: null };
  tableInput: TableViewInput = {
    columns: ['name', 'score'], results: [],results2: [], isEmphasizeOnHover: true, tableTitle: 'Query Results', classNameOfObjects: 'Developer', isShowExportAsCSV: true,
    resultCnt: 0, currPage: 1, pageSize: 0, isLoadGraph: false, isMergeGraph: false, isNodeData: true, isSelect: true
  };
  tableFilled = new Subject<boolean>();
  tableResponse = null;
  graphResponse = null;
  clearTableFilter = new Subject<boolean>();
  cluster = true;
  algorithm = null;
  
  constructor(private http: HttpClient, private _dbService: Neo4jDb, private _cyService: CytoscapeService, private _g: GlobalVariableService, private _group: GroupCustomizationService ) {
    this.prs = [];
    this.developers = [];
    this.scores = [];
    this.developersName = [];
    this.commits = [];
  }

  ngOnInit() {
    this.http.get(`http://${window.location.hostname}:4445/getAuthentication`).subscribe(data => {
      this.authentication  = data;
      this.githubHttpOptions = {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${this.authentication.github_token}`,
          'Accept': 'application/vnd.github.v3+json',
          "X-GitHub-Api-Version": "2022-11-28",
          'Content-Type': 'application/json'
        })
      };
    });
    this.pr = "None";
    setTimeout(() => {
      this._dbService.runQuery('MATCH (m:PullRequest) return m.name as name , ID(m) as id order by m.name ', (x) =>{ 
        this.fillGenres(x)
      }, DbResponseType.table);
    }, 0);
    this.tableInput.results = [];
    this._g.userPrefs.dataPageSize.subscribe(x => { this.tableInput.pageSize = x; });
  }
  assign() {
    console.log(this.tableInput.results);
    this.reviewers = this.tableInput.results.filter((_, i) => this.tableInput.results2[i]).map(x => x[1].val) as string[];
    const url = `https://api.github.com/repos/${this.authentication.github_repo}/pulls/${this.pr}/requested_reviewers`;
    const headers = {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${this.authentication.github_token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    };
    const body = {
      reviewers: this.reviewers 
    };
    
    this.http.post(url, body, { headers }).subscribe(
      (response) => {
        console.log('Reviewers added successfully:', response);
      },
      (error) => {
        console.error('Error adding reviewers:', error);
      }
    );
  }


  prepareQuery() {
    this.tableInput.currPage = 1;
    this.clearTableFilter.next(true);
    const skip = (this.tableInput.currPage - 1) * this.tableInput.pageSize;
    this.loadTable(skip);
  }

  loadTable(skip: number, filter?: TableFiltering) {
    this.assigned = true
    this.developers = [];
    this.developersName = [];
    this.scores = [];
    this.prId = this.prIds[this.prs.indexOf(this.pr)]
    const isClientSidePagination = this._g.userPrefs.queryResultPagination.getValue() == 'Client';
    const cb = (x) => {
      x.data.forEach(element => {
        this.developers.push(element[2])
        this.developersName.push("'"+element[1]+"'")
        this.scores.push(element[0])
      }); 
      const processedTableData = this.preprocessTableData(x);
      if (this.tableInput.isLoadGraph) {

      }
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
      if (this.tableInput.isLoadGraph) {
        
        this.loadGraph(skip,this.tableFilter)

      }
    };
    if (isClientSidePagination && filter) {
      this.fillTable(this.filterTableResponse(this.tableResponse, filter), null);
      return;
    }
    //const idFilter = buildIdFilter(e.dbIds);
    const isIgnoreCase = this._g.userPrefs.isIgnoreCaseInText.getValue();
    const txtCondition = getQueryCondition4TxtFilter(filter, ['score'], isIgnoreCase);
    const ui2Db = { 'name': 'name', "score": "score" };
    const orderExpr = getOrderByExpression4Query(filter, 'score', 'desc', ui2Db);
    const dateFilter = this.getDateRangeCQL();
    let dataCnt = this.tableInput.pageSize;
    if (isClientSidePagination) {
      dataCnt = this._g.userPrefs.dataPageLimit.getValue() * this._g.userPrefs.dataPageSize.getValue();
    }
    const r = `[${skip}..${skip + dataCnt}]`;
    /* FOR DEM0 PURPOSESSSS
    const cql = ` MATCH (pr:PullRequest{name:'${this.pr}'})-[*]->(file:File)
    MATCH (dp:Developer)-[]-(Commit)-[]-(pr:PullRequest {name:'${this.pr}'})
    with collect(file.name) as filenames, collect(dp.name) as dnames
    MATCH (a:Developer)-[r*0..3]-(b:File)
    WHERE b.name IN filenames and  NOT(a.name IN dnames) and ${dateFilter}
    WITH DISTINCT ID(a) As id,  a.name AS name,  SUM(1.0/size(r)) AS score , filenames as f, dnames as d
    RETURN  id, name, score  ORDER BY ${orderExpr} LIMIT ${this.number}`;
    */

    const cql = ` MATCH (pr:PullRequest{name:'${this.pr}'})-[*]->(file:File)
    MATCH (dp:Developer)-[]-(Commit)-[]-(pr:PullRequest {name:'${this.pr}'})
    with collect(file.name) as filenames, collect(dp.name) as dnames
    MATCH (a:Developer)-[r*0..3]-(b:File)
    WHERE b.name IN filenames and  NOT(a.name IN dnames) and ${dateFilter}
    WITH DISTINCT ID(a) As id,  a.name AS name, round(toFloat(SUM(1.0/size(r)) ) * 100)/100 AS score , filenames as f, dnames as d
    RETURN  id, name, score  ORDER BY ${orderExpr} LIMIT ${this.number}`;
    this._dbService.runQuery(cql, cb, DbResponseType.table);

  }

  loadGraph(skip: number, filter?: TableFiltering) {
    const isClientSidePagination = this._g.userPrefs.queryResultPagination.getValue() == 'Client';
    const cb = (x) => {
      this.seeds = []
      if (isClientSidePagination) {
        this._cyService.loadElementsFromDatabase(this.filterGraphResponse(x), this.tableInput.isMergeGraph);
        this.seeds = this.developers;
        this.seeds.push(this.prId)
        const seedNodes = this._g.cy.nodes(this.seeds.map(x => '#n' + x).join());
        if (this._g.userPrefs.highlightStyles.length < 2) {
          const cyStyle = getCyStyleFromColorAndWid('#0b9bcd', 4.5);
          this._g.viewUtils.addHighlightStyle(cyStyle.node, cyStyle.edge);
        }
        const currHighlightIdx = this._g.userPrefs.currHighlightIdx.getValue();
        if (currHighlightIdx == 0) {
          this._g.viewUtils.highlight(seedNodes, 1);
        } else {
          this._g.viewUtils.highlight(seedNodes, 0);
        }

        
      } else {
        this._cyService.loadElementsFromDatabase(x, this.tableInput.isMergeGraph);
      }
      if (!filter || this.graphResponse == null) {
        this.graphResponse = x;
      }
      this.clusterByDeveloper();
    };
    

    const cql =`
    UNWIND [${this.developersName}] AS dID
    MATCH (pr:PullRequest{name:'${this.pr}'})
    OPTIONAL Match(pr)-[e1:INCLUDES]->(n1:Commit)-[e2:CONTAINS]->(n2:File)<-[e3:CONTAINS]-(n3:Commit)<-[e4:REFERENCES|INCLUDES]-(n4)-[e5]-(n5:Developer{name:dID}) 
    OPTIONAL Match (pr)-[e11:INCLUDES]->(n11:Commit)-[e21:CONTAINS]->(n21:File)<-[e31:CONTAINS]-(n31:Commit)<-[e41:COMMITS]-(n41:Developer{name:dID})
    OPTIONAL Match (pr)-[e6]-(n6:Developer{name:dID})
    return pr,e1,e2,e3,e4,n1,n2,n3,n4,e5,e11,e21,e31,e41,n11,n21,n31,n41, n5,n6,e6`
    this._dbService.runQuery(cql, cb);
  }

  fillTable(data: DeveloperData[], totalDataCount: number | null) {
    const uiColumns = ['id'].concat(this.tableInput.columns);
    const columnTypes = [TableDataType.string, TableDataType.string, TableDataType.string,TableDataType.string];

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

  fillGenres(data) {
    this.prs = [];
    this.prIds = [];
    for (let i = 0; i < data.data.length; i++) {
      this.prs.push(data.data[i][0]);
    }
    for (let i = 0; i < data.data.length; i++) {
      this.prIds.push(data.data[i][1]);
    }
  }

  getDataForQueryResult(e: TableRowMeta) {
    const cb = (x) => {
      this.seeds = []
      this._cyService.loadElementsFromDatabase(x, this.tableInput.isMergeGraph)
      this.seeds = e.dbIds;
      this.seeds.push(this.prId)
      console.log(this.seeds)
      const seedNodes = this._g.cy.nodes(this.seeds.map(x => '#n' + x).join());
      if (this._g.userPrefs.highlightStyles.length < 2) {
        const cyStyle = getCyStyleFromColorAndWid('#0b9bcd', 4.5);
        this._g.viewUtils.addHighlightStyle(cyStyle.node, cyStyle.edge);
      }
      const currHighlightIdx = this._g.userPrefs.currHighlightIdx.getValue();
      if (currHighlightIdx == 0) {
        this._g.viewUtils.highlight(seedNodes, 1);
      } else {
        this._g.viewUtils.highlight(seedNodes, 0);
      }     
    }

    const idFilter = buildIdFilter(e.dbIds);
    const ui2Db = { 'Title': 'n.primary_title' };
    const orderExpr = getOrderByExpression4Query(null, 'score', 'desc', ui2Db);
    const dateFilter = this.getDateRangeCQL();
    const cql =` UNWIND [${e.dbIds}]  AS dID
    MATCH (pr:PullRequest{name:'${this.pr}'})
    OPTIONAL Match(pr)-[e1:INCLUDES]->(n1:Commit)-[e2:CONTAINS]->(n2:File)<-[e3:CONTAINS]-(n3:Commit)<-[e4:REFERENCES|INCLUDES]-(n4)-[e5]-(n5:Developer) 
    WHERE ID(n5) = dID
    OPTIONAL Match (pr)-[e11:INCLUDES]->(n11:Commit)-[e21:CONTAINS]->(n21:File)<-[e31:CONTAINS]-(n31:Commit)<-[e41:COMMITS]-(n41:Developer)
    WHERE ID(n41) = dID
    OPTIONAL Match (pr)-[e6]-(n6:Developer{name:dID})
    WHERE ID(n6) = dID
    return pr,e1,e2,e3,e4,n1,n2,n3,n4,e5,e11,e21,e31,e41,n11,n21,n31,n41, n5,n6,e6`
    this._dbService.runQuery(cql, cb);
  }

  filterTable(filter: TableFiltering) {
    this.tableInput.currPage = 1;
    let skip = filter.skip ? filter.skip : 0;
    this.loadTable(skip, filter);
  }

  // zip paralel arrays 
  private preprocessTableData(data): DeveloperData[] {
    const dbColumns = data.columns as string[];
    const uiColumns = ['id'].concat(this.tableInput.columns);
    let columnMapping = [];
    for (let i = 0; i < uiColumns.length; i++) {
      columnMapping.push(dbColumns.indexOf(uiColumns[i]));
    }
    const rawData = data.data;
    const objArr: DeveloperData[] = [];
    for (let i = 0; i < rawData.length; i++) {
      const obj = {};
      for (let j = 0; j < columnMapping.length; j++) {
        obj[uiColumns[j]] = rawData[i][columnMapping[j]];
      }
      objArr.push(obj as DeveloperData)
    }
    return objArr;
  }

  private filterTableResponse(x: DeveloperData[], filter: TableFiltering): DeveloperData[] {
    if (!filter || ((!filter.txt || filter.txt.length < 1) && filter.orderDirection == '' && (!filter.skip || filter.skip == 0))) {
      const skip = filter && filter.skip ? filter.skip : 0;
      this.tableInput.resultCnt = x.length;
      return x.slice(skip, skip + this._g.userPrefs.dataPageSize.getValue());
    }
    const isIgnoreCase = this._g.userPrefs.isIgnoreCaseInText.getValue();
    let filtered: DeveloperData[] = [];

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
  private filterGraphResponse(x: GraphResponse): GraphResponse {
    /*
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
    */
    return x;
  }

  //Cluster by developer
  clusterByDeveloper() {
    console.log(this.cluster)
    if(this.cluster) {
      this._cyService.expandAllCompounds();
      this._cyService.deleteClusteringNodes();
      this._g.performLayout(false);
      this._cyService.changeGroupingOption(GroupingOptionTypes.compound)
      const seedNodes = this.developers.map(x => 'n' + x);
      console.log(seedNodes)
      this._group.clusterByDeveloper(seedNodes)      
    }
    else {
      // expand all collapsed without animation (sync)
      this._g.expandCollapseApi.expandAll(C.EXPAND_COLLAPSE_FAST_OPT);
      const compounNodes = this._g.cy.$('.' + C.CLUSTER_CLASS);
      const clusters: string[][] = [];
      for (let i = 0; i < compounNodes.length; i++) {
        const cluster = compounNodes[i].children().not('.' + C.CLUSTER_CLASS).map(x => x.id());
        clusters.push(cluster);
      }
      this._g.layout.clusters = clusters;
      // delete the compound nodes
      this._cyService.removeGroup4Selected(this._g.cy.nodes('.' + C.CLUSTER_CLASS), true, true);
    }

  }
  getHtml(badges: number[]): string {
    let s = '';
    for (let i = 0; i < badges.length; i++) {
      s += `<span class="badge badge-pill badge-primary strokeme">${formatNumber(badges[i], 'en', '1.0-2')}</span>`
    }
    console.log(s)
    return s;
  }
  devSize(){
    for (let i = 0; i < this.developers.length -1; i++) {
      const div = document.createElement('div');
      div.innerHTML = this.getHtml([this.scores[i]]);
      div.style.position = 'absolute';
      div.style.top = '100px';
      div.style.left = '100px';
     // this._g.cy.nodes('#n' +this.developers[i]).addClass("addBadge")
     document.getElementById('cy').append(div);
    }

  }
  

  private getDateRangeCQL() {
    const isLimit = this._g.userPrefs.isLimitDbQueries2range.getValue();
    if (!isLimit) {
      return 'TRUE';
    }
    const d1 = this._g.userPrefs.dbQueryTimeRange.start.getValue();
    const d2 = this._g.userPrefs.dbQueryTimeRange.end.getValue();
    return `a.start > ${d1} AND b.createdAt > ${d1} AND a.end < ${d2} AND b.end < ${d2}`;
  }

}