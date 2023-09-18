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
import { TheoreticPropertiesCustomService } from 'src/app/custom/theoretic-properties-custom.service'
import { GENERIC_TYPE, LONG_MAX, LONG_MIN } from 'src/app/visuall/constants';
import { TimebarGraphInclusionTypes } from 'src/app/visuall/user-preference';
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
  githubHttpOptions: any;
  authentication: any;
  pr: string;
  prId: number;
  prs: string[];
  prIds: number[];
  developers = [];
  scores = [];
  fileIds = [];
  ignoredDevelopers = [];
  reviewers: string[] = [];
  commits = [];
  seeds = [];
  number = 3;
  assigned: boolean = false
  tableFilter: TableFiltering = { orderBy: null, orderDirection: null, txt: '', skip: null };
  tableInput: TableViewInput = {
    columns: ['name', 'score'], results: [], results2: [], isEmphasizeOnHover: true, tableTitle: 'Query Results', classNameOfObjects: 'Developer', isShowExportAsCSV: true,
    resultCnt: 0, currPage: 1, pageSize: 0, isLoadGraph: false, isMergeGraph: false, isNodeData: true, isSelect: true
  };
  tableFilled = new Subject<boolean>();
  tableResponse = null;
  graphResponse = null;
  clearTableFilter = new Subject<boolean>();
  cluster = true;
  size = false;
  readonly ZOOM_THRESHOLD = 0.8;
  readonly NODE_SIZE = 40;
  maxPropValue = 1;
  currNodeSize = this.NODE_SIZE;
  algorithm = null;

  constructor(private http: HttpClient, private _dbService: Neo4jDb, private _cyService: CytoscapeService, private _g: GlobalVariableService, private _group: GroupCustomizationService, private _gt: TheoreticPropertiesCustomService) {
    this.prs = [];
    this.developers = [];
    this.scores = [];
    this.fileIds = [];
    this.ignoredDevelopers = [];
    this.commits = [];
  }

  ngOnInit() {

    this._dbService.runQuery('MATCH (m:PullRequest) return m.name as name , ID(m) as id order by m.name ', (x) => {
      this.fillGenres(x)
    }, DbResponseType.table);
    let name = ""
    if (this._g.cy.$(':selected').length > 0 && this._g.cy.$(':selected')[0]._private.classes.values().next().value === "PullRequest") {
      this.pr = this._g.cy.$(':selected')[0]._private.data.name;
    }
    else {
      this.pr = this.prs[0]
    }
    this.http.get(`http://${window.location.hostname}:4445/getAuthentication`).subscribe(data => {
      this.authentication = data;
      this.githubHttpOptions = {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${this.authentication.github_token}`,
          'Accept': 'application/vnd.github.v3+json',
          "X-GitHub-Api-Version": "2022-11-28",
          'Content-Type': 'application/json'
        })
      };
    });

    this.tableInput.results = [];
    this._g.userPrefs.dataPageSize.subscribe(x => { this.tableInput.pageSize = x; });

    setInterval(() => {
      if (this._g.cy.$(':selected').length > 0 && this._g.cy.$(':selected')[0]._private.classes.values().next().value === "PullRequest" && this._g.cy.$(':selected')[0]._private.data.name !== name) {
        name = this._g.cy.$(':selected')[0]._private.data.name
        this.pr = this._g.cy.$(':selected')[0]._private.data.name;
      }
    }, 500)
  }
  assign() {
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
    this.scores = [];
    this.prId = this.prIds[this.prs.indexOf(this.pr)]
    const isClientSidePagination = this._g.userPrefs.queryResultPagination.getValue() == 'Client';
    const cb = (x) => {
      this.developers = x.data[0][0]
      this.scores = x.data[0][2]
      console.log(this.developers)
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
      if (this.tableInput.isLoadGraph) {

        this.loadGraph(skip, this.tableFilter)

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
    const f1 = this.dateFilterFromUserPref('a', true);
    const f2 = this.dateFilterFromUserPref('b', true);
    let f = '';
    if (f1.length > 0) {
      f += ' WHERE ' + f1.substr(5);
    }
    if (f2.length > 0) {
      f += f2;
    }
    let dataCnt = this.tableInput.pageSize;
    if (isClientSidePagination) {
      dataCnt = this._g.userPrefs.dataPageLimit.getValue() * this._g.userPrefs.dataPageSize.getValue();
    }
    const r = `[${skip}..${skip + dataCnt}]`;

    const pageSize = this.getPageSize4Backend();
    const currPage = skip ? Math.floor(skip / pageSize) + 1 : 1;
    const orderBy = 'score';
    let orderDir = 0;
    const timeMap = this.getTimebarMapping4Java();
    let d1 = this._g.userPrefs.dbQueryTimeRange.start.getValue();
    let d2 = this._g.userPrefs.dbQueryTimeRange.end.getValue();
    if (!this._g.userPrefs.isLimitDbQueries2range.getValue()) {
      d1 = 0;
      d2 = 0;
    }
    const inclusionType = this._g.userPrefs.objectInclusionType.getValue();
    const timeout = this._g.userPrefs.dbTimeout.getValue() * 1000;
    const cbSub1 = (x) => {
      console.log(x.data)
      this.ignoredDevelopers = x.data[0][0]
      this._dbService.runQuery(`MATCH (N:PullRequest{name:'${this.pr}'})-[:INCLUDES]-(c:Commit)-[:CONTAINS]-(f:File) WITH collect(distinct ID(f)) AS fileIds  RETURN fileIds`, cbSub2, DbResponseType.table, false);
    }
    const cbSub2 = (x) => {
      this.fileIds = x.data[0][0]
      this._dbService.runQuery(`CALL findNodesWithMostPathBetweenTable([${this.fileIds}], ['COMMENTED'],'Developer',[${this.ignoredDevelopers}],3,${this.number}, false,
      ${pageSize}, ${currPage}, null, false, '${orderBy}', ${orderDir}, ${timeMap}, ${d1}, ${d2}, ${inclusionType}, ${timeout}, null)`, cb, DbResponseType.table, false);
    }
    this._dbService.runQuery(`MATCH (N:PullRequest{name:'${this.pr}'})-[:INCLUDES]-(c:Commit)-[:COMMITTED]-(d:Developer) WITH collect(distinct ID(d)) AS ignoreDevs return ignoreDevs`, cbSub1, DbResponseType.table, false);


  }

  loadGraph(skip: number, filter?: TableFiltering) {
    const isClientSidePagination = this._g.userPrefs.queryResultPagination.getValue() == 'Client';
    const cb = (x) => {
      this.seeds = []

      const cbSub1 = (y) => {
        let result = this.prepareElems4Cy(x)
        console.log(y)
        result.nodes = result.nodes.concat(y.nodes)
        result.edges = result.edges.concat(y.edges)
        console.log(result)
        if (isClientSidePagination) {
          this._cyService.loadElementsFromDatabase(this.filterGraphResponse(result), this.tableInput.isMergeGraph);
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
        }
        else {
          this._cyService.loadElementsFromDatabase(result, this.tableInput.isMergeGraph);
        }
        if (!filter || this.graphResponse == null) {
          this.graphResponse = x;
        }
        this.clusterByDeveloper();
        this.devSize();
      }
      this._dbService.runQuery(`MATCH p=(N:PullRequest{name:'${this.pr}'})-[:INCLUDES]-(c:Commit)-[:CONTAINS]-(f:File)   RETURN p`, cbSub1, DbResponseType.graph, false);
    };
    let dataCnt = this.tableInput.pageSize;
    if (isClientSidePagination) {
      dataCnt = this._g.userPrefs.dataPageLimit.getValue() * this._g.userPrefs.dataPageSize.getValue();
    }
    const r = `[${skip}..${skip + dataCnt}]`;

    const t = filter.txt ?? '';
    const pageSize = this.getPageSize4Backend();
    const currPage = filter.skip ? Math.floor(filter.skip / pageSize) + 1 : 1;
    const orderBy = 'score';
    let orderDir = 0;
    if (filter.orderDirection == 'desc') {
      orderDir = 1;
    } else if (filter.orderDirection == '') {
      orderDir = 2;
    }
    const timeMap = this.getTimebarMapping4Java();
    let d1 = this._g.userPrefs.dbQueryTimeRange.start.getValue();
    let d2 = this._g.userPrefs.dbQueryTimeRange.end.getValue();
    if (!this._g.userPrefs.isLimitDbQueries2range.getValue()) {
      d1 = 0;
      d2 = 0;
    }
    const inclusionType = this._g.userPrefs.objectInclusionType.getValue();
    const timeout = this._g.userPrefs.dbTimeout.getValue() * 1000;
    this._dbService.runQuery(`CALL findNodesWithMostPathBetweenGraph([${this.fileIds}], ['COMMENTED'],'Developer',[${this.ignoredDevelopers}],3,${this.number}, false,
      ${pageSize}, ${currPage}, null, false, '${orderBy}', ${orderDir}, ${timeMap}, ${d1}, ${d2}, ${inclusionType}, ${timeout}, null)`, cb, DbResponseType.table, false);
  }

  fillTable(data: DeveloperData[], totalDataCount: number | null) {
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
    const cql = ` MATCH (pr:PullRequest{name: '${this.pr}'})-[:INCLUDES]->(commit:Commit)-[:CONTAINS]->(file:File)
    MATCH (dp:Developer)-[:COMMITTED]->(commit)
    WITH collect(distinct file.name) as filenames, collect(distinct dp) as developers
    
    UNWIND filenames as file
    MATCH path1=(a:Developer)-[:COMMITTED]->(:Commit)-[:CONTAINS]->(b:File {name: file})<-[:CONTAINS]-(:Commit)<-[:INCLUDES]-(pr)
    OPTIONAL MATCH path2=(a)-[:COMMITTED]->(:Commit)-[:CONTAINS]->(:File)-[:RENAMED_TO]->(b)<-[:CONTAINS]-(:Commit)<-[:INCLUDES]-(pr)
    OPTIONAL MATCH path3=(a)-[:ASSIGNED_BY | ASSIGNED_TO | REPORTED | RESOLVED | CLOSED]-(:Issue)-[:REFERENCED]->(:Commit)-[:CONTAINS]->(b)<-[:CONTAINS]-(:Commit)<-[:INCLUDES]-(pr)
    OPTIONAL MATCH path4=(a)-[:REVIEWED | OPENED | MERGED]-(:PullRequest)-[:INCLUDES]->(:Commit)-[:CONTAINS]->(b)<-[:CONTAINS]-(:Commit)<-[:INCLUDES]-(pr)
    OPTIONAL MATCH path5=(a)-[:COMMITTED]->(:Commit)-[:CONTAINS]->(b)-[:RENAMED_TO]-()<-[:CONTAINS]-(:Commit)<-[:INCLUDES]-(pr)
    
    WITH a, COLLECT(path1) + COLLECT(path2) + COLLECT(path3) + COLLECT(path4) + COLLECT(path5) AS allPaths, developers
    
    UNWIND allPaths AS path
    WITH a, REDUCE(prod = 1, edge IN relationships(path) | prod * edge.recency) AS multipliedRecency, path, developers
    
    WITH a, path, SUM(multipliedRecency / length(path)^2) AS rawScore, developers
    
    WITH a, rawScore, developers,path
    WHERE NOT a IN developers and ${idFilter}
    RETURN ID(a) AS id, a.name AS name, round(toFloat(SUM(rawScore)) * 100) / 100 AS score, COLLECT(path) AS paths
    ORDER BY score DESC
    LIMIT ${this.number}`
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
    const rawData = data.data[0];
    const objArr: DeveloperData[] = [];
    for (let i = 0; i < rawData[0].length; i++) {
      const obj = {};
      for (let j = 0; j < columnMapping.length; j++) {
        obj[uiColumns[j]] = rawData[columnMapping[j]][i];
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
    if (this.cluster) {
      this._cyService.expandAllCompounds();
      this._cyService.deleteClusteringNodes();
      this._g.performLayout(false);
      this._cyService.changeGroupingOption(GroupingOptionTypes.compound)
      const seedNodes = this.developers.map(x => 'n' + x);
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
    return s;
  }

  devSize() {
    if (this.size) {
      let elements = this._g.cy.nodes(this.developers.map(x => '#n' + x).join());
      let devs = elements.filter((element) => element._private.classes.values().next().value == 'Developer');
      this._gt.knowAboutScore(devs, this.scores)
      this._gt.showHideBadges(true)
    }
    else {
      for (let i = 0; i < this.developers.length - 1; i++) {
        let element = this._g.cy.nodes('#n' + this.developers[i])[0];
        console.log(this.developers[i])
        if (element._private.classes.values().next().value == 'Developer') {
          element.removeClass('graphTheoreticDisplay')
        }

      }
      this._gt.showHideBadges(false)

    }

  }
  private getPageSize4Backend(): number {
    let pageSize = this._g.userPrefs.dataPageSize.getValue();
    if (this._g.userPrefs.queryResultPagination.getValue() == 'Client') {
      pageSize = pageSize * this._g.userPrefs.dataPageLimit.getValue();
    }
    return pageSize;
  }

  private getTimebarMapping4Java(): string {
    // {Person:["start_t", "end_t"]}
    const mapping = this._g.appDescription.getValue().timebarDataMapping;
    let s = '{'
    for (const k in mapping) {
      s += k + ':["' + mapping[k].begin_datetime + '","' + mapping[k].end_datetime + '"],';
    }
    s = s.slice(0, -1);
    s += '}'
    return s;
  }

  private dateFilterFromUserPref(varName: string, isNode: boolean): string {
    if (!this._g.userPrefs.isLimitDbQueries2range.getValue()) {
      return '';
    }
    let s = '';
    let keys = [];

    if (isNode) {
      keys = Object.keys(this._g.appDescription.getValue().objects);
    } else {
      keys = Object.keys(this._g.appDescription.getValue().relations);
    }

    const d1 = this._g.userPrefs.dbQueryTimeRange.start.getValue();
    const d2 = this._g.userPrefs.dbQueryTimeRange.end.getValue();
    const inclusionType = this._g.userPrefs.objectInclusionType.getValue();
    const mapping = this._g.appDescription.getValue().timebarDataMapping;

    if (!mapping || Object.keys(mapping).length < 1) {
      return '';
    }

    s = ' AND (';
    for (const k of keys) {
      if (!mapping[k]) {
        continue;
      }
      const p1 = `COALESCE(${varName}.${mapping[k].begin_datetime}, ${LONG_MIN})`;
      const p2 = `COALESCE(${varName}.${mapping[k].end_datetime}, ${LONG_MAX})`;
      const bothNull = `(${varName}.${mapping[k].end_datetime} IS NULL AND ${varName}.${mapping[k].begin_datetime} IS NULL)`
      if (inclusionType == TimebarGraphInclusionTypes.overlaps) {
        s += `(${bothNull} OR (${p1} <= ${d2} AND ${p2} >= ${d1})) AND`;
      } else if (inclusionType == TimebarGraphInclusionTypes.contains) {
        s += `(${bothNull} OR (${d1} <= ${p1} AND ${d2} >= ${p2})) AND`;
      } else if (inclusionType == TimebarGraphInclusionTypes.contained_by) {
        s += `(${bothNull} OR (${p1} <= ${d1} AND ${p2} >= ${d2})) AND`;
      }

    }
    s = s.slice(0, -4)
    s += ')'
    return s;
  }

  prepareElems4Cy(data) {
    const idxNodes = data.columns.indexOf('nodes');
    const idxNodeId = data.columns.indexOf('nodeId');
    const idxNodeClass = data.columns.indexOf('nodeClass');
    const idxEdges = data.columns.indexOf('edges');
    const idxEdgeId = data.columns.indexOf('edgeId');
    const idxEdgeClass = data.columns.indexOf('edgeClass');
    const idxEdgeSrcTgt = data.columns.indexOf('edgeSourceTargets');

    const nodes = data.data[0][idxNodes];
    const nodeClass = data.data[0][idxNodeClass];
    const nodeId = data.data[0][idxNodeId];
    const edges = data.data[0][idxEdges];
    const edgeClass = data.data[0][idxEdgeClass];
    const edgeId = data.data[0][idxEdgeId];
    const edgeSrcTgt = data.data[0][idxEdgeSrcTgt];

    const cyData = { nodes: [], edges: [] };
    const nodeIdsDict = {};
    for (let i = 0; i < nodes.length; i++) {
      cyData.nodes.push({ id: nodeId[i], labels: [nodeClass[i]], properties: nodes[i] });
      nodeIdsDict[nodeId[i]] = true;
    }

    for (let i = 0; i < edges.length; i++) {
      const srcId = edgeSrcTgt[i][0];
      const tgtId = edgeSrcTgt[i][1];
      // check if src and target exist in cy or current data.
      const isSrcLoaded = this.tableInput.isMergeGraph ? this._g.cy.$('#n' + srcId).length > 0 : false;
      const isTgtLoaded = this.tableInput.isMergeGraph ? this._g.cy.$('#n' + tgtId).length > 0 : false;
      if ((nodeIdsDict[srcId] || isSrcLoaded) && (nodeIdsDict[tgtId] || isTgtLoaded)) {
        cyData.edges.push({ properties: edges[i], startNode: srcId, endNode: tgtId, id: edgeId[i], type: edgeClass[i] });
      }
    }

    return cyData;
  }

}