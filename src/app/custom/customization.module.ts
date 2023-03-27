import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Neo4jDb } from '../visuall/db-service/neo4j-db.service';
import { DbService } from '../visuall/db-service/data-types';
import { Query1Component } from './queries/query1/query1.component';
import { Query2Component } from './queries/query2/query2.component';
import { Query3Component } from './queries/query3/query3.component';
import { Query4Component } from './queries/query4/query4.component';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { Rule, RuleNode, TimebarMetric } from '../visuall/operation-tabs/map-tab/query-types';
import { ReportComponentComponent } from './report-component/report-component.component';
import { RandomSelectionComponent } from '../shared/random-selection/random-selection.component';
import { HttpClientModule, HttpClientXsrfModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { OAuthModule, OAuthService } from 'angular-oauth2-oidc';
import { BrowserModule } from '@angular/platform-browser';
// import { AsdComponent } from './asd/asd.component';
// import statements for custom components should be here

@NgModule({
  // custom components should be inside declarations
  declarations: [
    Query1Component, 
    Query2Component,
    Query3Component,
    Query4Component,
     ReportComponentComponent],
  // declarations: [AsdComponent],
  imports: [
    HttpClientModule,
    BrowserModule,
    CommonModule,
    SharedModule,
    FormsModule
  ]
})

export class CustomizationModule {
  // static operationTabs: { component: any, text: string }[] = [{ component: AsdComponent, text: 'Dummy' }];
  // static operationTabs: { component: any, text: string }[] = [{ component: AsdComponent, text: 'Dummy' }, { component: Dummy2Component, text: 'Dummy2' }];
  static operationTabs: { component: any, text: string }[] = [];
  static objSubTabs: { component: any, text: string }[] = [
    { component: ReportComponentComponent, text: 'Report' }
  ];
  static mapSubTabs: { component: any, text: string }[] = [];
  static databaseSubTabs: { component: any, text: string }[] = [];
  static settingsSubTabs: { component: any, text: string }[] = [];
  static queries: { component: any, text: string }[] = [ 
    { component: Query1Component, text: 'Get Commits of Developer' },
    { component: Query3Component, text: 'Get Recommended Reviewers' },
    { component: Query4Component, text: 'Get issues that was resolved and closed by the same person' },

  ];
  static db: DbService;
  static defaultTimebarMetrics: TimebarMetric[];
  constructor(private _db: Neo4jDb) {
    CustomizationModule.db = _db;
    const andCond: Rule = { ruleOperator: 'OR' };
    const issueCond1: Rule = { propertyOperand: 'priority', propertyType: 'string', rawInput: 'Critical', inputOperand: 'Critical', ruleOperator: null, operator: '=' };
    const issueCond2: Rule = { propertyOperand: 'priority', propertyType: 'string', rawInput: 'Blocker', inputOperand: 'Blocker', ruleOperator: null, operator: '=' };
    const root1: RuleNode = { r: andCond, parent: null, children: [] };
    const child1: RuleNode = { r: issueCond1, parent: root1, children: [] };
    const child2: RuleNode = { r: issueCond2, parent: root1, children: [] };
    root1.children = [child1, child2];
    CustomizationModule.defaultTimebarMetrics = [
      { incrementFn: null, name: 'serious issue', className: 'Issue', rules: root1, color: '#3366cc' },
    ];
  }
}
