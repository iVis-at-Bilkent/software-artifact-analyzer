import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { RuleNode } from '../../../../visuall/operation-tabs/map-tab/query-types';
import { Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-rule-tree',
  templateUrl: './rule-tree.component.html',
  styleUrls: ['./rule-tree.component.css']
})
export class RuleTreeComponent implements OnInit {

  constructor() { }
  @Input() root: RuleNode;
  @Input() editedRuleNode: Subject<RuleNode>;
  @Output() onRuleRequested = new EventEmitter<{ node: RuleNode, isEdit: boolean }>();
  @Output() onEmpty = new EventEmitter<boolean>();
  @Output() onOperatorAdded = new EventEmitter<RuleNode>();
  currNode: RuleNode;
  isShowChildren = true;
  editedRuleNodeSubs: Subscription;

  ngOnInit(): void {
    if (this.editedRuleNode) {
      this.editedRuleNodeSubs = this.editedRuleNode.subscribe(x => {
        x.isEditing = false;
      });
    }
  }

  ngOnDestroy() {
    if (this.editedRuleNodeSubs) {
      this.editedRuleNodeSubs.unsubscribe();
    }
  }

  operatorClicked(r: RuleNode) {
    const op = r.r.ruleOperator;
    if (op == 'AND') {
      r.r.ruleOperator = 'OR';
    } else {
      r.r.ruleOperator = 'AND';
    }
  }

  addOperator(curr: RuleNode, code: 'AND' | 'OR') {
    const newNode: RuleNode = { r: { ruleOperator: code }, children: [], parent: curr };
    curr.children.push(newNode);
    this.currNode = newNode;
    this.operatorEmitter(newNode);
  }

  operatorEmitter(r: RuleNode) {
    this.onOperatorAdded.emit(r);
  }

  deleteNode(node: RuleNode) {
    const parent = node.parent;
    if (parent) {
      const idx = parent.children.indexOf(node);
      parent.children.splice(idx, 1);
    } else {
      this.root = null;
      this.onEmpty.emit(true);
    }
  }

  addRule(e: { node: RuleNode, isEdit: boolean }) {
    // since component is recursive, we should only set it once
    if (!this.root.parent && e.isEdit) {
      if (!e.node.isEditing) {
        this.clearAllEditings(this.root);
      }
      e.node.isEditing = !e.node.isEditing;
    }
    this.onRuleRequested.emit(e);
  }

  btnFromDropdownClicked(e: 'AND' | 'OR' | 'C') {
    if (e != 'C') {
      this.addOperator(this.root, e);
    } else {
      this.addRule({ node: this.root, isEdit: false });
    }
  }

  changeQueryRuleOrder(node: RuleNode, isUp: boolean) {
    const parent = node.parent;
    const j = parent.children.indexOf(node);
    if ((isUp && j == 0) || (!isUp && j == parent.children.length - 1)) {
      return;
    }
    let idx = j + 1;
    if (isUp) {
      idx = j - 1;
    }
    let tmp = parent.children[j];
    parent.children[j] = parent.children[idx];
    parent.children[idx] = tmp;
  }

  clearAllEditings(r: RuleNode) {
    if (r === undefined || r === null) {
      return;
    }
    r.isEditing = false;
    for (const child of r.children) {
      this.clearAllEditings(child);
    }
  }

}
