import { Component, NgModule, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DialogComponent } from './dialog-component';
import {ProjectAboutModalComponent} from '../../popups/project-about-modal/project-about-modal-component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
/**
 * @title Dialog elements
 */
@Component({
  selector: 'project-builder-dialog-component',
  styleUrls: ['project-builder-dialog-component.css'],
  templateUrl: 'project-builder-dialog-component.html',
})
export class ProjectBuilderDialogComponent {
  constructor(public dialog: MatDialog,  private _modalService: NgbModal) {}

  openNewDialog() {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '90vw',
      height: '90vh',
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

  openAboutDialog(){
    this._modalService.open(ProjectAboutModalComponent);
  }
}


