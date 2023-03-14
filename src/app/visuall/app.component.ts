import { Component } from '@angular/core';
import { GlobalVariableService } from './global-variable.service';
import { ActivatedRoute } from '@angular/router';
import { Neo4jDb } from './db-service/neo4j-db.service';
import { CytoscapeService } from './cytoscape.service';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  isLoading = false;
  paramValue: string="";
  constructor(private _dbService: Neo4jDb, private _cyService: CytoscapeService, private _g: GlobalVariableService, private route: ActivatedRoute) {
    this._g.setLoadingStatus = (e) => {
      this.isLoading = e;
      window['IsVisuallLoading'] = e;
    };
    
    this.route.queryParamMap.subscribe(params => {
      this.paramValue = params.get('name');
      console.log(this.paramValue); 
      this._g.initialQuery = this.paramValue;
      const cb = (x) => {
          this._cyService.loadElementsFromDatabase(x, false);

      };
      
      if(this.paramValue != ""){
        this._dbService.runQuery(`MATCH (n1{name:'${this._g.initialQuery}'})-[e]-(n2) RETURN n1,n2,e `,cb);
      }
    });

  }
   

}
