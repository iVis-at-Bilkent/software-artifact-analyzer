import { Injectable } from '@angular/core';
import { UserPref, GroupingOptionTypes } from './user-preference';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import appPref from '../../assets/appPref.json';
import { isPrimitiveType, debounce, LAYOUT_ANIM_DUR, COLLAPSED_EDGE_CLASS, COLLAPSED_NODE_CLASS, CLUSTER_CLASS, CY_BATCH_END_DELAY, EXPAND_COLLAPSE_FAST_OPT, HIGHLIGHT_OPACITY } from './constants';
import { GraphHistoryItem, GraphElem } from './db-service/data-types';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ErrorModalComponent } from './popups/error-modal/error-modal.component';
import { CyStyleCustomizationService } from '../custom/cy-style-customization.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalVariableService {
  private HISTORY_SNAP_DELAY = 1500; // we should wait for layout to finish
  private _isSetEnums = false;
  private _isErrorModalUp = false;
  cy: any;
  viewUtils: any;
  layoutUtils: any;
  layout: { clusters: string[][], randomize: boolean, tile: boolean, animationDuration: number, tilingPaddingVertical: number, tilingPaddingHorizontal: number };
  expandCollapseApi: any;
  hiddenClasses: Set<string>;
  setLoadingStatus: (boolean) => void;
  userPrefs: UserPref = {} as UserPref;
  userPrefsFromFiles: UserPref = {} as UserPref;
  shownElemsChanged = new BehaviorSubject<boolean>(true);
  operationTabChanged = new BehaviorSubject<number>(1);
  isSwitch2ObjTabOnSelect: boolean = true;
  graphHistory: GraphHistoryItem[] = [];
  showHideGraphHistory = new BehaviorSubject<boolean>(false);
  addNewGraphHistoryItem = new BehaviorSubject<boolean>(false);
  isLoadFromHistory: boolean = false;
  isLoadFromDB: boolean = false;
  openReportTab =new BehaviorSubject<boolean>(false);
  isLoadFromExpandCollapse: boolean = false;
  isUserPrefReady = new BehaviorSubject<boolean>(false);
  statusMsg = new BehaviorSubject<string>('');
  performLayout: Function;
  cyNaviPositionSetter: any;
  appDescription = new BehaviorSubject<any>(null);
  dataModel = new BehaviorSubject<any>(null);
  enums = new BehaviorSubject<any>(null);
  initialQuery: string="";
  //The anomaly settings
  constructor(private _http: HttpClient, private _modalService: NgbModal, private _cyCustomStyle: CyStyleCustomizationService) {
    this.hiddenClasses = new Set([]);
    // set user preferences staticly (necessary for rendering html initially)
    this.setUserPrefs(appPref, this.userPrefs);

    // set default values dynamically
    this._http.get('./assets/appPref.json').subscribe(x => {
      this.setUserPrefs(x, this.userPrefs);
      this.setUserPrefs(x, this.userPrefsFromFiles);

      // set user prefered values. These will be overriden if "Store User Profile" is checked
      this._http.get('/app/custom/config/app_description.json').subscribe(x => {
        this.appDescription.next(x);
        this.setUserPrefs(x['appPreferences'], this.userPrefs);
        this.setUserPrefs(x['appPreferences'], this.userPrefsFromFiles);
        this.isUserPrefReady.next(true);
      }, this.showErr.bind(this));
    }, this.showErr.bind(this));

    let isGraphEmpty = () => { return this.cy.elements().not(':hidden, :transparent').length > 0 };
    this.performLayout = debounce(this.performLayoutFn, LAYOUT_ANIM_DUR, false, isGraphEmpty);

    // set cytoscape.js style dynamicly
    this._http.get('./assets/generated/stylesheet.json').subscribe(x => {
      this.cy.style(x);
      this.addOtherStyles();
    }, this.showErr.bind(this));

    this._http.get('./assets/generated/properties.json').subscribe(x => {
      this.dataModel.next(x);
    }, this.showErr.bind(this));

    this._http.get('/app/custom/config/enums.json').subscribe(x => {
      this.enums.next(x);
    }, this.showErr.bind(this));
  }

  private showErr(e) {
    this.showErrorModal('Internet Error', e);
  }

  transfer2UserPrefs(u: any) {
    if (u) {
      this.setUserPrefs(u, this.userPrefs);
    }
  }

  runLayout() {
    const elems4layout = this.cy.elements().not(':hidden, :transparent');
    if (elems4layout.length < 1) {
      return;
    }
    if (this.layout.randomize) {
      this.statusMsg.next('Recalculating layout...');
    } else {
      this.statusMsg.next('Performing layout...');
    }
    this.setLoadingStatus(true);
    if (this.layout.clusters && this.layout.clusters.length > 0) {
      this.removeDeletedClusters();
      elems4layout.layout(this.getCiseOptions()).run();
    } else {
      elems4layout.layout(this.layout).run();
    }
    this.statusMsg.next('Rendering graph...');
  }

  private removeDeletedClusters() {
    const clusters = [];
    for (let i = 0; i < this.layout.clusters.length; i++) {
      const c = [];
      for (let j = 0; j < this.layout.clusters[i].length; j++) {
        if (this.cy.$id(this.layout.clusters[i][j]).length > 0) {
          c.push(this.layout.clusters[i][j]);
        }
      }
      if (c.length > 0) {
        clusters.push(c);
      }
    }
    this.layout.clusters = clusters;
  }

  switchLayoutRandomization(isRandomize: boolean) {
    this.layout.randomize = isRandomize;
    this.layoutUtils.setOption('randomize', isRandomize);
  }
  applyClassFiltering() {
    let hiddenSelector = '';
    for (let i of this.hiddenClasses) {
      hiddenSelector += '.' + i + ',';
    }

    hiddenSelector = hiddenSelector.substr(0, hiddenSelector.length - 1);

    if (hiddenSelector.length > 1) {
      this.viewUtils.hide(this.cy.$(hiddenSelector));
    }

    this.handleCompoundsOnHideDelete();
  }

  filterByClass(elems) {
    let hiddenSelector = '';
    for (let i of this.hiddenClasses) {
      hiddenSelector += '.' + i + ',';
    }

    hiddenSelector = hiddenSelector.substr(0, hiddenSelector.length - 1);

    if (hiddenSelector.length < 1) {
      return elems;
    }
    return elems.not(hiddenSelector);
  }

  getGraphElemSet() {
    return new Set<string>(this.cy.elements().map(x => x.id()));
  }

  highlightElems(elems) {
    this.viewUtils.highlight(elems, this.userPrefs.currHighlightIdx.getValue());
  }

  updateSelectionCyStyle() {
    this.cy.style().selector(':selected').style({
      'overlay-color': this.userPrefs.selectionColor.getValue(),
      'overlay-padding': this.userPrefs.selectionWidth.getValue()
    })
      .selector('edge:selected')
      .style({
        'overlay-padding': (e) => {
          return (this.userPrefs.selectionWidth.getValue() + e.width()) / 2 + 'px';
        },
      }).update();

    this.addStyle4Emphasize();
  }

  add2GraphHistory(expo: string) {
    setTimeout(() => {
      if (this.graphHistory.length > this.userPrefs.queryHistoryLimit.getValue() - 1) {
        this.graphHistory.splice(0, 1);
      }
      const options = { bg: 'white', scale: 1, full: true };
      const base64png: string = this.cy.png(options);
      const elements = this.cy.json().elements;

      let g: GraphHistoryItem = {
        expo: expo,
        base64png: base64png,
        json: elements
      };
      this.graphHistory.push(g);
      this.addNewGraphHistoryItem.next(true);
    }, this.HISTORY_SNAP_DELAY);
  }

  getLabels4Elems(elemIds: string[] | number[], isNode: boolean = true, objDatas: GraphElem[] = null): string {
    return this.getLabels4ElemsAsArray(elemIds, isNode, objDatas).join(',');
  }

  getLabels4ElemsAsArray(elemIds: string[] | number[], isNode: boolean = true, objDatas: GraphElem[] = null): string[] {
    let cyIds: string[] = [];
    let idChar = 'n';
    if (!isNode) {
      idChar = 'e';
    }
    if (objDatas) {
      cyIds = objDatas.map(x => x.data.id);
    } else {
      for (let i = 0; i < elemIds.length; i++) {
        cyIds.push(idChar + elemIds[i]);
      }
    }

    const labels = [];
    let labelParent: any = this.appDescription.getValue().objects;
    if (!isNode) {
      labelParent = this.appDescription.getValue().relations;
    }
    for (let i = 0; i < cyIds.length; i++) {
      let cName = '';
      if (!objDatas) {
        cName = this.cy.$('#' + cyIds[i]).className()[0];
      } else {
        cName = objDatas[i].classes.split(' ')[0];
      }

      let s = labelParent[cName]['style']['label'] as string;
      if (s.indexOf('(') < 0) {
        labels.push(s);
      } else {
        let propName = s.slice(s.indexOf('(') + 1, s.indexOf(')'));
        if (!objDatas) {
          labels.push(this.cy.$('#' + cyIds[i]).data(propName));
        } else {
          const currData = objDatas[i].data;
          let l = currData[propName];
          if (!l) {
            l = currData[Object.keys(currData)[0]]
          }
          labels.push(l);
        }
      }
    }

    return labels;
  }

  listen4graphEvents() {
    this.cy.on('layoutstop', () => {
      this.setLoadingStatus(false);
      this.statusMsg.next('');
    });
  }

  getFcoseOptions() {
    let p = 4;
    if (this.userPrefsFromFiles.tilingPadding) {
      p = this.userPrefsFromFiles.tilingPadding.getValue();
    }
    return {
      name: 'fcose',
      //Change the edge length
      idealEdgeLength: edge => 70,
      randomize: false,
      // whether or not to animate the layout
      animate: true,
      // duration of animation in ms, if enabled
      animationDuration: LAYOUT_ANIM_DUR,
      fit: true,
      // padding around layout
      padding: 10,
      // whether to include labels in node dimensions. Valid in 'proof' quality
      nodeDimensionsIncludeLabels: true,
      tile: true,
      // Represents the amount of the vertical space to put between the zero degree members during the tiling operation(can also be a function)
      tilingPaddingVertical: p,
      // Represents the amount of the horizontal space to put between the zero degree members during the tiling operation(can also be a function)
      tilingPaddingHorizontal: p,
      clusters: null // cise argument
    };
  }

  // delete/expand compounds if they don't have any visible elements
  handleCompoundsOnHideDelete() {
    const metaEdges = this.cy.edges('.' + COLLAPSED_EDGE_CLASS);
    // some collapsed edges should be expanded, or their data should be updated
    for (let i = 0; i < metaEdges.length; i++) {
      const collapsedEdges = metaEdges[i].data('collapsedEdges');
      if (collapsedEdges.filter(':visible').length < 2) {
        this.expandCollapseApi.expandEdges(metaEdges[i]);
      } else {
        metaEdges[i].data('collapsedEdges', collapsedEdges.filter(':visible'))
        this.cy.add(collapsedEdges.not(':visible'));
      }
    }

    const metaNodes = this.cy.nodes('.' + COLLAPSED_NODE_CLASS);
    // First, expand the collapsed if they don't have anything visible inside
    for (let i = 0; i < metaNodes.length; i++) {
      const collapsedChildren = metaNodes[i].data('collapsedChildren');
      if (collapsedChildren.filter(':visible').length < 1) {
        this.expandCollapseApi.expand(metaNodes[i], EXPAND_COLLAPSE_FAST_OPT);
      }
    }

    //if an expanded compound does not have anything visible, delete it
    const clusterNodes = this.cy.nodes('.' + CLUSTER_CLASS).not('.' + COLLAPSED_NODE_CLASS);
    for (let i = 0; i < clusterNodes.length; i++) {
      // if there are empty compounds, delete them
      const children = clusterNodes[i].children();
      if (children.filter(':visible').length < 1) {
        children.move({ parent: null });
        this.cy.remove(clusterNodes[i]);
      }
    }
  }

  getEnumMapping(): any {
    // changes value inside `this.appDescription.getValue().enumMapping` since it works on reference
    const mapping = this.appDescription.getValue().enumMapping;
    if (this._isSetEnums) {
      return mapping;
    }
    const enums = this.enums.getValue();
    for (const k in mapping) {
      for (const k2 in mapping[k]) {
        mapping[k][k2] = enums[mapping[k][k2]];
      }
    }
    this._isSetEnums = true;
    return mapping;
  }

  showErrorModal(title: string, msg: string) {
    if (this._isErrorModalUp) {
      return;
    }
    this._isErrorModalUp = true;
    const fn = () => {
      this._isErrorModalUp = false;
    };
    const instance = this._modalService.open(ErrorModalComponent);
    instance.result.then(fn, fn);
    instance.componentInstance.title = title;
    instance.componentInstance.msg = msg;
  }

  /** 
   * @param  {} fn should be a function that takes a cytoscape.js element and returns true or false
   */
  filterRemovedElems(fn) {
    const r = this.cy.collection();
    const collapsedNodes = this.cy.nodes('.' + COLLAPSED_NODE_CLASS);
    for (let i = 0; i < collapsedNodes.length; i++) {
      const ancestors = this.cy.collection();
      this.filterOnElem(collapsedNodes[i], fn, r, ancestors);
    }
    const collapsedEdges = this.cy.edges('.' + COLLAPSED_EDGE_CLASS);
    for (let i = 0; i < collapsedEdges.length; i++) {
      const ancestors = this.cy.collection();
      this.filterOnElem(collapsedEdges[i], fn, r, ancestors);
    }
    return r;
  }

  filterOnElem(elem, fn, r, ancestors) {
    const collapsedChildren = elem.data('collapsedChildren');
    const collapsedEdges = elem.data('collapsedEdges');
    let collapsed = this.cy.collection();
    if (collapsedChildren) {
      collapsed.merge(collapsedChildren);
    }
    if (collapsedEdges) {
      collapsed.merge(collapsedEdges);
    }
    if (!collapsedChildren && !collapsedEdges && fn(elem)) {
      r.merge(elem);
      r.merge(ancestors);
    }

    if (collapsed.length > 0) {
      ancestors = ancestors.union(elem);
    }
    for (let i = 0; i < collapsed.length; i++) {
      this.filterOnElem(collapsed[i], fn, r, ancestors);
    }
  }

  private performLayoutFn(isRandomize: boolean, isDirectCommand: boolean = false, animationDuration: number = LAYOUT_ANIM_DUR) {
    if (!this.userPrefs.isAutoIncrementalLayoutOnChange.getValue() && !isRandomize && !isDirectCommand) {
      this.cy.fit();
      return;
    }
    if (this.userPrefs.groupingOption.getValue() != GroupingOptionTypes.clusterId) {
      this.layout = this.getFcoseOptions();
    }
    this.layout.animationDuration = animationDuration;
    this.layout.tile = this.userPrefs.isTileDisconnectedOnLayout.getValue();
    this.switchLayoutRandomization(isRandomize);
    this.runLayout();
  }

  private getCiseOptions() {
    return {
      // -------- Mandatory parameters --------
      name: 'cise',

      // ClusterInfo can be a 2D array contaning node id's or a function that returns cluster ids.
      // For the 2D array option, the index of the array indicates the cluster ID for all elements in
      // the collection at that index. Unclustered nodes must NOT be present in this array of clusters.
      //
      // For the function, it would be given a Cytoscape node and it is expected to return a cluster id
      // corresponding to that node. Returning negative numbers, null or undefined is fine for unclustered
      // nodes.
      // e.g
      // Array:                                     OR          function(node){
      //  [ ['n1','n2','n3'],                                       ...
      //    ['n5','n6']                                         }
      //    ['n7', 'n8', 'n9', 'n10'] ]
      clusters: this.layout.clusters,
      randomize: this.layout.randomize,

      // -------- Optional parameters --------
      // Whether to animate the layout
      // - true : Animate while the layout is running
      // - false : Just show the end result
      // - 'end' : Animate directly to the end result
      animate: 'end',

      // number of ticks per frame; higher is faster but more jerky
      refresh: 10,

      // Animation duration used for animate:'end'
      animationDuration: LAYOUT_ANIM_DUR,

      // Easing for animate:'end'
      animationEasing: undefined,

      // Whether to fit the viewport to the repositioned graph
      // true : Fits at end of layout for animate:false or animate:'end'
      fit: true,

      // Padding in rendered co-ordinates around the layout
      padding: 30,

      // separation amount between nodes in a cluster
      // note: increasing this amount will also increase the simulation time
      nodeSeparation: 10,

      // Inter-cluster edge length factor
      // (2.0 means inter-cluster edges should be twice as long as intra-cluster edges)
      idealInterClusterEdgeLengthCoefficient: 1.4,

      // Whether to pull on-circle nodes inside of the circle
      allowNodesInsideCircle: true,

      // Max percentage of the nodes in a circle that can move inside the circle
      maxRatioOfNodesInsideCircle: 0.1,

      // - Lower values give looser springs
      // - Higher values give tighter springs
      springCoeff: 0.45,

      // Node repulsion (non overlapping) multiplier
      nodeRepulsion: 4500,

      // Gravity force (constant)
      gravity: 0.25,

      // Gravity range (constant)
      gravityRange: 3.8,

      packComponents: true,

      // Layout event callbacks; equivalent to `layout.one('layoutready', callback)` for example
      ready: function () { }, // on layoutready
      stop: function () { }, // on layoutstop
    };
  }

  private setUserPrefs(obj: any, userPref: any) {
    if (obj === undefined || obj === null) {
      return;
    }
    for (let k in obj) {
      let prop = obj[k];
      if (isPrimitiveType(prop)) {
        if (userPref[k]) {
          (userPref[k] as BehaviorSubject<any>).next(prop);
        } else {
          userPref[k] = new BehaviorSubject(prop);
        }
      } else {
        if (!userPref[k]) {
          if (prop instanceof Array) {
            userPref[k] = [];
          } else {
            userPref[k] = {};
          }
        }
        this.setUserPrefs(obj[k], userPref[k]);
      }
    }
  }

  // some styles uses functions, so they can't be added using JSON
  private addOtherStyles() {
    this.cy.startBatch();
    this.cy.style().selector('edge.' + COLLAPSED_EDGE_CLASS)
      .style({
        'label': (e) => {
          return '(' + e.data('collapsedEdges').length + ')';
        },
        'width': (e) => {
          let n = e.data('collapsedEdges').length;
          return (3 + Math.log2(n)) + 'px';
        },
        'line-color': this.setColor4CompoundEdge.bind(this),
        'target-arrow-color': this.setColor4CompoundEdge.bind(this),
        'target-arrow-shape': this.setTargetArrowShape.bind(this),
      }).update();
    this._cyCustomStyle.addCustomStyles(this.cy);

    // add override styles
    this.cy.style()
      .selector('node.ellipsis_label')
      .style({
        "label": "data(__label__)"
      })
      .selector('node.wrap_label')
      .style({
        "text-wrap": "wrap"
      })
      .selector('edge.nolabel')
      .style({
        "label": ""
      }).update();

    setTimeout(() => { this.cy.endBatch(); }, CY_BATCH_END_DELAY);
  }

  private addStyle4Emphasize() {
    const color = '#da14ff';
    const wid = this.userPrefs.highlightStyles[0].wid.getValue();
    const OPACITY_DIFF = 0.05;

    this.cy.style().selector('node.emphasize')
      .style({
        'overlay-color': color, 'overlay-opacity': HIGHLIGHT_OPACITY + OPACITY_DIFF, 'overlay-padding': wid
      }).update();

    this.cy.style().selector('edge.emphasize')
      .style({
        'overlay-color': color, 'overlay-opacity': HIGHLIGHT_OPACITY + OPACITY_DIFF, 'overlay-padding': (e) => {
          return (wid + e.width()) / 2 + 'px';
        }
      }).update();
  }

  private setColor4CompoundEdge(e) {
    let collapsedEdges = e.data('collapsedEdges');
    if (this.doElemsMultiClasses(collapsedEdges)) {
      return '#b3b3b3';
    }
    return collapsedEdges[0].style('line-color')
  }

  private setTargetArrowShape(e) {
    let collapsedEdges = e.data('collapsedEdges');
    if (this.doElemsMultiClasses(collapsedEdges)) {
      return 'triangle';
    }
    return collapsedEdges[0].style('target-arrow-shape')
  }

  private doElemsMultiClasses(elems) {
    let classDict = {};
    for (let i = 0; i < elems.length; i++) {
      let classes = elems[i].classes();
      for (let j = 0; j < classes.length; j++) {
        classDict[classes[j]] = true;
      }
    }
    return Object.keys(classDict).length > 1;
  }
}
