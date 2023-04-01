import { Component, OnInit } from '@angular/core';
import { CustomizationModule } from '../../../custom/customization.module';
@Component({
  selector: 'app-query5',
  templateUrl: './query5.component.html',
  styleUrls: ['./query5.component.css']
})
export class Query5Component implements OnInit {
  anomaly: string;
  selectedIdx: number;
  anomalies:{ component: any, text: string }[];

  constructor() {
    this.anomalies = CustomizationModule.anomalies;
    this.selectedIdx = -1;
   }
  changeAnomaly(event) {
    this.selectedIdx = this.anomalies.findIndex(x => x.text == event.target.value);
    console.log(this.selectedIdx)

  }
  ngOnInit(): void {
    this.anomaly = '';
  }

}
