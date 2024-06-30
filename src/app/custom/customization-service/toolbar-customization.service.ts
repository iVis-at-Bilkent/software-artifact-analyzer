import { Injectable } from '@angular/core';
import { ToolbarDiv } from '../../visuall/toolbar/itoolbar';
import { GlobalVariableService } from '../../visuall/global-variable.service';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { Neo4jDb } from '../../visuall/db-service/neo4j-db.service';
import { ActivatedRoute } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ToolbarCustomizationService {

  private _menu: ToolbarDiv[];
  listOfAnomalies = []
  get menu(): ToolbarDiv[] {
    return this._menu;
  }

  constructor(private _g: GlobalVariableService, public _dbService: Neo4jDb, private route: ActivatedRoute) {
    this._menu = [];

    this._menu = [{
      div: 3, items: [{ title: 'Check Anomalies', isRegular: true, fn: 'activateAnomalyCues', isStd: true, imgSrc: 'assets/img/toolbar/cue.svg' }]
    }];


    this.route.queryParamMap.subscribe(params => {
      if (params.get('issue')) {
        setTimeout(() => {
          this._dbService.activateAnomalyCues();
        }, 500);
      }
    });
  }
  activateAnomalyCues(){
    this._dbService.activateAnomalyCues();
  }
}
