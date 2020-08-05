import { Component, OnInit, ViewChild } from '@angular/core';
import { GlobalVariableService } from 'src/app/global-variable.service';
import properties from '../../../../assets/generated/properties.json';
import { DbAdapterService } from 'src/app/db-service/db-adapter.service';
import { CytoscapeService } from 'src/app/cytoscape.service';
import { TableViewInput, property2TableData, TableData, TableDataType } from 'src/app/table-view/table-view-types';
import { Subject } from 'rxjs';
import { DbQueryType, Neo4jEdgeDirection, GraphElem } from 'src/app/db-service/data-types';
import { getCyStyleFromColorAndWid, readTxtFile } from 'src/app/constants';

@Component({
  selector: 'app-advanced-queries',
  templateUrl: './advanced-queries.component.html',
  styleUrls: ['./advanced-queries.component.css']
})
export class AdvancedQueriesComponent implements OnInit {
  @ViewChild('file', { static: false }) file;
  queries: string[];
  selectedQuery: string;
  selectedIdx: number;
  nodeEdgeClasses: string[] = [];
  ignoredTypes: string[] = [];
  lengthLimit = 2;
  isDirected = true;
  isMerge = true;
  isGraph = true;
  selectedNodes: { dbId: string, label: string }[] = [];
  selectedClass = '';
  targetOrRegulator = 0;
  addNodeBtnTxt = 'Select Nodes to Add';
  tableInput: TableViewInput = {
    columns: ['Title'], results: [], isEmphasizeOnHover: true, tableTitle: 'Query Results',
    resultCnt: 0, currPage: 1, pageSize: 0, isLoadGraph: true, isMergeGraph: true, isNodeData: true
  };
  tableFilled = new Subject<boolean>();

  constructor(private _g: GlobalVariableService, private _dbService: DbAdapterService, private _cyService: CytoscapeService) {
    this.queries = ['Get graph of interest', 'Get common targets/regulators'];
    this.selectedIdx = -1;
  }

  ngOnInit(): void {
    this.selectedQuery = '';
    for (const n in properties.nodes) {
      this.nodeEdgeClasses.push(n);
    }
    for (const e in properties.edges) {
      this.nodeEdgeClasses.push(e);
    }
  }

  changeAdvancedQuery(event) {
    this.selectedIdx = this.queries.findIndex(x => x == event.target.value);
  }

  addSelectedNodes() {
    if (this._g.isSwitch2ObjTabOnSelect) {
      this._g.isSwitch2ObjTabOnSelect = false;
      this.addNodeBtnTxt = 'Complete Selection';
      return;
    }
    this.addNodeBtnTxt = 'Select Nodes to Add';
    this._g.isSwitch2ObjTabOnSelect = true;
    const selectedNodes = this._g.cy.nodes(':selected');
    if (selectedNodes.length < 1) {
      return;
    }
    const dbIds = selectedNodes.map(x => x.id().slice(1));
    const labels = this._g.getLabels4Elems(dbIds).split(',');
    const types = selectedNodes.map(x => x.classes()[0]);
    for (let i = 0; i < labels.length; i++) {
      if (this.selectedNodes.findIndex(x => x.dbId == dbIds[i]) < 0) {
        this.selectedNodes.push({ dbId: dbIds[i], label: types[i] + ':' + labels[i] });
      }
    }
  }

  removeSelected(i: number) {
    this.selectedNodes.splice(i, 1);
  }

  removeAllSelectedNodes() {
    this.selectedNodes = [];
  }

  runQuery() {
    const dbIds = this.selectedNodes.map(x => x.dbId);
    if (dbIds.length < 1) {
      return;
    }
    let prepareDataFn = (x) => { this.fillTable(x); };
    if (this.isGraph) {
      prepareDataFn = (x) => { this.fillTable(x); this._cyService.loadElementsFromDatabase(x, this.isMerge); this.higlightSeedNodes(); };
    }
    const setDataCntFn = (x) => { this.tableInput.resultCnt = x.data[0]; }
    this.ignoredTypes = this.ignoredTypes.map(x => `'${x}'`);
    if (this.selectedIdx == 0) {
      this._dbService.getGraphOfInterest(dbIds, this.ignoredTypes, this.lengthLimit, this.isDirected, DbQueryType.count, setDataCntFn);
      this._dbService.getGraphOfInterest(dbIds, this.ignoredTypes, this.lengthLimit, this.isDirected, DbQueryType.std, prepareDataFn);
    } else if (this.selectedIdx == 1) {
      let dir: Neo4jEdgeDirection = this.targetOrRegulator;
      if (!this.isDirected) {
        dir = Neo4jEdgeDirection.BOTH;
      }
      this._dbService.getCommonStream(dbIds, this.ignoredTypes, this.lengthLimit, dir, DbQueryType.count, setDataCntFn);
      this._dbService.getCommonStream(dbIds, this.ignoredTypes, this.lengthLimit, dir, DbQueryType.std, prepareDataFn);
    }
  }

