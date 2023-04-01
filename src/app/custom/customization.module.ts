import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Neo4jDb } from '../visuall/db-service/neo4j-db.service';
import { DbService } from '../visuall/db-service/data-types';
import { Query1Component } from './queries/query1/query1.component';
import { Query2Component } from './queries/query2/query2.component';
import { Query3Component } from './queries/query3/query3.component';
import { Query4Component } from './queries/query4/query4.component';
import { Query5Component } from './queries/query5/query5.component';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { Rule, RuleNode, TimebarMetric } from '../visuall/operation-tabs/map-tab/query-types';
import { ReportComponentComponent } from './report-component/report-component.component';
import { HttpClientModule, HttpClientXsrfModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { OAuthModule, OAuthService } from 'angular-oauth2-oidc';
import { BrowserModule } from '@angular/platform-browser';
import { UnassignedBugsComponent } from './anomalies/unassigned-bugs/unassigned-bugs.component';
import { NoLinkToBugFixingCommitComponent } from './anomalies/no-link-to-bug-fixing-commit/no-link-to-bug-fixing-commit.component';
import { IgnoredBugsComponent } from './anomalies/ignored-bugs/ignored-bugs.component';
import { BugsAssignedTeamComponent } from './anomalies/bugs-assigned-team/bugs-assigned-team.component';
import { MissingPriorityComponent } from './anomalies/missing-priority/missing-priority.component';
import { NotReferencedDuplicatesComponent } from './anomalies/not-referenced-duplicates/not-referenced-duplicates.component';
import { MissingEnvironmentInformationComponent } from './anomalies/missing-environment-information/missing-environment-information.component';
import { ReassignmentBugAssigneeComponent } from './anomalies/reassignment-bug-assignee/reassignment-bug-assignee.component';
import { NoCommentBugsComponent } from './anomalies/no-comment-bugs/no-comment-bugs.component';
import { NoAssigneeResolverBugComponent } from './anomalies/no-assignee-resolver-bug/no-assignee-resolver-bug.component';
import { ClosedReopenPingPongComponent } from './anomalies/closed-reopen-ping-pong/closed-reopen-ping-pong.component';
import { SameResolverCloserComponent } from './anomalies/same-resolver-closer/same-resolver-closer.component';

// import { AsdComponent } from './asd/asd.component';
// import statements for custom components should be here

@NgModule({
  // custom components should be inside declarations
  declarations: [
    Query1Component, 
    Query2Component,
    Query3Component,
    Query4Component,
     ReportComponentComponent,
     Query5Component,
     UnassignedBugsComponent,
     NoLinkToBugFixingCommitComponent,
     IgnoredBugsComponent,
     BugsAssignedTeamComponent,
     MissingPriorityComponent,
     NotReferencedDuplicatesComponent,
     MissingEnvironmentInformationComponent,
     ReassignmentBugAssigneeComponent,
     NoCommentBugsComponent,
     NoAssigneeResolverBugComponent,
     ClosedReopenPingPongComponent,
     SameResolverCloserComponent],
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
    { component: Query5Component, text: 'Get Anomalies' },

  ];
  static anomalies:{ component: any, text: string }[] = [
    { component: UnassignedBugsComponent, text: 'Unassigned Bugs' },
    { component: NoLinkToBugFixingCommitComponent, text: 'No Link to Bug-Fixing Commit' },
    { component: IgnoredBugsComponent, text: 'Ignored Bugs' },
    { component: BugsAssignedTeamComponent, text: 'Bugs Assigned to a Team' },
    { component: MissingPriorityComponent, text: 'Missing Priority' },
    { component: NotReferencedDuplicatesComponent, text: 'Not referenced duplicates' },
    { component: MissingEnvironmentInformationComponent, text: 'Missing Environment Information' },
    { component: ReassignmentBugAssigneeComponent, text: 'Reassignment of Bug Assignee' },
    { component: NoCommentBugsComponent, text: 'No comment bugs' },
    { component: NoAssigneeResolverBugComponent, text: 'Non-Assignee Resolver of Bug' },
    { component: ClosedReopenPingPongComponent, text: 'Closed-Reopen Ping Pong' },
    { component: SameResolverCloserComponent, text: 'Same Resolver and Closer' },
  
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
