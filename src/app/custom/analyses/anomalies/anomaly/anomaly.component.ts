import { Component, OnInit } from '@angular/core';
import { CustomizationModule } from '../../../customization.module';
import { UnassignedBugsComponent } from '../unassigned-bugs/unassigned-bugs.component';
import { NoLinkToBugFixingCommitComponent } from '../no-link-to-bug-fixing-commit/no-link-to-bug-fixing-commit.component';
import { IgnoredBugsComponent } from '../ignored-bugs/ignored-bugs.component';
import { MissingPriorityComponent } from '../missing-priority/missing-priority.component';
import { NotReferencedDuplicatesComponent } from '../not-referenced-duplicates/not-referenced-duplicates.component';
import { MissingEnvironmentInformationComponent } from '../missing-environment-information/missing-environment-information.component';
import { ReassignmentBugAssigneeComponent } from '../reassignment-bug-assignee/reassignment-bug-assignee.component';
import { NoCommentBugsComponent } from '../no-comment-bugs/no-comment-bugs.component';
import { NoAssigneeResolverBugComponent } from '../no-assignee-resolver-bug/no-assignee-resolver-bug.component';
import { ClosedReopenPingPongComponent } from '../closed-reopen-ping-pong/closed-reopen-ping-pong.component';
import { SameResolverCloserComponent } from '../same-resolver-closer/same-resolver-closer.component';
@Component({
  selector: 'app-anomaly',
  templateUrl: './anomaly.component.html',
  styleUrls: ['./anomaly.component.css']
})
export class AnomalyComponent implements OnInit {
  anomaly: string;
  selectedIdx: number;

  anomalies: { component: any, text: string }[] = [
    { component: UnassignedBugsComponent, text: 'Unassigned Bugs' },
    { component: NoLinkToBugFixingCommitComponent, text: 'No Link to Bug-Fixing Commit' },
    { component: IgnoredBugsComponent, text: 'Ignored Bugs' },
    { component: MissingPriorityComponent, text: 'Missing Priority' },
    { component: NotReferencedDuplicatesComponent, text: 'Not referenced duplicates' },
    { component: MissingEnvironmentInformationComponent, text: 'Missing Environment Information' },
    { component: ReassignmentBugAssigneeComponent, text: 'Reassignment of Bug Assignee' },
    { component: NoCommentBugsComponent, text: 'No comment bugs' },
    { component: NoAssigneeResolverBugComponent, text: 'Non-Assignee Resolver of Bug' },
    { component: ClosedReopenPingPongComponent, text: 'Closed-Reopen Ping Pong' },
    { component: SameResolverCloserComponent, text: 'Same Resolver and Closer' },

  ];

  constructor() {
    this.selectedIdx = -1;
   }
  changeAnomaly(event) {
    this.selectedIdx = this.anomalies.findIndex(x => x.text == event.target.value);
  }
  ngOnInit(): void {
    this.anomaly = '';
  }

}
