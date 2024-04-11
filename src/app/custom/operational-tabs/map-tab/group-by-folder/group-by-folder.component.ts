import { Component, OnInit } from '@angular/core';
import { Injectable } from '@angular/core';
import { CytoscapeService } from '../../../../visuall/cytoscape.service';
import { GlobalVariableService } from '../../../../visuall/global-variable.service';
import { GroupingOptionTypes } from '../../../../visuall/user-preference';
import { GraphResponse, GraphElem, CyEdge, CyNode } from '../../../../visuall/db-service/data-types';

@Component({
  selector: 'app-group-by-folder',
  templateUrl: './group-by-folder.component.html',
  styleUrls: ['./group-by-folder.component.css']
})
export class GroupByFolderComponent implements OnInit {
  number: number = 1;
  constructor(private _g: GlobalVariableService, private _cyService: CytoscapeService) { }

  ngOnInit(): void {
  }

  getFolderAtPathLevel(filePath: string, level: number): string | undefined {
    const segments = filePath.split('/');

    // Ensure the level is within the valid range
    if (level >= 0 && level < segments.length) {
      return segments.slice(0, level).join('/');
    } else {
      return segments.slice(0, segments.length).join('/');
    }
  }

  clusterByFolder() {
    this._cyService.expandAllCompounds();
    this._g.viewUtils.show(this._g.cy.$());
    this._cyService.deleteClusteringNodes();
    this._g.performLayout(false);
    const folderNames = []
    const clusters = {}
    this._g.cy.nodes().filter((node) => {
      if (node.classes().includes("File")) {
        const filePath = node._private.data.name;
        const folderAtPathLevel = this.getFolderAtPathLevel(filePath, this.number);
        console.log(folderAtPathLevel)
        if (!folderNames.includes(folderAtPathLevel)) {
          folderNames.push(folderAtPathLevel)
          clusters[folderAtPathLevel] = [];
          this._cyService.addParentNode(folderAtPathLevel);
        }
        this._g.cy.elements(`[id = "${node.id()}"]`).move({ parent: 'c' + folderAtPathLevel });

        clusters[folderAtPathLevel].push(...this._g.cy.elements(`[id = "${node.id()}"]`)[0]._private.edges);
      }
    });
    this._cyService.collapseNodes()
    this._cyService.collapseMultiEdges(this._g.cy.edges())
    /*
    console.log(this._g.cy.nodes())
    for (const folderName in clusters) {
      if (clusters.hasOwnProperty(folderName)) {
        const edges = clusters[folderName];
        instance.collapseEdges(edges)
      }
    }
    */
    /*
    this._g.cy.style().selector('edge.' + 'cy-expand-collapse-collapsed-edge')
    .style({
      'label': (e) => {
        return '(' + e.data('collapsedEdges').length + ')';
      },
      'width': (e) => {
        let n = e.data('collapsedEdges').length;
        return (3 + Math.log2(n)) + 'px';
      },
      'line-color': this.setColor4CompoundEdge.bind(this),
      'target-arrow-color': this.setColor4CompoundEdge.bind(this),
      'target-arrow-shape': this.setTargetArrowShape.bind(this),
    }).update();
    */
    console.log(this._g.cy.nodes())
    console.log(document.getElementById("cbk-flag-display-node-labels"))
    let collapsedEdges = this._g.cy.data("COMMITTED");
    console.log(collapsedEdges)
   

  }
}
