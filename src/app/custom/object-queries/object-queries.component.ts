import { Component, OnInit } from '@angular/core';
import { GlobalVariableService } from '../../visuall/global-variable.service';
import { Observable } from 'rxjs';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Neo4jDb } from '../../visuall/db-service/neo4j-db.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalContentComponent } from './../modal-content/modal-content.component';
import { BehaviorSubject } from 'rxjs';
import { Query1Component } from '../queries/query1/query1.component';
import { Query2Component } from '../queries/query2/query2.component';
import { Query3Component } from '../queries/query3/query3.component';
import { Query4Component } from '../queries/query4/query4.component';
import { Query1Component as CommitsComponent } from '../queries/query1/query1.component'; // Replace with the actual path to your components and the desired aliases
import { Query2Component as StrongCollaboratorsComponent } from '../queries/query2/query2.component';
import { Query3Component as RecommendedReviewersComponent } from'../queries/query3/query3.component';
import { Query4Component as ExpertsComponent } from '../queries/query4/query4.component';
@Component({
  selector: 'app-object-queries',
  templateUrl: './object-queries.component.html',
  styleUrls: ['./object-queries.component.css']
})
export class ObjectQueriesComponent implements OnInit {
  selectedItem = new BehaviorSubject<any>(null);
  selectedIdx: number;
  selectedQuery: string = ""; 
  className: string = ""
  queries: { component: any, text: string }[] =[];
  issueQueries: { component: any, text: string }[] =[];
  developerQueries: { component: any, text: string }[] =[];
  fileQueries: { component: any, text: string }[] =[];
  commitQueries: { component: any, text: string }[] =[];
  prQueries: { component: any, text: string }[] =[];


  constructor(public _dbService: Neo4jDb, private _g: GlobalVariableService, private http: HttpClient,private modalService: NgbModal) {
    this.developerQueries = [
      { component: Query1Component, text: 'Get Commits' },
    ];
    this.prQueries = [
      { component: Query3Component, text: 'Get Recommended Reviewers' },
    ]; 
    this.fileQueries = [
      { component: Query4Component, text: 'Get Experts' },
    ];    
    this.issueQueries = [
      { component: Query2Component, text: 'Get Strong Collaborators' },
    ];  
    this.commitQueries = [
    ];  
    this.selectedIdx = -1;
  }


  changeQuery(event) {
    this.selectedIdx = this.queries.findIndex(x => x.text == event.target.value);
  }

  ngOnInit(): void {
    let name = ""
    setInterval(() => {
      if (this._g.cy.$(':selected')[0]) {
        this.selectedItem.next(this._g.cy.$(':selected')[0]._private.data.name)
        this.className = this._g.cy.$(':selected')[0]._private.classes.values().next().value;
        if (this._g.cy.$(':selected')[0]._private.data.name !== name) {
          if (this.className === "Issue"){
            this.queries = this.issueQueries
          }
          else if (this.className === "Developer"){
            this.queries = this.developerQueries
          }
          else if ( this.className === "PullRequest"){
            this.queries = this.prQueries
          }
          else if ( this.className === "Commit"){
            this.queries = this.commitQueries
          }
          else{
            this.queries = this.fileQueries
          }
  }}}, 500)
  }

}
