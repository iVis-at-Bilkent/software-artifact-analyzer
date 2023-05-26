import { Component, Injectable } from '@angular/core';
import { NavbarDropdown } from '../visuall/navbar/inavbar';
import { GlobalVariableService } from '../visuall/global-variable.service';
import { ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatDialogModule} from '@angular/material/dialog';
import {MatMenuTrigger} from '@angular/material/menu';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { Neo4jDb } from '../visuall/db-service/neo4j-db.service';
@Injectable({
  providedIn: 'root'
})
/** Custom menu items and action functions for the items should be added to this class.
 * You might need to import other services but you should only edit this file.
 * Using 'menu' function, provided items will be added to navbar.
 * 'isStd' property must be false for all items.
 * If 'dropdown' is not existing inside standard menu, it will be added as a new item.
 sample menu   
 this._menu = [{
      dropdown: 'File', actions: [{ txt: 'Custom Action 1', id: '', fn: 'fn1', isStd: false }]
    },
    {
      dropdown: 'Custom DropDown 1', actions: [{ txt: 'Custom Action 1', id: '', fn: 'fn2', isStd: false }]
    }];
 **/


export class NavbarCustomizationService {

  private _menu: NavbarDropdown[];
  get menu(): NavbarDropdown[] {
    return this._menu;
  }

  constructor(private _g: GlobalVariableService, public _dbService: Neo4jDb, ) {
    this._menu = [
     {
        dropdown: 'Highlight', actions: [{ txt: 'Check Anomalies', id: '', fn: 'activateAnomalyCues', isStd: false }]
     },
    ];
    // this._menu = [{
    //   dropdown: 'File', actions: [{ txt: 'Custom Action 1', id: '', fn: 'fn1', isStd: false }]
    // },
    // {
    //   dropdown: 'Custom DropDown 1', actions: [{ txt: 'Custom Action 2', id: '', fn: 'fn2', isStd: false }]
    // }];
  }


  generateRedShades() {
    let colors = [];
    colors = [
      "#599a20", "#FF9999", "#fe5050", "#FE0022", "#BC0000", "#9a0000"
    ]


    /*
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
    */
    return colors;
  }
  activateAnomalyCues() {

      const colors = this.generateRedShades()
      this._g.cy.nodes().filter(':visible').forEach(async (element )=> {
        if (element._private.classes.values().next().value == 'Issue') {
          const cb = (x) => {
            const div1 = document.createElement("div");        
            let number = x.data[0][1];
            let color = (number<=5)?colors[number]: colors[4];
            let listOfAnomalies = x.data[0][0];
            const size_x = 0.60 + 2 * Math.log(3*listOfAnomalies.length + 1) / 15;
            const size_y = 0.35 + 2 * Math.log(3*listOfAnomalies.length + 1) / 15;
            const font_size = 0.75 + Math.log(3*listOfAnomalies.length + 1) / 15;
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


  // fn2() {
  //   console.log('fn2 called');
  // }

}


