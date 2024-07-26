import { Component,Input, OnInit, ViewChild, AfterViewChecked, ElementRef, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Neo4jDb } from '../../db-service/neo4j-db.service';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';

@Component({
  
  selector: 'project-about-modal-component',
  templateUrl: './project-about-modal-component.html',
  styleUrls: ['./project-about-modal-component.css']
})

export class ProjectAboutModalComponent implements OnInit, AfterViewChecked, OnDestroy {
  @Input() modalConfig: any;
  @ViewChild('closeBtn', { static: false }) closeBtnRef: ElementRef;
  projectName: string;
  githubUrl: string;
  jiraUrl: string;
  statistic:any;


  constructor(public activeModal: NgbActiveModal, private http: HttpClient) { }

  ngOnInit() {
    this.statistic =this.modalConfig;
    if( window.location.hostname === "saa.cs.bilkent.edu.tr"){
      this.projectName = "Any23";
      this.githubUrl = "https://github.com/apache/any23";
      this.jiraUrl = "https://issues.apache.org/jira/projects/ANY23";
    }else{
      let url =`http://${window.location.hostname}:4445/getAuthentication`;
      this.http.get(url).subscribe(data => {
        if (data) {
          this.projectName = data["github"]["github_repo"];
          this.githubUrl = "https://github.com/" + data["github"]["github_repo"];
          this.jiraUrl = data["jira"]["jira_url"] + "/projects/" + data["jira"]["jira_key"];
        }
      });
    }

  }
  ngAfterViewChecked() {
    this.closeBtnRef.nativeElement.blur();
  }

  ngOnDestroy(): void {
  }
}
