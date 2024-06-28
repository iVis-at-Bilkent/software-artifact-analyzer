import { Component } from '@angular/core';
import { GlobalVariableService } from './global-variable.service';
import { ActivatedRoute } from '@angular/router';
import { Neo4jDb } from './db-service/neo4j-db.service';
import { CytoscapeService } from './cytoscape.service';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { UserProfileService } from './user-profile.service';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  isLoading = false;
  paramValue: string = "";
  setupValue: string = "";
  queryValue: string = "";
  constructor(private _dbService: Neo4jDb, private _cyService: CytoscapeService, private _g: GlobalVariableService, private route: ActivatedRoute, private _profile: UserProfileService) {
    this._g.setLoadingStatus = (e) => {
      this.isLoading = e;
      window['IsVisuallLoading'] = e;
    };

    this.route.queryParamMap.subscribe(params => {
      if (params.get('name')) {
        this.paramValue = params.get('name');
        this._g.initialQuery = this.paramValue.toString();
        if (this.paramValue != "") {
          this._g.userPrefs.isLimitDbQueries2range.next(false)
          this._profile.saveUserPrefs();
          let limit = null;
          if (params.get('limit')) {
            limit = params.get('limit');
            if(params.get('limit') == "true"){
              limit = this._g.userPrefs.queryNeighborLimit.getValue()
            }
          }      
          const cb = (x) => {
            const elementId = x.data[0][0];
            this._dbService.getNeighbors(
              [elementId],
                (x) => {
                  this._cyService.loadElementsFromDatabase(x, true);
                },
                {},
                limit
              );
            console.log(elementId)
          };
          this._dbService.runQuery(`MATCH (n {name:'${this.paramValue}'}) RETURN elementId(n)  `, cb, DbResponseType.table);
        }
      }
      if (params.get('setup')) {
        const setupParam = params.get('setup')?.toLowerCase();
        if (setupParam === "github") {
          this.setupValue = "GitHub";
        }
        else if (setupParam === "jira") {
          this.setupValue = "Jira";
        }
        else if (setupParam === "neo4j") {
          this.setupValue = "Neo4j";
        }
      }

      if (params.get('pr')) {
        this.queryValue = params.get('pr');
        const cb = (x) => {
          if (x.nodes.length != 0) {
            this._cyService.loadElementsFromDatabaseInitial(x);
            this._g.cy.$id(`n${x.nodes[0].elementId}`)[0].select();
          }
          else {
            alert('There is no pull request register with the given name')
          }

        };
        this._dbService.runQuery(`MATCH (n{name:'${this.queryValue}'}) RETURN n`, cb);
      }

      else if (params.get('issue')) {
        this.queryValue = params.get('issue');
        const cb = (x) => {
          if (x.nodes.length != 0) {
            this._cyService.loadElementsFromDatabaseInitial(x);
          }
          else {
            alert('There is no pull request register with the given name')
          }

        };
        this._dbService.runQuery(`MATCH (n1{name:'${this.queryValue}'})-[e]-(n2) RETURN n1,n2,e `, cb);
      }
    });

  }

}