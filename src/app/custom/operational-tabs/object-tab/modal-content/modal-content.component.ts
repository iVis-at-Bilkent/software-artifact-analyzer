import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-modal-content',
  template: `

  <div class="modal-body text-center" *ngIf="templateType === 'report'">
    <div class="modal-header">
      <div class="modal-title va-heading1 text-center">Report successfully sent</div>
      <div>
      <button type="button" class="btn-close" aria-label="Close" (click)="closeModal()"></button>
     </div>
    </div>
    <div class="va-text">
      <p>Thank you, for submitting your report under {{ name }}.</p>
      <p>You can view your report by clicking the following link <a [href]="url" target="_blank">here </a></p>
    </div>
  </div>

  <div class="modal-body text-center" *ngIf="templateType === 'error'">
    <div class="modal-header">
      <div class="modal-title va-heading1 text-center">{{title}}</div>
      <div>
      <button type="button" class="btn-close" aria-label="Close" (click)="closeModal()"></button>
     </div>
    </div>
    <div class="va-text">
      <p>{{message}}</p>
    </div>
  </div>

  <div class="modal-body text-center" *ngIf="templateType === 'assigned'">
    <div class="modal-header">
      <div class="modal-title va-heading1 text-center">You successfully assigned reviewer </div>
      <div>
      <button type="button" class="btn-close" aria-label="Close" (click)="closeModal()"></button>
     </div>
    </div>
    <div class="va-text">
      <p>Thank you, for assigning reviewer for the {{ name }}.</p>
      <p>You can view pull request by clicking the following link <a [href]="url" target="_blank"> here </a></p>
    </div>
  </div>
`
})
export class ModalContentComponent {
  name: string;
  url: string;
  templateType: string;
  message: string;
  title: string;

  constructor(public activeModal: NgbActiveModal) { }

  closeModal(): void {
    this.activeModal.close(); // Close the modal from within the modal component
  }
}