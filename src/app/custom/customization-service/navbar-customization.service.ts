import { Injectable } from '@angular/core';
import { NavbarDropdown } from '../../visuall/navbar/inavbar';
import { GlobalVariableService } from '../../visuall/global-variable.service';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { Neo4jDb } from '../../visuall/db-service/neo4j-db.service';
@Injectable({
  providedIn: 'root'
})

export class NavbarCustomizationService {

  private _menu: NavbarDropdown[];
  get menu(): NavbarDropdown[] {
    return this._menu;
  }

  constructor(private _g: GlobalVariableService, public _dbService: Neo4jDb) {
    this._menu = [
      {
        dropdown: 'Highlight', actions: [{ txt: 'Check Anomalies', id: '', fn: 'activateAnomalyCues', isStd: false }]
      },
    ];
  }
  activateAnomalyCues(){
    this._dbService.activateAnomalyCues();
  }
}


