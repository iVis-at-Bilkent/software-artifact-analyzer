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
  generateRedShades() {
    let colors = [];
    colors = [
      "#FF9999", "#fe5050", "#FE0022", "#BC0000", "#9a0000"
    ]
    return colors;
  }
  activateAnomalyCues() {

    const colors = this.generateRedShades()
    this._g.cy.nodes().filter(':visible').forEach(async (element) => {
      if (element._private.classes.values().next().value == 'Issue') {
        const cb = (x) => {
          const div1 = document.createElement("div");
          let number = x.data[0][1];
          if (number > 0) {
            let color = (number <= 5) ? colors[number - 1] : colors[4];
            let listOfAnomalies = x.data[0][0];
            const size_x = 0.60 + 2 * Math.log(3 * listOfAnomalies.length + 1) / 15;
            const size_y = 0.10 + 2 * Math.log(3*listOfAnomalies.length + 1) / 15;
            const font_size = 0.75 + Math.log(3*listOfAnomalies.length + 1) / 15;
            div1.style.backgroundColor = color;
            div1.style.color = "#fff";
            div1.style.fontSize = font_size + 'em';
            div1.style.paddingBottom = size_y +'em';
            div1.style.paddingTop = size_y +'em';
            div1.style.paddingRight = size_x +'em';
            div1.style.paddingLeft = size_x +'em';
            div1.style.borderRadius = '100%';
            div1.innerHTML = `<span  >${number}</span>`;
            if (Object.keys(element.getCueData()).length === 0) {
              element.addCue({
                htmlElem: div1,
                id: element._private.data.name,
                show: "always",
                position: "top-right",
                marginX: "%0",
                marginY: "%8",
                cursor: "pointer",
                zIndex: 1000,
                tooltip: listOfAnomalies.join('\n')
              });
            }
          }
        }
        const cql = `MATCH (n:Issue {name:'${element._private.data.name}'}) RETURN n.anomalyList as anomalyList , n.anomalyCount as anomalyCount`;
        this._dbService.runQuery(cql, cb, DbResponseType.table);
      }
    });
  }
}


