import { Component, OnInit } from '@angular/core';
import { GlobalVariableService } from '../../../../visuall/global-variable.service';
import { Observable } from 'rxjs';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Neo4jDb } from '../../../../visuall/db-service/neo4j-db.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalContentComponent } from '../modal-content/modal-content.component';
import { BehaviorSubject } from 'rxjs';
import { DeveloperCommitsComponent } from '../../../analyses/developer-commits/developer-commits.component';
import { CommentContributorsComponent } from '../../../analyses/comment-contributors/comment-contributors.component';
import { ReviewerRecommendationComponent } from '../../../analyses/reviewer-recommendation/reviewer-recommendation.component';
import { ExpertRecommendationComponent } from '../../../analyses/expert-recommendation/expert-recommendation.component';
import { CollaboratorsComponent } from '../../../analyses/collaborators/collaborators.component';
import { CommentCollaboratorsComponent } from '../../../analyses/comment-collaborators/comment-collaborators.component';
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
    /*
    this.developerQueries = [
      { component: DeveloperCommitsComponent, text: 'Get Commits' },
      { component: CollaboratorsComponent, text: 'Get Collaborators' },
      { component: CommentCollaboratorsComponent, text: 'Get Comment Only Collaborators' },
    ];
    this.prQueries = [
      { component: ReviewerRecommendationComponent, text: 'Get Recommended Reviewers' },
    ]; 
    this.fileQueries = [
      { component: ExpertRecommendationComponent, text: 'Get Experts' },
    ];    
    this.issueQueries = [
      { component: CommentContributorsComponent, text: 'Get Comment Contributors' },
    ];  
    this.commitQueries = [
    ];  
    */
    this.developerQueries = [
      { component: DeveloperCommitsComponent, text: 'Get Commits' }]
    this.prQueries = [
      { component: ReviewerRecommendationComponent, text: 'Get Recommended Reviewers' },
    ]; 
    this.fileQueries = [
      { component: ExpertRecommendationComponent, text: 'Get Experts' },
    ];    
    this.issueQueries = [];  
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
