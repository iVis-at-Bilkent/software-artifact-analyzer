import { Injectable } from '@angular/core';
import { ToolbarDiv } from '../visuall/toolbar/itoolbar';
import { GlobalVariableService } from '../visuall/global-variable.service';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { Neo4jDb } from '../visuall/db-service/neo4j-db.service';

@Injectable({
  providedIn: 'root'
})

/** Custom menu items and action functions for the items should be added to this class.
 * You might need to import other services but you should only edit this file.
 * Using 'menu' function, provided items will be added to toolbar.
 * 'isStd' property must be false for all items.
 * If 'dropdown' is not existing inside standard menu, it will be added as a new item.
 sample menu   
    this._menu = [{
      div: 12, items: [{ title: 'Custom Action 1', isRegular: true, fn: 'fn1', isStd: false, imgSrc: '' }]
    },
    {
      div: 1, items: [{ title: 'Custom Action 2', isRegular: true, fn: 'fn2', isStd: false, imgSrc: '' }]
    }];
**/
export class ToolbarCustomizationService {

  private _menu: ToolbarDiv[];
  listOfAnomalies = []
  get menu(): ToolbarDiv[] {
    return this._menu;
  }

  constructor( private _g: GlobalVariableService, public _dbService: Neo4jDb) {
    this._menu = [];

    this._menu = [{
      div: 3, items: [{ title: 'Add Anomaly Cues', isRegular: true, fn: 'activateAnomalyCues', isStd: true, imgSrc: 'assets/img/toolbar/cue.svg' }]
    }];
  }
  async anomaly11(issue_name): Promise<any> {
    const count = this._g.userPrefs?.anomalyDefaultValues?.reopenCount.getValue() || 1;
    const cql = ` MATCH (n:Developer)-[r]->(issue:Issue)
    WHERE issue.resolver= n.name and issue.closer = n.name and issue.name = '${issue_name}'
    WITH count(n) AS count
    RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, "Same resolver closer");
  }
  async anomaly10(issue_name): Promise<any> {
    const count = this._g.userPrefs?.anomalyDefaultValues?.reopenCount.getValue() || 1;
    const cql = `MATCH (n:Issue)  WHERE n.duplicate='True' 
    AND NOT (n)-[:DUPLICATES]-() and  n.name = '${issue_name}'
    WITH count(n) AS count
    RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, "Not Referenced duplicates");
  }
  async anomaly9(issue_name): Promise<any> {
    const count = this._g.userPrefs?.anomalyDefaultValues?.reopenCount.getValue() || 1;
    const cql = ` MATCH (n:Issue) 
    WHERE n.reopenCount>=${count} and  n.name = '${issue_name}'
    WITH count(n) AS count
    RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, "Closed reopen ping pong");
  }


  async anomaly8(issue_name): Promise<any> {
    const cql = `MATCH (n:Issue)
    WHERE EXISTS(n.assignee) AND EXISTS(n.resolver) AND  EXISTS(n.assignee) AND EXISTS(n.resolver) and  n.name = '${issue_name}'
    WITH n, n.assignee AS assignee, n.resolver AS resolver
    WHERE assignee <> resolver  
    WITH count(n) AS count,assignee,resolver
    RETURN CASE WHEN count = 0 THEN false ELSE true END, assignee, resolver`;
    return await this.runAnomalyQuery(cql, "No assignee resolver:");

  }


  async anomaly7(issue_name): Promise<any> {
    const cql = `MATCH (n) 
    WHERE NOT  EXISTS(n.environment) and n.affectedVersion = '' and n.name = '${issue_name}'
    WITH count(n) AS count
    RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, "No comment on issue");
  }
  async anomaly6(): Promise<any> {


  }
  async anomaly5(issue_name): Promise<any> {
    const cql = ` MATCH (n:Issue) WHERE NOT EXISTS(n.priority)  and  n.name = '${issue_name}'
    WITH count(n) AS count
     RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, "Missing priority");

  }


  async anomaly4(): Promise<any> {
    return "";
  }


  async anomaly3(issue_name): Promise<any> {
    const time = this._g.userPrefs?.anomalyDefaultValues?.ignoreBug.getValue() || 1;
    const cql = `MATCH (n:Issue)
    WHERE exists(n.history) AND size(n.history) >= 2 and n.name = '${issue_name}'
    WITH n, range(0, size(n.history)-2) as index_range
    UNWIND index_range as i
    WITH n, i, datetime(n.history[i]) as from, datetime(n.history[i+1]) as to
    WHERE duration.between(from, to).months > ${time} 
    WITH  from, to, count(n) AS count
    RETURN CASE WHEN count = 0 THEN false ELSE true  END, from, to`;
    return await this.runAnomalyQuery(cql, `Ignored bug:`);
  }

  async anomaly2(issue_name): Promise<any> {
    const cql = `MATCH (n:Issue{status:'Done' })
    WHERE NOT (n)-[:REFERENCES]->() and n.commitIds=[] and n.name = '${issue_name}'
    WITH count(n) AS count
    RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, "No link to bug fixing commit or pull request");

  }

  async anomaly1(issue_name): Promise<any> {
    const cql = `MATCH (n:Issue {status: 'Done'})
      WHERE NOT EXISTS(n.assignee) AND n.name = '${issue_name}'
      WITH count(n) AS count
      RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, "Unassigned issue");
  }
  async runAnomalyQuery(cql: string, name: string) {
    return new Promise((resolve, reject) => {
      const cb = (x) => {
        const result = x.data[0]
        if (result && result[0]) {
          resolve(true);
        }
        else {
          resolve(false);
        }
      };
      this._dbService.runQuery(cql, cb, DbResponseType.table);
    });
  }

  generateRedShades() {
    let colors = [];
    let redValue = 280;
    let greenValue = 80;
    let blueValue = 80;
    for (let i = 0; i < 11; i++) {
      let redHex = redValue.toString(16).padStart(2, '0');
      let greenHex = greenValue.toString(16).padStart(2, '0');
      let blueHex = blueValue.toString(16).padStart(2, '0');
      let hexColor = '#' + redHex + greenHex + blueHex;
      colors.push(hexColor);
      redValue -= 30;
      greenValue -= 6;
      blueValue -= 6;
    }
    return colors;
  }
  activateAnomalyCues() {

    //TODO:Number of detected anomalies 
    let anomalies = [
      { text: 'Unassigned Bugs', isEnable: false, path2userPref: this.anomaly1.bind(this) },
      { text: 'No Link to Bug-Fixing Commit', isEnable: false, path2userPref: this.anomaly2.bind(this) },
      { text: 'Ignored Bugs', isEnable: false, path2userPref: this.anomaly3.bind(this) },
      { text: 'Bugs Assigned to a Team', isEnable: false, path2userPref: this.anomaly4.bind(this) },
      { text: 'Missing Priority', isEnable: false, path2userPref: this.anomaly5.bind(this) },
      { text: 'Missing Environment Information', isEnable: false, path2userPref: this.anomaly6.bind(this) },
      { text: 'No comment bugs', isEnable: false, path2userPref: this.anomaly7.bind(this) },
      { text: 'Non-Assignee Resolver of Bug', isEnable: false, path2userPref: this.anomaly8.bind(this) },
      { text: 'Closed-Reopen Ping Pong', isEnable: false, path2userPref: this.anomaly9.bind(this) },
      { text: 'Not Referenced Duplicates', isEnable: false, path2userPref: this.anomaly10.bind(this) },
      { text: 'Same Resolver Closer', isEnable: false, path2userPref: this.anomaly11.bind(this) }
    ];
      const colors = this.generateRedShades()
      console.log(colors)
      this._g.cy.nodes().filter(':visible').forEach(async (element )=> {
        if (element._private.classes.values().next().value == 'Issue') {
          const div1 = document.createElement("div");

          const queries = anomalies.map((anomaly) => anomaly.path2userPref(element._private.data.name));
          const queryResults = await Promise.all(queries);
          let anomaliesWithTrueResults = anomalies
            .filter((anomaly, index) => queryResults[index]) // filter out items whose function returns false
            .map(anomaly => anomaly.text);
          let number = anomaliesWithTrueResults.length;
          let color = (number>0)?colors[number]: '#599a20';
          let listOfAnomalies = anomaliesWithTrueResults
          this.listOfAnomalies = listOfAnomalies
          div1.innerHTML = `<span style="background-color:${color} !important;" class="badge rounded-pill bg-primary">${number}</span>`;
          element.addCue({
            htmlElem: div1,
            id:element._private.data.name,
            show: "always",
            position: "top-right",
            marginX: "%0",
            marginY: "%0",
            cursor: "pointer",
            zIndex: 1000,
            tooltip: listOfAnomalies.join('\n')
          
          });

        }
      });

    

  }

  // fn2() { console.log('fn2 is called!') }
}
