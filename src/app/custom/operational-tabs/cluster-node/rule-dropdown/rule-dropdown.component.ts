import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-rule-dropdown',
  templateUrl: './rule-dropdown.component.html',
  styleUrls: ['./rule-dropdown.component.css']
})
export class RuleDropdownComponent implements OnInit {

  @Input() isShowConditionBtn: boolean;
  @Output() btnClicked: EventEmitter<'AND' | 'OR' | 'SAME'> = new EventEmitter();
  isShowDropDown: boolean;

  constructor() { }

  ngOnInit(): void {
  }

  btnClick(t: 'AND' | 'OR' | 'SAME') {
    this.isShowDropDown = false;
    this.btnClicked.next(t);
  }

}
