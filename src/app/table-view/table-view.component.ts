import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { GlobalVariableService } from '../global-variable.service';
import { CytoscapeService } from '../cytoscape.service';
import { EV_MOUSE_ON, EV_MOUSE_OFF, debounce } from '../constants';
import { TableViewInput, TableFiltering } from './table-view-types';
import { IPosition } from 'angular2-draggable';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-table-view',
  templateUrl: './table-view.component.html',
  styleUrls: ['./table-view.component.css']
})
export class TableViewComponent implements OnInit {
  private highlighterFn: (ev: { target: any, type: string, cySelector?: string }) => void;
  // column index is also a column
  columnLimit: number;
  isDraggable: boolean = false;
  position: IPosition = { x: 0, y: 0 };
  filterTxt: string = '';
  sortDirection: 'asc' | 'desc' | '' = '';
  sortingIdx: number = -1;
  isLoading: boolean = false;
  isInitialized: boolean = false;
  origSize: { wid: number, hei: number } = { wid: 1, hei: 1 };
  filterTxtChanged: () => void;
  @ViewChild('searchTxt', { static: false }) inpElem;
  @ViewChild('dynamicDiv', { static: false }) dynamicDiv;
  checkedIdx: any = {};

  @Input() params: TableViewInput;
  @Input() tableFilled = new Subject<boolean>();
  @Output() onFilteringChanged = new EventEmitter<TableFiltering>();
  @Output() onDataForQueryResult = new EventEmitter<number[] | string[]>();

  constructor(private _cyService: CytoscapeService, private _g: GlobalVariableService) { }

  ngOnInit() {
    this.tableFilled.subscribe(this.onTableFilled.bind(this));
    this._g.userPrefs.tableColumnLimit.subscribe(x => { this.columnLimit = x; if (this.params.columnLimit) { this.columnLimit = this.params.columnLimit; } });
    this.highlighterFn = this._cyService.highlightNeighbors();
    this.position.x = 0;
    this.position.y = 0;
    this.filterTxtChanged = debounce(this.filterBy.bind(this), 1000, false);
  }

  private onTableFilled() {
    this.isLoading = false;
    this.isInitialized = true;
    this.checkedIdx = {};
    if (this.inpElem && this.params.results && this.params.results.length > 0) {
      setTimeout(() => { this.inpElem.nativeElement.focus(); }, 0);
    }
  }

  filterBy() {
    this.isLoading = true;
    this.onFilteringChanged.emit({ txt: this.filterTxt, orderBy: this.params.columns[this.sortingIdx], orderDirection: this.sortDirection });
  }

  onMouseEnter(id: string) {
    if (this.params.isUseCySelector4Highlight) {
      this.highlighterFn({ target: null, type: EV_MOUSE_ON, cySelector: id });
    } else {
      let target = this._g.cy.$('#n' + id);
      if (!this.params.isNodeData) {
        target = this._g.cy.$('#e' + id);
      }
      this.highlighterFn({ target: target, type: EV_MOUSE_ON });
    }
  }

  onMouseExit(id: string) {
    if (this.params.isUseCySelector4Highlight) {
      this.highlighterFn({ target: null, type: EV_MOUSE_OFF, cySelector: id });
    } else {
      let target = this._g.cy.$('#n' + id);
      if (!this.params.isNodeData) {
        target = this._g.cy.$('#e' + id);
      }
      this.highlighterFn({ target: target, type: EV_MOUSE_OFF });
    }
  }

  pageChanged(newPage: number) {
    let o = this.params.columns[this.sortingIdx];
    let skip = (newPage - 1) * this.params.pageSize;
    this.onFilteringChanged.emit({ txt: this.filterTxt, orderBy: o, orderDirection: this.sortDirection, skip: skip });
  }

  isNumber(v: any) {
    return typeof v === 'number';
  }

  resetPosition(isDraggable: boolean) {
    this.isDraggable = isDraggable;
    if (this.isDraggable) {
      this.position = { x: -130, y: 0 };
    } else {
      this.position = { x: 0, y: 0 };
    }
  }

  columnClicked(i: number) {
    this.isLoading = true;
    this.sortingIdx = i;
    let o = this.params.columns[i];
    if (this.sortDirection == 'asc') {
      this.sortDirection = 'desc';
    } else if (this.sortDirection == 'desc') {
      this.sortDirection = '';
    } else if (this.sortDirection == '') {
      this.sortDirection = 'asc';
    }
    this.onFilteringChanged.emit({ txt: this.filterTxt, orderBy: o, orderDirection: this.sortDirection });
  }

  cbChanged(idx: number, isChecked: boolean) {
    delete this.checkedIdx[idx];

    if (isChecked) {
      this.checkedIdx[idx] = true;
    }
  }

  loadGraph4Checked() {
    let ids = this.params.results.filter((_, i) => this.checkedIdx[i]).map(x => x[0].val) as number[];
    if (ids.length > 0) {
      this.onDataForQueryResult.emit(ids);
    }
  }

  cb4AllChanged(isChecked: boolean) {
    this.checkedIdx = {};
    let elems = document.getElementsByClassName('row-cb');
    let elemsArr: HTMLInputElement[] = [];
    for (let i = 0; i < elems.length; i++) {
      elemsArr.push(elems[i] as HTMLInputElement);
    }
    elemsArr = elemsArr.filter(x => !x.parentElement.hidden);

    if (isChecked) {
      for (let i = 0; i < this.params.results.length; i++) {
        this.checkedIdx[i] = true;
        elemsArr[i].checked = true;
      }
    } else {
      for (let i = 0; i < elemsArr.length; i++) {
        elemsArr[i].checked = false;
      }
    }
  }

  tableStateChanged() {
    this.isDraggable = !this.isDraggable;
    this.resetPosition(this.isDraggable);
    if (!this.isDraggable) {
      let e = this.dynamicDiv.nativeElement;
      e.style.width = '';
      e.style.height = '';
    }
    if (this.origSize.wid == 1) {
      // get height and width when it is draggable
      setTimeout(() => {
        this.origSize.hei = this.dynamicDiv.nativeElement.clientHeight;
        this.origSize.wid = this.dynamicDiv.nativeElement.clientWidth;
      }, 0);
    }
  }

  onResizeStart(e) {
    let bb0 = e.host.children[0].getBoundingClientRect();
    let bb1 = e.host.children[1].getBoundingClientRect();
    this.origSize.hei = bb0.height + bb1.height;
  }
}
