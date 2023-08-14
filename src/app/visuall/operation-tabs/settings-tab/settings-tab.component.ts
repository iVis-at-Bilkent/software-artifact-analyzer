import { Component, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { GlobalVariableService } from '../../global-variable.service';
import { TimebarGraphInclusionTypes, TimebarStatsInclusionTypes, MergedElemIndicatorTypes, BoolSetting, GroupingOptionTypes } from '../../user-preference';
import { UserProfileService } from '../../user-profile.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { MIN_HIGHTLIGHT_WIDTH, MAX_HIGHTLIGHT_WIDTH, getCyStyleFromColorAndWid } from '../../constants';
import { CustomizationModule } from 'src/app/custom/customization.module';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { Neo4jDb } from 'src/app/visuall/db-service/neo4j-db.service';
@Component({
  selector: 'app-settings-tab',
  templateUrl: './settings-tab.component.html',
  styleUrls: ['./settings-tab.component.css']
})
export class SettingsTabComponent implements OnInit, OnDestroy {
  generalBoolSettings: BoolSetting[];
  timebarBoolSettings: BoolSetting[];
  anomalyBoolSetting: BoolSetting[];
  highlightWidth: number;
  highlightColor: string;
  timebarPlayingStep: number;
  timebarPlayingPeriod: number;
  timebarZoomingStep: number;
  compoundPadding: string;
  @ViewChild('dbQueryDate1', { static: false }) dbQueryDate1: ElementRef;
  @ViewChild('dbQueryDate2', { static: false }) dbQueryDate2: ElementRef;
  dataPageSize: number;
  dataPageLimit: number;
  queryHistoryLimit: number;
  dbTimeout: number;
  tableColumnLimit: number;
  edgeCollapseLimit: number;
  timebarGraphInclusionTypes: string[] = ['overlaps', 'contains', 'contained by'];
  timebarStatsInclusionTypes: string[] = ['all', 'begin', 'middle', 'end'];
  mergedElemIndicators: string[] = ['None', 'Selection', 'Highlight'];
  groupingOptions: string[] = ['Compounds', 'Circles'];
  nodeLabelWrapTypes: string[] = ['None', 'Wrap', 'Ellipsis'];
  // multiple choice settings
  graphInclusionType: TimebarGraphInclusionTypes;
  queryResultPagination: 'Client' | 'Server';
  statsInclusionType: TimebarStatsInclusionTypes;
  mergedElemIndicator: MergedElemIndicatorTypes;
  groupingOption: GroupingOptionTypes;
  nodeLabelWrap: number = 0;
  isInit: boolean = false;
  currHighlightStyles: string[] = [];
  highlightStyleIdx = 0;
  isStoreUserProfile = true;
  selectionColor = "#6c757d";
  selectionWidth = 4.5;
  customSubTabs: { component: any, text: string }[] = CustomizationModule.settingsSubTabs;
  loadFromFileSubs: Subscription;
  tabChangeSubs: Subscription;
  anomalyDefaultValues: {
    ignoreBug: number,
    assigneeChangeCount: number,
    reopenCount: number,
  }
  constructor(private _g: GlobalVariableService, private _profile: UserProfileService, public _dbService: Neo4jDb) {
    this.anomalyDefaultValues = {
      ignoreBug: this._g.userPrefs?.anomalyDefaultValues?.ignoreBug.getValue() || 1,
      assigneeChangeCount: this._g.userPrefs?.anomalyDefaultValues?.assigneeChangeCount.getValue() || 1,
      reopenCount: this._g.userPrefs?.anomalyDefaultValues?.reopenCount.getValue() || 1,
    }
    this.loadFromFileSubs = this._profile.onLoadFromFile.subscribe(x => {
      if (!x) {
        return;
      }
      this._profile.transferUserPrefs();
      this.setViewUtilsStyle();
      this.fillUIFromMemory();
    });
  }

  ngOnInit() {
    this.anomalyDefaultValues = {
      ignoreBug: this._g.userPrefs?.anomalyDefaultValues?.ignoreBug.getValue() || 1,
      assigneeChangeCount: this._g.userPrefs?.anomalyDefaultValues?.assigneeChangeCount.getValue() || 1,
      reopenCount: this._g.userPrefs?.anomalyDefaultValues?.reopenCount.getValue() || 1,
    }
    //this.anomalyDefaultValues.ignoreBug = this._g.userPrefs.anomalyDefaultValues.ignoreBug.getValue();

    this.generalBoolSettings = [
      { text: 'Perform layout on changes', isEnable: false, path2userPref: 'isAutoIncrementalLayoutOnChange' },
      { text: 'Emphasize on hover', isEnable: false, path2userPref: 'isHighlightOnHover' },
      { text: 'Show overview window', isEnable: false, path2userPref: 'isShowOverviewWindow' },
      { text: 'Show edge labels', isEnable: false, path2userPref: 'isShowEdgeLabels' },
      { text: 'Ignore case in text operations', isEnable: false, path2userPref: 'isIgnoreCaseInText' },
      { text: 'Show results of latest query only', isEnable: false, path2userPref: 'isOnlyHighlight4LatestQuery' },
      { text: 'Collapse multiple edges based on type', isEnable: false, path2userPref: 'isCollapseEdgesBasedOnType' },
      { text: 'Collapse multiple edges on load', isEnable: false, path2userPref: 'isCollapseMultiEdgesOnLoad' },
      { text: 'Tile disconnected nodes on layout', isEnable: true, path2userPref: 'isTileDisconnectedOnLayout' },
    ];

    this.timebarBoolSettings = [
      { text: 'Show timebar', isEnable: false, path2userPref: 'timebar.isEnabled' },
      { text: 'Hide disconnected nodes on animation', isEnable: false, path2userPref: 'timebar.isHideDisconnectedNodesOnAnim' },
      { text: 'Maintain graph range on topology changes', isEnable: false, path2userPref: 'timebar.isMaintainGraphRange' }
    ];

    this.isInit = true;

    this.tabChangeSubs = this._g.operationTabChanged.subscribe(x => {
      if (x == 3) { // check if my tab is opened
        this.fillUIFromMemory();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.loadFromFileSubs) {
      this.loadFromFileSubs.unsubscribe();
    }
    if (this.tabChangeSubs) {
      this.tabChangeSubs.unsubscribe();
    }
  }

  private fillUIFromMemory() {
    this.anomalyDefaultValues = {
      ignoreBug: this._g.userPrefs?.anomalyDefaultValues?.ignoreBug.getValue() || 1,
      assigneeChangeCount: this._g.userPrefs?.anomalyDefaultValues?.assigneeChangeCount.getValue() || 1,
      reopenCount: this._g.userPrefs?.anomalyDefaultValues?.reopenCount.getValue() || 1,
    }
    // reference variables for shorter text
    const up = this._g.userPrefs;
    const up_t = this._g.userPrefs.timebar;

    this.generalBoolSettings[0].isEnable = up.isAutoIncrementalLayoutOnChange.getValue();
    this.generalBoolSettings[1].isEnable = up.isHighlightOnHover.getValue();
    this.generalBoolSettings[2].isEnable = up.isShowOverviewWindow.getValue();
    this.generalBoolSettings[3].isEnable = up.isShowEdgeLabels.getValue();
    this.generalBoolSettings[4].isEnable = up.isIgnoreCaseInText.getValue();
    this.generalBoolSettings[5].isEnable = up.isOnlyHighlight4LatestQuery.getValue();
    this.generalBoolSettings[6].isEnable = up.isCollapseEdgesBasedOnType.getValue();
    this.generalBoolSettings[7].isEnable = up.isCollapseMultiEdgesOnLoad.getValue();
    this.generalBoolSettings[8].isEnable = up.isTileDisconnectedOnLayout.getValue();

    this.nodeLabelWrap = up.nodeLabelWrap.getValue();
    this.mergedElemIndicator = up.mergedElemIndicator.getValue();
    this.groupingOption = up.groupingOption.getValue();
    this.dataPageSize = up.dataPageSize.getValue();
    this.dataPageLimit = up.dataPageLimit.getValue();
    this.queryHistoryLimit = up.queryHistoryLimit.getValue();
    this.dbTimeout = up.dbTimeout.getValue();
    this.tableColumnLimit = up.tableColumnLimit.getValue();
    this.edgeCollapseLimit = up.edgeCollapseLimit.getValue();
    this.currHighlightStyles = up.highlightStyles.map((_, i) => 'Style ' + (i + 1));
    this.highlightStyleIdx = up.currHighlightIdx.getValue();
    this.highlightColor = up.highlightStyles[this._g.userPrefs.currHighlightIdx.getValue()].color.getValue();
    this.highlightWidth = up.highlightStyles[this._g.userPrefs.currHighlightIdx.getValue()].wid.getValue();
    this.selectionColor = up.selectionColor.getValue();
    this.selectionWidth = up.selectionWidth.getValue();
    this._g.cy.style().selector('core').style({ 'selection-box-color': this.selectionColor });
    this.compoundPadding = up.compoundPadding.getValue();
    this.isStoreUserProfile = up.isStoreUserProfile.getValue();
    this.graphInclusionType = up.objectInclusionType.getValue();
    this.queryResultPagination = up.queryResultPagination.getValue();

    this.timebarBoolSettings[0].isEnable = up_t.isEnabled.getValue();
    this.timebarBoolSettings[1].isEnable = up_t.isHideDisconnectedNodesOnAnim.getValue();
    this.timebarBoolSettings[2].isEnable = up_t.isMaintainGraphRange.getValue();
    this.timebarPlayingStep = up_t.playingStep.getValue();
    this.timebarPlayingPeriod = up_t.playingPeriod.getValue();
    this.timebarZoomingStep = up_t.zoomingStep.getValue();
    this.statsInclusionType = up_t.statsInclusionType.getValue();

    this.setHighlightStyles();
    this.highlightStyleSelected(this._g.userPrefs.currHighlightIdx.getValue());
  }

  private setHighlightStyles() {
    if (!this._g.viewUtils) {
      return;
    }
    this.currHighlightStyles = [];
    let styles = this._g.viewUtils.getHighlightStyles();
    for (let i = 0; i < styles.length; i++) {
      this.currHighlightStyles.push('Style ' + (i + 1));
      let c = styles[i].node['overlay-color'];
      let w = styles[i].node['overlay-padding'];
      if (this._g.userPrefs.highlightStyles[i]) {
        this._g.userPrefs.highlightStyles[i].color.next(c);
        this._g.userPrefs.highlightStyles[i].wid.next(w);
      } else {
        this._g.userPrefs.highlightStyles[i] = { wid: new BehaviorSubject<number>(w), color: new BehaviorSubject<string>(c) };
      }
    }
    this._g.userPrefs.highlightStyles.splice(styles.length);
    this._profile.saveUserPrefs();
  }

  // set view utils extension highlight styles from memory (_g.userPrefs)
  private setViewUtilsStyle() {
    const styles = this._g.userPrefs.highlightStyles;
    let vuStyles = this._g.viewUtils.getHighlightStyles();
    for (let i = 0; i < vuStyles.length; i++) {
      let cyStyle = getCyStyleFromColorAndWid(styles[i].color.getValue(), styles[i].wid.getValue());
      this._g.viewUtils.changeHighlightStyle(i, cyStyle.node, cyStyle.edge);
    }
    for (let i = vuStyles.length; i < styles.length; i++) {
      let cyStyle = getCyStyleFromColorAndWid(styles[i].color.getValue(), this.highlightWidth);
      this._g.viewUtils.addHighlightStyle(cyStyle.node, cyStyle.edge);
    }
  }
  settingAnomalyChanged(val: any, userPref: string) {
    let path = userPref.split('.');
    let obj = this._g.userPrefs[path[0]];
    for (let i = 1; i < path.length; i++) {
      obj = obj[path[i]];
    }
    obj.next(val);
    this._profile.saveUserPrefs();
    const cb = (x) => {
    }
    let cql = "";
    if (userPref == "anomalyDefaultValues.ignoreBug") {
      cql = `MATCH (n:Issue)
                  SET n.anomalyCount = CASE
                      WHEN 'Ignored bug' IN n.anomalyList THEN n.anomalyCount - 1
                      ELSE n.anomalyCount
                  END,
                  n.anomalyList = [x IN n.anomalyList WHERE x <> 'Ignored bug']
                  WITH n
                  WHERE exists(n.history) AND size(n.history) >= 2
                  WITH n, range(0, size(n.history)-2) as index_range
                  UNWIND index_range as i
                  WITH n, i, datetime(n.history[i]) as from, datetime(n.history[i+1]) as to
                  WHERE duration.between(from, to).months > ${val}
                  WITH DISTINCT n
                  SET n.anomalyList = coalesce(n.anomalyList, []) + ['Ignored bug'], n.anomalyCount = coalesce(n.anomalyCount, 0) + 1
                  RETURN n.name as name , ID(n) as id order by n.name`;
    }
    else if (userPref == "anomalyDefaultValues.assigneeChangeCount") {
      cql = ` MATCH (n:Issue)
              SET n.anomalyCount = CASE
              WHEN 'Reassignment of Bug Assignee' IN n.anomalyList THEN n.anomalyCount - 1
              ELSE n.anomalyCount
              END,
              n.anomalyList = [x IN n.anomalyList WHERE x <> 'Reassignment of Bug Assignee']
              WITH n WHERE n.assigneeChangeCount>=${val}
              SET n.anomalyList = coalesce(n.anomalyList, []) + [ 'Reassignment of Bug Assignee'] , n.anomalyCount = coalesce(n.anomalyCount, 0) + 1
              RETURN n.name as name , ID(n) as id order by n.name`;
    }
    else if (userPref == "anomalyDefaultValues.reopenCount") {
      cql = `MATCH (n:Issue)
              SET n.anomalyCount = CASE
              WHEN 'Closed reopen ping pong' IN n.anomalyList THEN n.anomalyCount - 1
              ELSE n.anomalyCount
              END,
              n.anomalyList = [x IN n.anomalyList WHERE x <> 'Closed reopen ping pong']
              WITH n 
              WHERE n.reopenCount>=${val}
              SET n.anomalyList = coalesce(n.anomalyList, []) + ['Closed reopen ping pong'] , n.anomalyCount = coalesce(n.anomalyCount, 0) + 1
              RETURN n.name as name , ID(n) as id order by n.name`;
    }

    this._dbService.runQueryWithoutTimeBoxed(cql, cb, DbResponseType.table);

  }
  
  settingChanged(val: any, userPref: string) {
    let path = userPref.split('.');
    let obj = this._g.userPrefs[path[0]];
    for (let i = 1; i < path.length; i++) {
      obj = obj[path[i]];
    }
    obj.next(val);
    this._profile.saveUserPrefs();
  }
  onColorSelected(c: string) {
    this.highlightColor = c;
  }

  onSelColorSelected(c: string) {
    this._g.userPrefs.selectionColor.next(c);
    this.selectionColor = c;
    this._g.cy.style().selector('core').style({ 'selection-box-color': this.selectionColor });
    this._g.cy.style().selector(':selected').style({ 'overlay-color': this.selectionColor }).update();
    this._profile.saveUserPrefs();
  }

  onSelWidSelected(w) {
    let width = parseFloat(w.target.value);
    if (Number(width)) {
      if (width < 0)
        width = 1;
      else if (width > 20)
        width = 20;
      this._g.userPrefs.selectionWidth.next(width);
      this.selectionWidth = width;
      this._g.cy.style().selector(':selected').style({ 'overlay-padding': width })
        .selector('edge:selected')
        .style({
          'overlay-padding': (e) => {
            return (width + e.width()) / 2 + 'px';
          },
        }).update();
      this._profile.saveUserPrefs();
    }
    else {
      this._g.userPrefs.selectionWidth.next(1);
      this.selectionWidth = this._g.userPrefs.selectionWidth.getValue();
      w.target.valueAsNumber = this.selectionWidth;
    }
  }

  // used to change border width or color. One of them should be defined. (exclusively)
  changeHighlightStyle() {
    this.bandPassHighlightWidth();
    let cyStyle = getCyStyleFromColorAndWid(this.highlightColor, this.highlightWidth);
    this._g.viewUtils.changeHighlightStyle(this.highlightStyleIdx, cyStyle.node, cyStyle.edge);
    this.setHighlightStyles();
    this._g.updateSelectionCyStyle();
  }

  deleteHighlightStyle() {
    if (this._g.viewUtils.getAllHighlightClasses().length < 2) {
      return;
    }
    this._g.viewUtils.removeHighlightStyle(this.highlightStyleIdx);
    this.setHighlightStyles();
    let styleCnt = this._g.viewUtils.getAllHighlightClasses().length - 1;
    if (this.highlightStyleIdx > styleCnt) {
      this.highlightStyleIdx = styleCnt;
    }
    this.highlightStyleSelected(this.highlightStyleIdx);
  }
  addHighlightStyle() {
    this.bandPassHighlightWidth();
    let cyStyle = getCyStyleFromColorAndWid(this.highlightColor, this.highlightWidth);
    this._g.viewUtils.addHighlightStyle(cyStyle.node, cyStyle.edge);
    this.setHighlightStyles();
    this.highlightStyleIdx = this.currHighlightStyles.length - 1;
    this.highlightStyleSelected(this.highlightStyleIdx);
    this._g.updateSelectionCyStyle();
  }


  highlightStyleSelected(t: EventTarget | number) {
    let i = 0;
    if (typeof t == 'number') {
      i = t;
    } else {
      i = (<HTMLSelectElement>t).selectedIndex;
    }
    this.highlightStyleIdx = i;
    this._g.userPrefs.currHighlightIdx.next(i);
    let style = this._g.viewUtils.getHighlightStyles()[i];
    this.highlightColor = style.node['overlay-color'];
    this.highlightWidth = style.node['overlay-padding'];
    this._profile.saveUserPrefs();
  }

  bandPassHighlightWidth() {
    if (this.highlightWidth < MIN_HIGHTLIGHT_WIDTH) {
      this.highlightWidth = MIN_HIGHTLIGHT_WIDTH;
    }
    if (this.highlightWidth > MAX_HIGHTLIGHT_WIDTH) {
      this.highlightWidth = MAX_HIGHTLIGHT_WIDTH;
    }
  }

  resetGeneralSettings() {
    this.transferSubjectValues(this._g.userPrefsFromFiles, this._g.userPrefs, 'timebar');
    this.setViewUtilsStyle();
    this.fillUIFromMemory();
    this._g.updateSelectionCyStyle();
  }

  resetTimebarSettings() {
    this.transferSubjectValues(this._g.userPrefsFromFiles.timebar, this._g.userPrefs.timebar);
    this.fillUIFromMemory();
  }

  private transferSubjectValues(from, to, skip = null) {
    for (const k in from) {
      if (skip && k == skip) {
        continue;
      }
      let p1 = from[k];
      let p2 = to[k];
      if (p1 instanceof BehaviorSubject) {
        (p2 as BehaviorSubject<any>).next((p1 as BehaviorSubject<any>).getValue());
      } else {
        this.transferSubjectValues(p1, p2);
      }
    }
  }
}
