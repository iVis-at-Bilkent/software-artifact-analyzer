import { Component, OnInit } from '@angular/core';
import { CytoscapeService } from '../../cytoscape.service';
import { TimebarService } from '../../timebar.service';
import { GlobalVariableService } from '../../global-variable.service';
import { MIN_HIGHTLIGHT_WIDTH, MAX_HIGHTLIGHT_WIDTH } from '../../constants';
import stylesheet from '../../../assets/generated/stylesheet.json';

@Component({
  selector: 'app-settings-tab',
  templateUrl: './settings-tab.component.html',
  styleUrls: ['./settings-tab.component.css']
})
export class SettingsTabComponent implements OnInit {
  settings: any[];
  highlightWidth: number;
  timebarPlayingStep: number;
  timebarPlayingSpeed: number;
  timebarZoomingStep: number;
  compoundPadding: string;
  timebarInclusionTypes: string[];

  constructor(private _cyService: CytoscapeService, private _timebarService: TimebarService, private _g: GlobalVariableService) {
  }

  ngOnInit() {
    this.settings = [{
      text: 'Highlight on hover', isEnable: false
    },
    {
      text: 'Show overview window', isEnable: true
    },
    {
      text: 'Show edge labels', isEnable: true
    },
    {
      text: 'Show timebar', isEnable: true
    },
    {
      text: 'Hide disconnected nodes on time filtering', isEnable: false
    },
    {
      text: 'Ignore case in text operations', isEnable: false
    },
    ];

    this.highlightWidth = 4.5;
    this.timebarPlayingStep = 50;
    this.timebarZoomingStep = 50;
    this.timebarPlayingSpeed = -1350;
    this.compoundPadding = '5%';
    this.timebarInclusionTypes = ['Contained by', 'Overlaps', 'Contains'];
  }

  onBoolSettingsChanged(idx: number) {
    const isEnable = this.settings[idx].isEnable;
    if (idx === 0) {
      this._cyService.highlighterCheckBoxClicked(isEnable)
    } else if (idx == 1) {
      this._cyService.navigatorCheckBoxClicked(isEnable);
    } else if (idx == 2) {
      this._cyService.showHideEdgeLabelCheckBoxClicked(isEnable);
    } else if (idx == 3) {
      this._cyService.showHideTimebar(isEnable);
    } else if (idx == 4) {
      this._timebarService.setisHideDisconnectedNodes(isEnable);
      this._timebarService.rangeChange(false);
    } else if (idx == 5) {
      this._g.isIgnoreCaseInText = isEnable;
    }
  }

  changeHighlightOptions() {
    if (this.highlightWidth < MIN_HIGHTLIGHT_WIDTH) {
      this.highlightWidth = MIN_HIGHTLIGHT_WIDTH;
    }
    if (this.highlightWidth > MAX_HIGHTLIGHT_WIDTH) {
      this.highlightWidth = MAX_HIGHTLIGHT_WIDTH;
    }
    this._cyService.changeHighlightOptions(this.highlightWidth);
  }

  setTimebarPlayingSpeed() {
    this._timebarService.changeSpeed(this.timebarPlayingSpeed);
  }

  setTimebarZoomStep() {
    this._timebarService.changeZoomStep(this.timebarZoomingStep);
  }

  changeCompoundPadding() {
    stylesheet.find(x => x.selector == ':compound').style.padding = this.compoundPadding;
    this._g.setStyleFromJson(stylesheet);
  }

  inclusionTypeChanged(i: number) {
    this._timebarService.changeInclusionType(i);
    this._timebarService.renderChart();
    this._timebarService.rangeChange(false, true);
  }

}