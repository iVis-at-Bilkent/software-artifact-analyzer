import { Component, OnInit, Output, EventEmitter, Input, ViewChild, ElementRef, HostListener } from '@angular/core';
import { TEXT_OPERATORS, NUMBER_OPERATORS, LIST_OPERATORS, ENUM_OPERATORS, GENERIC_TYPE, isNumber, DATETIME_OPERATORS } from '../../../../visuall/constants';
import flatpickr from 'flatpickr';
import { PropertyCategory, Rule, RuleSync } from '../../../../visuall/operation-tabs/map-tab/query-types';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { IPosition } from 'angular2-draggable';
import { GlobalVariableService } from '../../../../visuall/global-variable.service';
import { UserProfileService } from '../../../../visuall/user-profile.service';

@Component({
  selector: 'app-property-rule',
  templateUrl: './property-rule.component.html',
  styleUrls: ['./property-rule.component.css']
})
export class PropertyRuleComponent implements OnInit {
  private attributeType: string;
  selectedProp: string;
  number: number =0;
  isGenericTypeSelected = true;
  selectedClassProps: string[];
  selectedOperatorKey: string;
  operatorKeys: string[];
  selectedPropertyCategory: PropertyCategory;
  filterInp: string;
  optInp: string;
  textAreaInp: string = '';
  finiteSetPropertyMap: any = null;
  selectedClass: string;
  currInpType: string = 'text';
  @Input() propertyChanged: Subject<RuleSync>;
  @Input() loadRule: Rule;
  @Input() isStrict: boolean;
  @Input() refreshView: Subject<boolean>;
  onRuleReady = new EventEmitter<Rule>();
  @Output() selectedProperty = new EventEmitter<string>();
  @ViewChild('dateInp', { static: false }) dateInp: ElementRef;
  @ViewChild('multiSelect', { static: false }) multiSelect: ElementRef;
  isShowTxtArea = false;
  txtAreaSize: { width: number, height: number } = { width: 350, height: 250 };
  position: IPosition = { x: 0, y: 0 };
  propChangeSubs: Subscription;
  option2selected = {};
  currListName = 'New List';
  fittingSavedLists: string[] = [];
  currSelectedList: string;
  private operators: any;
  constructor(private _g: GlobalVariableService, private _profile: UserProfileService) { }

  ngOnInit() {
    this.propChangeSubs = this.propertyChanged.subscribe(x => { this.updateView(x.properties, x.isGenericTypeSelected, x.selectedClass) });
  }

  ngOnDestroy() {
    if (this.propChangeSubs) {
      this.propChangeSubs.unsubscribe();
    }
  }


  updateView(props: string[], isGeneric: boolean, cName: string) {
    this.selectedClassProps = props;
    this.isGenericTypeSelected = isGeneric;
    this.selectedClass = cName;
    this.filterInp = '';
    this.selectedProp = null;
    this.selectedOperatorKey = null;

    if (this.loadRule) {
      this.filterInp = this.loadRule.inputOperand;
      this.selectedProp = this.loadRule.propertyOperand;
      // will set the operators according to selected property
      this.changeSelectedProp(this.filterInp, this.loadRule.rawInput);
      for (const opKey in this.operators) {
        if (this.operators[opKey] == this.loadRule.operator) {
          this.selectedOperatorKey = opKey;
        }
      }
    } else {
      this.changeSelectedProp();
    }
  }

  changeSelectedProp(filterInp = '', unixDateValue = null) {
    const model = this._g.dataModel.getValue();
    this.textAreaInp = '';
    this.selectedOperatorKey = null;
    this.filterInp = filterInp;
    let attrType = undefined;
    if (model.nodes[this.selectedClass]) {
      attrType = model.nodes[this.selectedClass][this.selectedProp];
    } else if (model.edges[this.selectedClass]) {
      attrType = model.edges[this.selectedClass][this.selectedProp];
    }
    if (model.edges[this.selectedProp]) {
      attrType = 'edge';
    }
    this.attributeType = attrType;
    this.operatorKeys = [];
    this.selectedPropertyCategory = this.getPropertyCategory();
    const rule: Rule = {
      propertyType: this.selectedProp,
      ruleOperator: 'AND'
    };
    this.onRuleReady.emit(rule);
    this.selectedProperty.emit(this.selectedProp);
    if (!attrType) {
      return;
    }
    
  }
  private getPropertyCategory(): PropertyCategory {
    let m = this._g.getEnumMapping();
    this.finiteSetPropertyMap = null;
    if (m && m[this.selectedClass] && m[this.selectedClass][this.selectedProp]) {
      this.finiteSetPropertyMap = m[this.selectedClass][this.selectedProp];
      const arr = [];
      for (const k in this.finiteSetPropertyMap) {
        arr.push({ key: k, value: this.finiteSetPropertyMap[k] });
      }
      arr.sort((a: any, b: any) => { if (a.value > b.value) return 1; if (b.value > a.value) return -1; return 0 });
      this.finiteSetPropertyMap = arr;
      return PropertyCategory.finiteSet;
    }
    if (this.attributeType == 'datetime') {
      return PropertyCategory.date;
    }
    return PropertyCategory.other;
  }

}
