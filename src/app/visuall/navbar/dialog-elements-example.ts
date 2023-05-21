import { Component, NgModule, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DialogElementsExampleDialog } from './dialog-elements-example-dialog';

/**
 * @title Dialog elements
 */
@Component({
  selector: 'dialog-elements-example',
  styleUrls: ['dialog-elements-example.css'],
  templateUrl: 'dialog-elements-example.html',
})
export class DialogElementsExample {
  constructor(public dialog: MatDialog) {}

  openDialog() {
    const dialogRef = this.dialog.open(DialogElementsExampleDialog, {
      width: '90vw',
      height: '90vh',
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }
}


