import { Injectable } from '@angular/core';
import { ToolbarDiv } from '../visuall/toolbar/itoolbar';
import { GlobalVariableService } from '../visuall/global-variable.service';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { Neo4jDb } from '../visuall/db-service/neo4j-db.service';
import { getCyStyleFromColorAndWid, readTxtFile, isJson } from '../visuall/constants';
import tinycolor from 'tinycolor2';
import { UserProfileService } from '../visuall/user-profile.service';
import {
  addCue,
  removeCue,
  updateCue,
  getCueData,
  showCue,
  hideCue,
  setActiveInstance,
  getActiveInstanceId,
} from "./cytoscape-visual-cues";

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
  addCue: boolean = false;
  get menu(): ToolbarDiv[] {
    return this._menu;
  }

  constructor(private _g: GlobalVariableService, public _dbService: Neo4jDb, private _profile: UserProfileService) {
    this._menu = [];

    this._menu = [{
      div: 12, items: [{ title: 'Anomaly Cues', isRegular: true, fn: 'activateAnomalyCues', isStd: true, imgSrc: 'assets/img/toolbar/issue.svg' }]
    }];
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
    WHERE EXISTS(n.assignee) AND EXISTS(n.resolver) AND n.assignee <>'None' AND n.resolver <>'None' and  n.name = '${issue_name}'
    WITH n, n.assignee AS assignee, n.resolver AS resolver
    WHERE assignee <> resolver  
    WITH count(n) AS count,assignee,resolver
    RETURN CASE WHEN count = 0 THEN false ELSE true END, assignee, resolver`;
    return await this.runAnomalyQuery(cql, "No assignee resolver:");

  }


  async anomaly7(issue_name): Promise<any> {
    const cql = `MATCH (n:Issue{status:'Done'})
    WHERE size(n.comments) = 0  and  n.name = '${issue_name}'
    WITH count(n) AS count
    RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, "No comment on issue");
  }
  async anomaly6(): Promise<any> {


  }
  async anomaly5(issue_name): Promise<any> {
    const cql = ` MATCH (n:Issue) WHERE n.priority  is NULL   and  n.name = '${issue_name}'
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
      WHERE n.assignee = 'None' AND n.name = '${issue_name}'
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

  createRedShades() {
    if (this._g.userPrefs.highlightStyles.length < 14) {
      const baseColor = '#990000'; // Base color is pure red
      const shades = [];

      for (let i = 0; i < 10; i++) {
        const shade = tinycolor(baseColor).lighten(i * 10).toString();
        shades.push(shade);
      }
      for (let i = 0; i < shades.length; i++) {
        const cyStyle = getCyStyleFromColorAndWid(shades[i], 4.5);
        this._g.viewUtils.addHighlightStyle(cyStyle.node, cyStyle.edge);
      }
      this._profile.saveUserPrefs();

    }
    /*
    console.log(this._g.userPrefs.highlightStyles)
    this._g.userPrefs.highlightStyles.splice(4);
    this._profile.saveUserPrefs();
    */
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
      { text: 'Closed-Reopen Ping Pong', isEnable: false, path2userPref: this.anomaly9.bind(this) }
    ];
    if (!this.addCue) {
      this.createRedShades()
      this.addCue = true;
      this._g.cy.nodes().filter(':visible').forEach(async element => {
        if (element._private.classes.values().next().value == 'Issue') {
          const div1 = document.createElement("div");

          const queries = anomalies.map((anomaly) => anomaly.path2userPref(element._private.data.name));
          const queryResults = await Promise.all(queries);
          let anomaliesWithTrueResults = anomalies
            .filter((anomaly, index) => queryResults[index]) // filter out items whose function returns false
            .map(anomaly => anomaly.text);
          let number = anomaliesWithTrueResults.length;
          let listOfAnomalies = anomaliesWithTrueResults
          this._g.viewUtils.highlight(element, 7 - number);
          div1.innerHTML = `<span title="tooltip" class="badge rounded-pill bg-primary">${number}</span>`;
          element.addCue({
            htmlElem: div1,
            show: "always",
            position: "top-right",
            marginX: "%0",
            marginY: "%0",
          });
          if (anomaliesWithTrueResults.length > 0) {
            const div2 = document.createElement("div");
            div2.innerHTML = `<ul class="va-text" style="opacity: 0.9; list-style-type: square; background-color: #eaeaea; color:#333a40; border: 1px solid #ddd; padding: 12px;"> ${listOfAnomalies.map(anomaly => `<li class="va-text">${anomaly}</li>`).join('')} </ul>`;
            element.addCue({
              htmlElem: div2,
              show: "over",
              position: "bottom-left",
              marginX: "%-90",
              marginY: "%90",
            });

          } else {
            this._g.viewUtils.highlight(element, 2);
          }


        }
      });
    }
    else {
      this.addCue = false;
      this._g.cy.nodes().removeCue()
      this._g.cy.nodes().filter(':visible').forEach(async element => {
        if (element._private.classes.values().next().value == 'Issue') {
          this._g.viewUtils.removeHighlights(element)
          element.removeCue()
        }
      }
      );

    }



  }

  // fn2() { console.log('fn2 is called!') }
}
