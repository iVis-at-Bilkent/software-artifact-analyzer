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
      div: 3, items: [{ title: 'Check Anomalies', isRegular: true, fn: 'activateAnomalyCues', isStd: true, imgSrc: 'assets/img/toolbar/cue.svg' }]
    }];
  }

  generateRedShades() {
    let colors = [];
    let redValue = 250;
    let greenValue = 200;
    let blueValue = 200;
    for (let i = 0; i < 6; i++) {
      let redHex = redValue.toString(16).padStart(2, '0');
      let greenHex = greenValue.toString(16).padStart(2, '0');
      let blueHex = blueValue.toString(16).padStart(2, '0');
      let hexColor = '#' + redHex + greenHex + blueHex;
      colors.push(hexColor);
      greenValue -=40;
      blueValue -= 40;
      redValue -= 10;
    }
    for(let i = 6; i<11;i++){
      colors.push('#721D1D');
    }
    return colors;
  }
  activateAnomalyCues() {
    const colors = this.generateRedShades()
    this._g.cy.nodes().filter(':visible').forEach(async (element )=> {
      if (element._private.classes.values().next().value == 'Issue') {
        const cb = (x) => {
          console.log(x)

          const div1 = document.createElement("div");        
          let number = x.data[0][1];
          let color = (number>0)?colors[number]: '#599a20';
          let listOfAnomalies = x.data[0][0];
          const size_x =  0.60 + 2*listOfAnomalies.length/20;
          const size_y =  0.35 + 2*listOfAnomalies.length/20;
          const font_size = 0.75+ listOfAnomalies.length/20;
          div1.innerHTML = `<span style="background-color:${color} !important; font-size:${font_size}em !important; padding-bottom:${size_y}em !important; padding-top:${size_y}em !important; padding-right:${size_x}em !important; padding-left:${size_x}em !important;border-radius:50%!important;" class="badge rounded-pill bg-primary">${number}</span>`;
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
        const cql = `MATCH (n:Issue {name:'${element._private.data.name}'}) RETURN n.anomalyList as anomalyList , n.anomalyCount as anomalyCount`;
        this._dbService.runQuery(cql, cb,  DbResponseType.table);
      }

    });
    

  }

  // fn2() { console.log('fn2 is called!') }
}
