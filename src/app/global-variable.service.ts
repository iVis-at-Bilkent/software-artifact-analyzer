import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalVariableService {
  cy: any;
  viewUtils: any;
  layout: any;
  expandCollapseApi: any;
  hiddenClasses: Set<string>;
  isIgnoreCaseInText: boolean;
  isTimebarEnabled: boolean;

  constructor() {
    this.isIgnoreCaseInText = false;
    this.isTimebarEnabled = true;
    this.hiddenClasses = new Set([]);
  }

  runLayout() {
    this.cy.layout(this.layout).run();
  }

  performLayout(isRandomize: boolean) {
    this.switchLayoutRandomization(isRandomize);
    this.runLayout();
  }

  switchLayoutRandomization(isRandomize: boolean) {
    this.layout.randomize = isRandomize;
    if (!this.layout.randomize) {
      this.layout.quality = 'proof'
    }
  }

  applyClassFiltering() {
    let hiddenSelector = '';
    for (let i in this.hiddenClasses) {
      hiddenSelector += '.' + i + ',';
    }

    hiddenSelector = hiddenSelector.substr(0, hiddenSelector.length - 1);

    if (hiddenSelector.length > 1) {
      this.viewUtils.hide(this.cy.$(hiddenSelector));
    }
    // if (updateTimebar) {
    //   // this.appManager.visibilityChanged();
    // }
  }

  getGraphElemSet() {
    return new Set<string>(this.cy.elements().map(x => x.id()));
  }

  setStyleFromJson(json) {
    this.cy.style(json);
  }
}