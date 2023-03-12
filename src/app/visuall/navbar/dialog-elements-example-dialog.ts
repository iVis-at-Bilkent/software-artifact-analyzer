
import { Component, OnInit, ElementRef } from '@angular/core';
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer,SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
@Component({
    selector: 'dialog-elements-example-dialog',
    templateUrl: 'dialog-elements-example-dialog.html',
    styleUrls: ['dialog-elements-example.css']
})
@Pipe({
  name: 'safe'
})
export class DialogElementsExampleDialog implements OnInit {
  
  public safeSrc: SafeResourceUrl;  
  constructor(private elRef: ElementRef, private router: Router,private sanitizer: DomSanitizer) { 
  }

  ngOnInit() {
    this.safeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(`http://${window.location.hostname}:4450`);
  }

  adjustSize() {
    const dialogEl = this.elRef.nativeElement.closest('.mat-dialog-container');
    const iframeEl = this.elRef.nativeElement.querySelector('iframe');
  }

}


