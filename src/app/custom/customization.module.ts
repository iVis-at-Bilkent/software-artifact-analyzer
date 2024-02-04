import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Neo4jDb } from '../visuall/db-service/neo4j-db.service';
import { DbService } from '../visuall/db-service/data-types';
import { DeveloperCommitsComponent } from './analyses/developer-commits/developer-commits.component';
import { ReviewerRecommendationComponent } from './analyses/reviewer-recommendation/reviewer-recommendation.component';
import { AnomalyComponent } from './analyses/anomalies/anomaly/anomaly.component';
import { AnomalyStatisticComponent } from './analyses/anomalies/anomaly-statistic/anomaly-statistic.component';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { Rule, RuleNode, TimebarMetric } from '../visuall/operation-tabs/map-tab/query-types';
import { ReportComponent } from './operational-tabs/object-tab/report-tab/report.component';
import { ObjectQueriesComponent } from './operational-tabs/object-tab/object-queries-tab/object-queries.component'
import { HttpClientModule, HttpClientXsrfModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { UnassignedBugsComponent } from './analyses/anomalies/unassigned-bugs/unassigned-bugs.component';
import { NoLinkToBugFixingCommitComponent } from './analyses/anomalies/no-link-to-bug-fixing-commit/no-link-to-bug-fixing-commit.component';
import { IgnoredBugsComponent } from './analyses/anomalies/ignored-bugs/ignored-bugs.component';
import { MissingPriorityComponent } from './analyses/anomalies/missing-priority/missing-priority.component';
import { NotReferencedDuplicatesComponent } from './analyses/anomalies/not-referenced-duplicates/not-referenced-duplicates.component';
import { MissingEnvironmentInformationComponent } from './analyses/anomalies/missing-environment-information/missing-environment-information.component';
import { ReassignmentBugAssigneeComponent } from './analyses/anomalies/reassignment-bug-assignee/reassignment-bug-assignee.component';
import { NoCommentBugsComponent } from './analyses/anomalies/no-comment-bugs/no-comment-bugs.component';
import { NoAssigneeResolverBugComponent } from './analyses/anomalies/no-assignee-resolver-bug/no-assignee-resolver-bug.component';
import { ClosedReopenPingPongComponent } from './analyses/anomalies/closed-reopen-ping-pong/closed-reopen-ping-pong.component';
import { SameResolverCloserComponent } from './analyses/anomalies/same-resolver-closer/same-resolver-closer.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ModalContentComponent } from './operational-tabs/object-tab/modal-content/modal-content.component';
import { ExpertRecommendationComponent } from './analyses/expert-recommendation/expert-recommendation.component';
import { CommentContributorsComponent } from './analyses/comment-contributors/comment-contributors.component';
import { CollaboratorsComponent } from './analyses/collaborators/collaborators.component';
import { CommentCollaboratorsComponent } from './analyses/comment-collaborators/comment-collaborators.component';
import { ReportIssueComponent } from './operational-tabs/object-tab/report-tab/sub-report-tabs/report-issue/report-issue.component';
import { ReportPrComponent } from './operational-tabs/object-tab/report-tab/sub-report-tabs/report-pr/report-pr.component';
import { ReportDeveloperComponent } from './operational-tabs/object-tab/report-tab/sub-report-tabs/report-developer/report-developer.component';
import { ReportCommitComponent } from './operational-tabs/object-tab/report-tab/sub-report-tabs/report-commit/report-commit.component';
import { ReportFileComponent } from './operational-tabs/object-tab/report-tab/sub-report-tabs/report-file/report-file.component';
// import { AsdComponent } from './asd/asd.component';
// import statements for custom components should be here

@NgModule({
  // custom components should be inside declarations
  declarations: [
    DeveloperCommitsComponent,
    ReviewerRecommendationComponent,
    AnomalyStatisticComponent,
    ReportComponent,
    ObjectQueriesComponent,
    AnomalyComponent,
    UnassignedBugsComponent,
    NoLinkToBugFixingCommitComponent,
    IgnoredBugsComponent,
    MissingPriorityComponent,
    NotReferencedDuplicatesComponent,
    MissingEnvironmentInformationComponent,
    ReassignmentBugAssigneeComponent,
    NoCommentBugsComponent,
    NoAssigneeResolverBugComponent,
    ClosedReopenPingPongComponent,
    SameResolverCloserComponent,
    ModalContentComponent,
    ExpertRecommendationComponent,
    CommentContributorsComponent,
    CollaboratorsComponent,
    CommentCollaboratorsComponent,
    ReportIssueComponent,
    ReportPrComponent,
    ReportDeveloperComponent,
    ReportCommitComponent,
    ReportFileComponent],
  imports: [
    HttpClientModule,
    BrowserModule,
    CommonModule,
    SharedModule,
    FormsModule,
    NgbModule
  ]
})

export class CustomizationModule {

  static operationTabs: { component: any, text: string }[] = [];

  static objSubTabs: { component: any, text: string }[] = [];

  static objSubTabsOne: { component: any, text: string } [] = [
    { component: ReportComponent, text: 'Report'},
    { component: ObjectQueriesComponent, text: 'Queries'}
  ];
   
  static mapSubTabs: { component: any, text: string } [] = [];
  static databaseSubTabs: { component: any, text: string } [] = [];
  static settingsSubTabs: { component: any, text: string } [] = [];
  static queries: { component: any, text: string } [] = [
  { component: DeveloperCommitsComponent, text: 'Get Commits of Developer' },
  { component: ReviewerRecommendationComponent, text: 'Get Recommended Reviewers' },
  { component: AnomalyComponent, text: 'Get Anomalies' },
  { component: AnomalyStatisticComponent, text: 'Get Anomaly Statistics' }
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
