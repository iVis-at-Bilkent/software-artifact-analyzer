import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as C from 'src/app/visuall/constants';
import { Neo4jDb } from '../../../visuall/db-service/neo4j-db.service';
import { CytoscapeService } from '../../../visuall/cytoscape.service';
import { GlobalVariableService } from '../../../visuall/global-variable.service';
import { TableViewInput, TableDataType, TableFiltering, TableRowMeta, TableData } from '../../../shared/table-view/table-view-types';
import { Subject } from 'rxjs';
import { buildIdFilter, getOrderByExpression4Query, getQueryCondition4TxtFilter } from '../query-helper';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { getCyStyleFromColorAndWid, readTxtFile, isJson } from 'src/app/visuall/constants';
import { GroupingOptionTypes } from '../../../visuall/user-preference';
import { GroupCustomizationService } from 'src/app/custom/group-customization.service';
import { GENERIC_TYPE, LONG_MAX, LONG_MIN } from 'src/app/visuall/constants';
import { TimebarGraphInclusionTypes } from 'src/app/visuall/user-preference';
import { TheoreticPropertiesCustomService } from 'src/app/custom/theoretic-properties-custom.service'
export interface DeveloperData {
  name: string;
  score: number;
  id: number;

}
@Component({
  selector: 'app-query4',
  templateUrl: './query4.component.html',
  styleUrls: ['./query4.component.css']
})
export class Query4Component implements OnInit {
  githubHttpOptions: any;
  authentication: any;
  file: string;
  fileId: number;
  files: string[];
  fileIds: number[];
  developers = [];
  scores = [];
  developersName = [];
  reviewers: string[] = [];
  isObjectQuery = true;
  commits = [];
  seeds = [];
  number = 3;
  assigned: boolean = false
  tableFilter: TableFiltering = { orderBy: null, orderDirection: null, txt: '', skip: null };
  tableInput: TableViewInput = {
    columns: ['name', 'score'], results: [], results2: [], isEmphasizeOnHover: true, tableTitle: 'Query Results', classNameOfObjects: 'Developer', isShowExportAsCSV: true,
    resultCnt: 0, currPage: 1, pageSize: 0, isLoadGraph: false, isMergeGraph: false, isNodeData: true, isSelect: false
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
    this.files = [];
    this.developers = [];
    this.scores = [];
    this.developersName = [];
    this.commits = [];
  }

