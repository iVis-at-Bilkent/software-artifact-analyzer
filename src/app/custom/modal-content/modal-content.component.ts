import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-modal-content',
  template: `
  <div class="modal-header ">
  <div class="modal-title va-heading1 text-center">Report Successfully Sent</div>
  <div>
  <button  type="button" class="btn-close" aria-label="Close"
  (click)="closeModal()"> </button>
  </div>
</div>
<div  class="modal-body text-center ">
<div class="va-text">
  <p>Thank you, for submitting your report under {{ name }}. </p>
  <br>
  <p>You can view your report by clicking the following link: <a [href]="url" target="_blank">{{ url }}</a></p>
  </div>
</div>
  `,
})
export class ModalContentComponent {
  name: string;
  url: string;

  constructor(public activeModal: NgbActiveModal) { }

  closeModal(): void {
    this.activeModal.close(); // Close the modal from within the modal component
  }
}