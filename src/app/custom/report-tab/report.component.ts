

import { Component, ViewChild, ViewContainerRef, ComponentRef, OnInit } from '@angular/core';
import { GlobalVariableService } from '../../visuall/global-variable.service';
import { Neo4jDb } from '../../visuall/db-service/neo4j-db.service';
import { BehaviorSubject } from 'rxjs';
import { ReportIssueComponent } from './sub-report-tabs/report-issue/report-issue.component';
import { ReportPrComponent } from './sub-report-tabs/report-pr/report-pr.component';
import { ReportFileComponent } from './sub-report-tabs/report-file/report-file.component';
import { ReportCommitComponent } from './sub-report-tabs/report-commit/report-commit.component';
import { ReportDeveloperComponent } from './sub-report-tabs/report-developer/report-developer.component';
@Component({
    selector: 'app-report',
    template: `
          <div #reportContainer></div>
        `,
})
export class ReportComponent implements OnInit {
    className: string;
    name: string;
    @ViewChild('reportContainer', { read: ViewContainerRef }) container: ViewContainerRef;
    componentRef: ComponentRef<any>;


    constructor(
        public _dbService: Neo4jDb,
        private _g: GlobalVariableService,
    ) { }

    ngOnInit() {
        setInterval(() => {
            if (this._g.cy.$(':selected')[0]._private.data.name !== this.name) {
                this.name = this._g.cy.$(':selected')[0]._private.data.name
                this.loadComponent();
            }
        }, 500)

    }

    loadComponent() {
        if (this.container) {
            this.container.clear();
        }
        this.className = this._g.cy.$(':selected')[0]._private.classes.values().next().value;
        switch (this.className) {
            case 'Issue':
                this.loadDynamicComponent(ReportIssueComponent);
                break;
            case 'PullRequest':
                this.loadDynamicComponent(ReportPrComponent);
                break;
            case 'File':
                this.loadDynamicComponent(ReportFileComponent);
                break;
            case 'Commit':
                this.loadDynamicComponent(ReportCommitComponent);
                break;
            case 'Developer':
                this.loadDynamicComponent(ReportDeveloperComponent);
                break;
            default:
                this.loadDynamicComponent(ReportFileComponent);
                break;
        }
    }
    loadDynamicComponent(component: any) {
        this.componentRef = this.container.createComponent(component);
        console.log('Component Ref:', this.componentRef);
    }


}

