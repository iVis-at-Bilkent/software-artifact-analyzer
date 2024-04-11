import { Component } from '@angular/core';
import { GlobalVariableService } from './global-variable.service';
import { ActivatedRoute } from '@angular/router';
import { Neo4jDb } from './db-service/neo4j-db.service';
import { CytoscapeService } from './cytoscape.service';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { UserProfileService } from './user-profile.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  isLoading = false;
  paramValue: string="";
  setupValue :string="";
  constructor(private _dbService: Neo4jDb, private _cyService: CytoscapeService, private _g: GlobalVariableService, private route: ActivatedRoute, private _profile: UserProfileService) {
    this._g.setLoadingStatus = (e) => {
      this.isLoading = e;
      window['IsVisuallLoading'] = e;
    };
    
    this.route.queryParamMap.subscribe(params => {
      if( params.get('name')){
        this.paramValue = params.get('name');
        this._g.initialQuery = this.paramValue.toString();
        if(this.paramValue != ""){ 
          this._g.userPrefs.isLimitDbQueries2range.next(false)
          this._profile.saveUserPrefs();
          const cb = (x) => {
            this._cyService.loadElementsFromDatabaseInitial(x);
        };  
          this._dbService.runQuery(`MATCH (n1{name:'${this.paramValue}'})-[e]-(n2) RETURN n1,n2,e `,cb);
        }
      }
      if (params.get('setup')) {
        const setupParam = params.get('setup')?.toLowerCase();
        if(setupParam === "github"){
          this.setupValue = "GitHub";
        }
        else if(setupParam === "jira"){
          this.setupValue = "Jira";
        }
        else if(setupParam === "neo4j"){
          this.setupValue = "Neo4j";
        }
      }
    });

  }

}