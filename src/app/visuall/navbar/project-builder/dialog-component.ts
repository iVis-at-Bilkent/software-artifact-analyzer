
import { Component, OnInit, ElementRef, Inject } from '@angular/core';
import { Pipe, PipeTransform } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
@Component({
  selector: 'dialog-component',
  styleUrls: ['project-builder-dialog-component.css'],
  templateUrl: 'dialog-component.html',
})
@Pipe({
  name: 'safe'
})
export class DialogComponent implements OnInit {
  public safeSrc: SafeResourceUrl;
  private timeoutRef: any;
  constructor(private http: HttpClient, private elRef: ElementRef, private router: Router, private sanitizer: DomSanitizer, public dialogRef: MatDialogRef<DialogComponent>) {
  }

  ngOnInit() {
    this.safeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(`http://${window.location.hostname}:4450`);
  }
  adjustSize() {
    const dialogEl = this.elRef.nativeElement.closest('.mat-dialog-container');
    const iframeEl = this.elRef.nativeElement.querySelector('iframe');
  }
  ngOnDestroy() {
    // Clear the timeout when the dialog is closed
    clearTimeout(this.timeoutRef);
  }
  onCloseClick(): void {
    this.dialogRef.close();
  }
}

