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
    this.http.get(`http://${window.location.hostname}:4445/getAuthentication`).subscribe(data => {
      if (data) {
        this.projectName = data["github_repo"];
        this.githubUrl = "https://github.com/" + data["github_repo"];
        this.jiraUrl = data["jira_url"] + "/projects/" + data["jira_key"];
      }
    });
  }
  ngAfterViewChecked() {
    this.closeBtnRef.nativeElement.blur();
  }

  ngOnDestroy(): void {
  }
}
