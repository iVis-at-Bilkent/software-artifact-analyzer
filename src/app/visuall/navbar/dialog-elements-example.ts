import {Component, NgModule, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatDialogModule } from '@angular/material/dialog';
import { EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import  {DialogElementsExampleDialog} from './dialog-elements-example-dialog'
/**
 * @title Dialog elements
 */
@Component({
  selector: 'dialog-elements-example',
  styleUrls: ['dialog-elements-example.css'],
  templateUrl: 'dialog-elements-example.html',
})

export class DialogElementsExample implements OnInit {

  @ViewChild(DialogElementsExampleDialog, { static: true })
  dialogContent: DialogElementsExampleDialog;
  dropdown ={
    dropdown: 'Add Project', actions: [{ txt: 'Add Project', id: '1', fn: 'openDialog', isStd: true }]
  }
  constructor(public dialog: MatDialog) { }

  ngOnInit(): void {
  }

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
