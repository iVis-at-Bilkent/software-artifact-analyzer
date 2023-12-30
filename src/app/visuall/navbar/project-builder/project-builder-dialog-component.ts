import { Component, Injector, NgModule, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DialogComponent } from './dialog-component';
import { ProjectAboutModalComponent } from '../../popups/project-about-modal/project-about-modal-component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Neo4jDb } from '../../db-service/neo4j-db.service';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
/**
 * @title Dialog elements
 */
@Component({
  selector: 'project-builder-dialog-component',
  styleUrls: ['project-builder-dialog-component.css'],
  templateUrl: 'project-builder-dialog-component.html',
})
export class ProjectBuilderDialogComponent {
  constructor(public dialog: MatDialog, private _modalService: NgbModal, public _dbService: Neo4jDb) { }

  openNewDialog() {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '90vw',
      height: '90vh',
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

  openAboutDialog() {
    // Initialize the statistic object
    const statistic: any = {};

    const cb = (x) => {
      // Use square brackets to access properties
      for (let j = 0; j < x.columns.length; j++) {
        statistic[x.columns[j]] = x.data[0][j];
      }

      // Pass the configuration object as a 'data' property
      const modalRef = this._modalService.open(ProjectAboutModalComponent);

      // Access the component instance and set its properties
      const modalComponentInstance: ProjectAboutModalComponent = modalRef.componentInstance;
      modalComponentInstance.modalConfig = statistic;
    };

    const cql = `
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->()
      WITH
        COUNT(DISTINCT n) AS node,
        COUNT(DISTINCT r) AS edge,
        COLLECT(DISTINCT CASE WHEN 'Commit' IN labels(n) THEN n END) AS commitNodes,
        COLLECT(DISTINCT CASE WHEN 'PullRequest' IN labels(n) THEN n END) AS prNodes,
        COLLECT(DISTINCT CASE WHEN 'Issue' IN labels(n) THEN n END) AS issueNodes,
        COLLECT(DISTINCT CASE WHEN 'Developer' IN labels(n) THEN n END) AS developerNodes,
        COLLECT(DISTINCT CASE WHEN 'File' IN labels(n) THEN n END) AS fileNodes
      RETURN
        node,
        edge,
        SIZE(commitNodes) AS commitNode,
        SIZE(prNodes) AS prNode,
        SIZE(issueNodes) AS issueNode,
        SIZE(developerNodes) AS developerNode,
        SIZE(fileNodes) AS fileNode;
      `;

    this._dbService.runQuery(cql, cb, DbResponseType.table);
  }
}