  ngOnInit() {

    this._dbService.runQuery('MATCH (m:File) return m.name as name , ID(m) as id order by m.name ', (x) => {
      this.fillGenres(x)
    }, DbResponseType.table);
    if (this._g.cy.$(':selected').length > 0 && this._g.cy.$(':selected')[0]._private.classes.values().next().value === "File") {
      this.file = this._g.cy.$(':selected')[0]._private.data.name;
    }
    else {
      this.file = this.files[0]
    }
    let name = ""
    this.tableInput.results = [];
    this._g.userPrefs.dataPageSize.subscribe(x => { this.tableInput.pageSize = x; });
    setInterval(() => {
      if (this._g.cy.$(':selected').length > 0 && this._g.cy.$(':selected')[0]._private.classes.values().next().value === "File" && this._g.cy.$(':selected')[0]._private.data.name !== name) {
        name = this._g.cy.$(':selected')[0]._private.data.name
        this.file = this._g.cy.$(':selected')[0]._private.data.name;
        this.isObjectQuery = false
      }
    }, 500)
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
    this.fileId = this.fileIds[this.files.indexOf(this.file)]
    const isClientSidePagination = this._g.userPrefs.queryResultPagination.getValue() == 'Client';
    const cb = (x) => {
      x.data.forEach(element => {
        this.developers.push(element[2])
        this.developersName.push("'" + element[1] + "'")
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
      f += ' AND ' + f1.substr(5);
    }
    if (f2.length > 0) {
      f += f2;
    }
    let dataCnt = this.tableInput.pageSize;
    if (isClientSidePagination) {
      dataCnt = this._g.userPrefs.dataPageLimit.getValue() * this._g.userPrefs.dataPageSize.getValue();
    }
    const r = `[${skip}..${skip + dataCnt}]`;
    const cql = ` 
    MATCH path1=(a:Developer)-[:COMMITTED]->(:Commit)-[:CONTAINS]->(b:File {name: '${this.file}'})
    OPTIONAL MATCH path2=(a)-[:COMMITTED]->(:Commit)-[:CONTAINS]->(:File)-[:RENAMED_TO]->(b)
    OPTIONAL MATCH path3=(a)-[:ASSIGNED_BY | ASSIGNED_TO | REPORTED | RESOLVED | CLOSED]-(:Issue)-[:REFERENCED]->(:Commit)-[:CONTAINS]->(b)
    OPTIONAL MATCH path4=(a)-[:REVIEWED | OPENED | MERGED]-(:PullRequest)-[:INCLUDES]->(:Commit)-[:CONTAINS]->(b)
    OPTIONAL MATCH path5=(a)-[:COMMITTED]->(:Commit)-[:CONTAINS]->()-[:RENAMED_TO]-(b)
    WITH a, COLLECT(path1) + COLLECT(path2) + COLLECT(path3)  + COLLECT(path4) + COLLECT(path5) AS allPaths
    
    UNWIND allPaths AS path
    WITH a, REDUCE(prod = 1, edge IN relationships(path) | prod * edge.recency) AS multipliedRecency, path
    
    WITH a, path, SUM(multipliedRecency / length(path)^2) AS rawScore
    
    WITH a, rawScore
    RETURN ID(a) AS id, a.name AS name, round(toFloat(SUM(rawScore)) * 100) / 100 AS score
    ORDER BY score DESC
    LIMIT ${this.number}
    ` 
    const cql2 = `MATCH path=(b:File {name : '${this.file}'})-[r*0..3]-(a:Developer)  
    WHERE NONE(rel in relationships(path) WHERE type(rel) = 'COMMENTED') ${f} 
    WITH reduce(prod = 1, edge IN relationships(path)  | prod * edge.recency) AS multipliedRecency, a,r,b
    WITH DISTINCT ID(a) As id,  a.name AS name,round(toFloat(SUM(multipliedRecency / size(r))) * 100) / 100 AS score
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
        this.seeds.push(this.fileId)
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
      this.devSize();
    };

    const cql = ` 
    MATCH path1=(a:Developer)-[:COMMITTED]->(:Commit)-[:CONTAINS]->(b:File {name: '${this.file}'})
    OPTIONAL MATCH path2=(a)-[:COMMITTED]->(:Commit)-[:CONTAINS]->(:File)-[:RENAMED_TO]->(b)
    OPTIONAL MATCH path3=(a)-[:ASSIGNED_BY | ASSIGNED_TO | REPORTED | RESOLVED | CLOSED]-(:Issue)-[:REFERENCED]->(:Commit)-[:CONTAINS]->(b)
    OPTIONAL MATCH path4=(a)-[:REVIEWED | OPENED | MERGED]-(:PullRequest)-[:INCLUDES]->(:Commit)-[:CONTAINS]->(b)
    OPTIONAL MATCH path5=(a)-[:COMMITTED]->(:Commit)-[:CONTAINS]->()-[:RENAMED_TO]-(b)
    WITH a, COLLECT(path1) + COLLECT(path2) + COLLECT(path3)  + COLLECT(path4) + COLLECT(path5) AS allPaths
    
    UNWIND allPaths AS path
    WITH a, REDUCE(prod = 1, edge IN relationships(path) | prod * edge.recency) AS multipliedRecency, path
    
    WITH a, path, SUM(multipliedRecency / length(path)^2) AS rawScore
    
    WITH a, rawScore,path
    RETURN ID(a) AS id, a.name AS name, round(toFloat(SUM(rawScore)) * 100) / 100 AS score, COLLECT(path) AS paths
    ORDER BY score DESC
    LIMIT ${this.number}`
    this._dbService.runQuery(cql, cb);
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
    this.files = [];
    this.fileIds = [];
    for (let i = 0; i < data.data.length; i++) {
      this.files.push(data.data[i][0]);
    }
    for (let i = 0; i < data.data.length; i++) {
      this.fileIds.push(data.data[i][1]);
    }


  }

  getDataForQueryResult(e: TableRowMeta) {
    const cb = (x) => {
      this.seeds = []
      this._cyService.loadElementsFromDatabase(x, this.tableInput.isMergeGraph)
      this.seeds = e.dbIds;
      this.seeds.push(this.fileId)
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


    const cql = `UNWIND [${this.developersName}] AS dID
    MATCH path1=(a:Developer)-[:COMMITTED]->(:Commit)-[:CONTAINS]->(b:File {name: '${this.file}'})
    OPTIONAL MATCH path2=(a)-[:COMMITTED]->(:Commit)-[:CONTAINS]->(:File)-[:RENAMED_TO]->(b)
    OPTIONAL MATCH path3=(a)-[:ASSIGNED_BY | ASSIGNED_TO | REPORTED | RESOLVED | CLOSED]-(:Issue)-[:REFERENCED]->(:Commit)-[:CONTAINS]->(b)
    OPTIONAL MATCH path4=(a)-[:REVIEWED | OPENED | MERGED]-(:PullRequest)-[:INCLUDES]->(:Commit)-[:CONTAINS]->(b)
    OPTIONAL MATCH path5=(a)-[:COMMITTED]->(:Commit)-[:CONTAINS]->()-[:RENAMED_TO]-(b)
    WITH a, COLLECT(path1) + COLLECT(path2) + COLLECT(path3)  + COLLECT(path4) + COLLECT(path5) AS allPaths
    
    UNWIND allPaths AS path
    WITH a, REDUCE(prod = 1, edge IN relationships(path) | prod * edge.recency) AS multipliedRecency, path
    RETURN  nodes(path) AS nodes, relationships(path) AS relationships`
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
  devSize() {
    if(this.size){
      let elements = this._g.cy.nodes(this.developers.map(x => '#n' + x).join());
      let devs = elements.filter((element) => element._private.classes.values().next().value == 'Developer');
      this._gt.knowAboutScore(devs, this.scores)
      this._gt.showHideBadges(true)
    }
    else {
      for (let i = 0; i < this.developers.length - 1; i++) {
        let element = this._g.cy.nodes('#n' + this.developers[i])[0];
        if (element._private.classes.values().next().value == 'Developer') {
        element.removeClass('graphTheoreticDisplay')
        }

      }
      this._gt.showHideBadges(false)

    }
    /*
    if (this.size) {
      for (let i = 0; i < this.developers.length - 1; i++) {
        let element = this._g.cy.nodes('#n' + this.developers[i])[0]
        if (element._private.classes.values().next().value == 'Developer') {
          let selector = "knowAbout" + this.developers[i]
          element.addClass(selector);
          console.log(element)
          const div1 = document.createElement("div");
          let number = this.scores[i];
          if (number > 0) {
            div1.innerHTML = `<span class="badge rounded-pill bg-primary">${number}</span>`;
            element.addCue({
              htmlElem: div1,
              id: element._private.data.name,
              show: "always",
              position: "top-right",
              marginX: "%0",
              marginY: "%8",
              cursor: "pointer",
              zIndex: 1000,

            });
            let avgSize = this.currNodeSize ;
            let maxVal = Math.max(...this.scores);
            console.log(avgSize,maxVal )
            this._g.cy.style().selector(`node.${selector}`)
              .style(
                {
                  'width': (e) => {
                    let b = avgSize + 20;
                    let a = Math.max(5, avgSize - 20);
                    let x = this.scores[i] ;
                    return ((b - a) * x / maxVal + a) + 'px';
                  },
                  'height': (e) => {
                    let b = avgSize + 20;
                    let a = Math.max(5, avgSize - 20);
                    let x = this.scores[i];
                    return (((b - a) * x / maxVal + a) * e.height() / e.width()) + 'px';
                  }
                })
              .update();
          }
        }
      }


    }
    else {
      for (let i = 0; i < this.developers.length - 1; i++) {
        let element = this._g.cy.nodes('#n' + this.developers[i])[0];
        if (element._private.classes.values().next().value == 'Developer') {
        let selector = "knowAbout" + this.developers[i]
        element.removeCue()
        element.removeClass(selector)
        }

      }

    }
*/
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
}