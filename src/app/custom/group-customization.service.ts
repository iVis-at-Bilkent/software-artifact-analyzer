import { Injectable } from '@angular/core';
import { CytoscapeService } from '../visuall/cytoscape.service';
import { GlobalVariableService } from '../visuall/global-variable.service';
import { GroupingOptionTypes } from '../visuall/user-preference';

@Injectable({
  providedIn: 'root'
})
export class GroupCustomizationService {
  private _clusteringMethods: { name: string, fn: any }[];
  get clusteringMethods(): { name: string, fn: any }[] {
    return this._clusteringMethods;
  }

  constructor(private _g: GlobalVariableService, private _cyService: CytoscapeService) {
    this._clusteringMethods = [{ name: 'By developer', fn: () => { this.clusterByDeveloper(); } }];
  }
  
  clusterByDeveloper(ids?: any[]) {
    let developerEdges = [];
    this._g.cy.edges().filter(':visible').forEach(element => {
      if(element._private.source._private.classes.values().next().value=='Developer'){
        if(ids != null){
          if(ids.includes(element._private.source._private.data.id)){
            developerEdges.push(element)
          }
        }else{
          developerEdges.push(element)
        }
        
      }
    });
    let developerIds = new Set<string>();
    let commit2developer = {};
    for (let i = 0; i < developerEdges.length; i++) {
      let edgeData = developerEdges[i].data();
      developerIds.add(edgeData.source);
      if (commit2developer[edgeData.target]) {
        commit2developer[edgeData.target].push(edgeData.source);
      } else {
        commit2developer[edgeData.target] = [edgeData.source];
      }
    }

    if (this._g.userPrefs.groupingOption.getValue() == GroupingOptionTypes.compound) {
      // add parent nodes
      for (let id of developerIds) {
        let name = this._g.cy.elements(`[id = "${id}"]`).data().id;
        // for each developer, generate a compound node
        this._cyService.addParentNode(name);
        // add the developer to the compound node
        this._g.cy.elements(`[id = "${id}"]`).move({ parent: 'c' + id });
      }

      // assign nodes to parents
      for (let [k, v] of Object.entries(commit2developer)) {
        // if a artifact has less than 2 developer add, those artifacts to the cluster of developer
          // add developer to the compound node
          if (v['length'] < 2) {
            this._g.cy.elements(`[id = "${k}"]`).move({ parent: 'c' + v[0] });
          }
          
      }
    } else {
      const clusters = {};
      for (let id of developerIds) {
        clusters[id] = [id];
      }
      for (let [k, v] of Object.entries(developerIds)) {
        // if a artifact has less than 2 developer add, those artifacts to the cluster of developer
        if (v['length'] < 2) {
          clusters[v[0]].push(k);
        }
      }
      this._g.layout.clusters = Object.values(clusters);
    }
  }
}
