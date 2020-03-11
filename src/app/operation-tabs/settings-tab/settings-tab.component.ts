import { Component, OnInit } from '@angular/core';
import { GlobalVariableService } from '../../global-variable.service';
import { TimebarGraphInclusionTypes, TimebarStatsInclusionTypes, MergedElemIndicatorTypes, BoolSetting } from 'src/app/user-preference';

@Component({
  selector: 'app-settings-tab',
  templateUrl: './settings-tab.component.html',
  styleUrls: ['./settings-tab.component.css']
})
export class SettingsTabComponent implements OnInit {
  generalBoolSettings: BoolSetting[];
  timebarBoolSettings: BoolSetting[];
  highlightWidth: number;
  highlightColor: string;
  timebarPlayingStep: number;
  timebarPlayingPeriod: number;
  timebarZoomingStep: number;
  compoundPadding: string;
  dataPageSize: number;
  queryHistoryLimit: number;
  tableColumnLimit: number;
  timebarGraphInclusionTypes: string[] = ['overlaps', 'contains', 'contained by'];
  timebarStatsInclusionTypes: string[] = ['all', 'begin', 'middle', 'end'];
  mergedElemIndicators: string[] = ['Selection', 'Highlight'];
  // multiple choice settings
  graphInclusionType: TimebarGraphInclusionTypes;
  statsInclusionType: TimebarStatsInclusionTypes;
  mergedElemIndicator: MergedElemIndicatorTypes;
  isInit: boolean = false;
  currHighlightStyles: string[] = [];
  highlightStyleIdx = 0;

  constructor(private _g: GlobalVariableService) {
  }

  ngOnInit() {
    this.generalBoolSettings = [
      {
        text: 'Perform layout on changes', isEnable: false, path2userPref: 'isAutoIncrementalLayoutOnChange'
      },
      {
        text: 'Highlight on hover', isEnable: false, path2userPref: 'isHighlightOnHover'
      },
      {
        text: 'Show overview window', isEnable: false, path2userPref: 'isShowOverviewWindow'
      },
      {
        text: 'Show edge labels', isEnable: false, path2userPref: 'isShowEdgeLabels'
      },
      {
        text: 'Fit labels to nodes', isEnable: false, path2userPref: 'isFitLabels2Nodes'
      },
      {
        text: 'Ignore case in text operations', isEnable: false, path2userPref: 'isIgnoreCaseInText'
      }
    ];

    this.timebarBoolSettings = [
      { text: 'Show timebar', isEnable: false, path2userPref: 'timebar.isEnabled' },
      { text: 'Hide disconnected nodes on animation', isEnable: false, path2userPref: 'timebar.isHideDisconnectedNodesOnAnim' },
      { text: 'Maintain graph range on topology changes', isEnable: false, path2userPref: 'timebar.isMaintainGraphRange' }
    ];

    this.subscribe2UserPrefs();
    this.isInit = true;

    this.setHighlightStyles();
    this.highlightStyleSelected(this._g.currHighlightIdx);
  }

  private subscribe2UserPrefs() {
    // reference variables for shorter text
    const up = this._g.userPrefs;
    const up_t = this._g.userPrefs.timebar;

    up.isAutoIncrementalLayoutOnChange.subscribe(x => { this.generalBoolSettings[0].isEnable = x });
    up.isHighlightOnHover.subscribe(x => { this.generalBoolSettings[1].isEnable = x });
    up.isShowOverviewWindow.subscribe(x => { this.generalBoolSettings[2].isEnable = x });
    up.isShowEdgeLabels.subscribe(x => { this.generalBoolSettings[3].isEnable = x });
    up.isFitLabels2Nodes.subscribe(x => { this.generalBoolSettings[4].isEnable = x });
    up.isIgnoreCaseInText.subscribe(x => { this.generalBoolSettings[5].isEnable = x });
    up.mergedElemIndicator.subscribe(x => this.mergedElemIndicator = x);
    up.dataPageSize.subscribe(x => { this.dataPageSize = x });
    up.queryHistoryLimit.subscribe(x => { this.queryHistoryLimit = x });
    up.tableColumnLimit.subscribe(x => { this.tableColumnLimit = x });
    up.highlightWidth.subscribe(x => { this.highlightWidth = x });
    up.highlightColor.subscribe(x => { this.highlightColor = x });
    up.compoundPadding.subscribe(x => { this.compoundPadding = x });

    up_t.isEnabled.subscribe(x => { this.timebarBoolSettings[0].isEnable = x; });
    up_t.isHideDisconnectedNodesOnAnim.subscribe(x => { this.timebarBoolSettings[1].isEnable = x });
    up_t.isMaintainGraphRange.subscribe(x => { this.timebarBoolSettings[2].isEnable = x });
    up_t.playingStep.subscribe(x => { this.timebarPlayingStep = x });
    up_t.playingPeriod.subscribe(x => { this.timebarPlayingPeriod = x });
    up_t.zoomingStep.subscribe(x => { this.timebarZoomingStep = x });
    up_t.graphInclusionType.subscribe(x => { this.graphInclusionType = x });
    up_t.statsInclusionType.subscribe(x => { this.statsInclusionType = x });
  }

  private setHighlightStyles() {
    this.currHighlightStyles = [];
    let styleCount = this._g.viewUtils.getHighlightStyles().length;
    for (let i = 0; i < styleCount; i++) {
      this.currHighlightStyles.push('Style ' + (i + 1));
    }
  }

  settingChanged(val: any, userPref: string) {
    let path = userPref.split('.');
    let obj = this._g.userPrefs[path[0]];
    for (let i = 1; i < path.length; i++) {
      obj = obj[path[i]];
    }
    obj.next(val);
  }

  onColorSelected(c: string) {
    this._g.userPrefs.highlightColor.next(c);
  }

  // used to change border width or color. One of them should be defined. (exclusively)
  changeHighlightStyle() {
    let nodeCss = { 'border-color': this.highlightColor, 'border-width': this.highlightWidth };
    let edgeCss = { 'line-color': this.highlightColor, 'target-arrow-color': this.highlightColor, 'width': this.highlightWidth };
    this._g.viewUtils.changeHighlightStyle(this.highlightStyleIdx, nodeCss, edgeCss);
    this.setHighlightStyles();
  }

  addHighlightStyle() {
    let nodeCss = { 'border-color': this.highlightColor, 'border-width': this.highlightWidth };
    let edgeCss = { 'line-color': this.highlightColor, 'target-arrow-color': this.highlightColor, 'width': this.highlightWidth };
    this._g.viewUtils.addHighlightStyle(nodeCss, edgeCss);
    this.setHighlightStyles();
    this.highlightStyleIdx = this.currHighlightStyles.length - 1;
    this.highlightStyleSelected(this.highlightStyleIdx);
  }

  highlightStyleSelected(i: number) {
    this.highlightStyleIdx = i;
    this._g.currHighlightIdx = i;
    let style = this._g.viewUtils.getHighlightStyles()[i];
    this.highlightColor = style.node['border-color'];
    this.highlightWidth = style.node['border-width'];
  }
}