  // fill table from graph response
  private fillTable(data) {
    let arr = data['nodes'];

    this.tableInput.results = [];
    this.tableInput.columns = [];

    for (let i = 0; i < arr.length; i++) {
      const d = arr[i].properties;
      delete d['tconst'];
      delete d['nconst'];
      const propNames = Object.keys(d);
      const row: TableData[] = [{ type: TableDataType.string, val: arr[i].id }];
      for (const n of propNames) {
        const idx = this.tableInput.columns.indexOf(n);
        if (idx == -1) {
          this.tableInput.columns.push(n);
          row[this.tableInput.columns.length] = property2TableData(n, d[n], arr[i].labels[0], false);
        } else {
          row[idx + 1] = property2TableData(n, d[n], arr[i].labels[0], false);
        }
      }
      // fill empty columns
      for (let j = 0; j < this.tableInput.columns.length + 1; j++) {
        if (!row[j]) {
          row[j] = { val: '', type: TableDataType.string };
        }
      }
      this.tableInput.results.push(row);
    }

    this.tableFilled.next(true);
  }

  private higlightSeedNodes() {
    const dbIds = this.selectedNodes.map(x => x.dbId);
    const seedNodes = this._g.cy.nodes(dbIds.map(x => '#n' + x).join());
    // add a new higlight style
    if (this._g.userPrefs.highlightStyles.length < 2) {
      const cyStyle = getCyStyleFromColorAndWid('#0b9bcd', 4.5);
      this._g.viewUtils.addHighlightStyle(cyStyle.nodeCss, cyStyle.edgeCss);
    }
    const currHighlightIdx = this._g.userPrefs.currHighlightIdx.getValue();
    if (currHighlightIdx == 0) {
      this._g.viewUtils.highlight(seedNodes, 1);
    } else {
      this._g.viewUtils.highlight(seedNodes, 0);
    }
  }

  addSelectedNodesFromFile() {
    this.file.nativeElement.value = '';
    this.file.nativeElement.click();
  }

  fileSelected() {
    readTxtFile(this.file.nativeElement.files[0], (txt) => {
      let elems: GraphElem[] = [];
      const fName = this.file.nativeElement.files[0].name;
      if (fName.toLowerCase().endsWith('.csv')) {
        const arr = txt.split('\n').map(x => x.split('|'));
        const idx4id = arr[0].indexOf('id');

        for (let i = 1; i < arr.length; i++) {
          if (this.selectedNodes.find(x => x.dbId == arr[i][idx4id].substring(1))) {
            continue;
          }
          const o = {};
          for (let j = 1; j < arr.length; j++) {
            o[arr[0][j]] = arr[i][j];
          }
          elems.push({ classes: arr[i][0], data: o });
        }
      } else {
        elems = JSON.parse(txt) as GraphElem[];
        const fn1 = x => this.selectedNodes.find(y => y.dbId === x.data.id.substring(1)) === undefined;
        if (!(elems instanceof Array)) {
          elems = (JSON.parse(txt).nodes as any[]).filter(fn1);
        } else {
          elems = elems.filter(x => x.data.id.startsWith('n') && fn1(x));
        }
      }

      const labels = this._g.getLabels4Elems(null, true, elems).split(',');
      this.selectedNodes = this.selectedNodes.concat(elems.map((x, i) => { return { dbId: x.data.id.substring(1), label: x.classes.split(' ')[0] + ':' + labels[i] } }));
    });
  }

  addRemoveType(e: { className: string, willBeShowed: boolean }) {
    if (e.willBeShowed) {
      const idx = this.ignoredTypes.findIndex(x => x === e.className);
      if (idx > -1) {
        this.ignoredTypes.splice(idx, 1);
      }
    } else {
      if (!this.ignoredTypes.includes(e.className)) {
        this.ignoredTypes.push(e.className);
      }
    }
  }
}
