import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-panel-container',
  templateUrl: './panel-container.component.html',
  styleUrls: ['./panel-container.component.css']
})
export class PanelContainerComponent implements OnInit {

  constructor() { }

  @Input() panels: { component: any, text: string }[];
  @Input() containerId: string;
  @Input() isOpen = false;
  ngOnInit(): void {
  }
  toggleContainer() {
    this.isOpen = !this.isOpen;
  }

}
