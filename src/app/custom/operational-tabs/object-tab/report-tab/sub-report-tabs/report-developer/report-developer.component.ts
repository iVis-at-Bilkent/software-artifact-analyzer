import { Component, OnInit } from '@angular/core';
import { GlobalVariableService } from '../../../../../../visuall/global-variable.service';
import { Observable } from 'rxjs';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Neo4jDb } from '../../../../../../visuall/db-service/neo4j-db.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalContentComponent } from '../../../modal-content/modal-content.component';

interface Attachment {
  name: string;
  data: any,
  type: string;
}
@Component({
  selector: 'app-report-developer',
  templateUrl: './report-developer.component.html',
  styleUrls: ['./report-developer.component.css']
})
export class ReportDeveloperComponent implements OnInit {
  key: string;
  pr_key: string;
  issue_key:string;
  prs: string[];
  filteredPrs: string[] = [];
  filteredIssues: string[] = [];
  issues: string[];
  commentInput: any = {
    addGraph: false, addReviewer: false
  };
  addMenu: any[];
  dataURL: string = "";
  attachments: Attachment[] = [];

  githubHttpOptions: any; //Github rest api header
  sha_github: string = "";
  authentication: any;
  imageUrl: string;
  comment: any;
  constructor(public _dbService: Neo4jDb, private _g: GlobalVariableService, private http: HttpClient, private modalService: NgbModal) { }

  ngOnInit(): void {
    this.key = this._g.cy.$(':selected')[0]._private.data.name;
    this.comment = {
      header: "",
      body: "",
    }
    this.addMenu = [
      { label: 'On Pull Request ', value: this.commentInput.addGithub, function: "addGithub()" },
      { label: 'On Issue', value: this.commentInput.addJira, function: "addJira()" },
      { label: 'Graph', value: this.commentInput.addGraph, function: "addGraph()" },
    ]
    if( window.location.hostname === "saa.cs.bilkent.edu.tr"){
      this.authentication = null;
      this.githubHttpOptions = null

    }else{
      let url =`http://${window.location.hostname}:4445/getAuthentication`;
      this.http.get(url).subscribe(data => {
        this.authentication = data;
        this.githubHttpOptions = {
          headers: new HttpHeaders({
            'Authorization': `Bearer ${this.authentication.github.access_token}`,
            'Accept': 'application/vnd.github.v3+json'
          })
        };
      });
    }
  }
  fillPr(data) {
    this.prs = [];
    for (let i = 0; i < data.data.length; i++) {
      this.prs.push(data.data[i][0]);
    }
    this.filteredPrs = this.prs.slice();
  }
  fillIssues(data) {
    this.issues = [];
    for (let i = 0; i < data.data.length; i++) {
      this.issues.push(data.data[i][0]);
    }
    this.filteredIssues = this.issues.slice();
  }

  filterOptionsPr(value: string) {
    this.filteredPrs = this.prs.filter(pr =>
      pr.toLowerCase().includes(value)
    );
  }

  filterOptionsIssue(value: string) {
    this.filteredIssues = this.issues.filter(issue =>
      issue.toLowerCase().includes(value.toLowerCase())
    );
  }

  addGraph() {
    if (!this.commentInput.addGraph) {
      this.commentInput.addGraph = true;
    }
    else {
      this.commentInput.addGraph = false
      this.dataURL = ""
      this.attachments = []
    }
  }
  addJira() {
    if (!this.commentInput.addJira) {
      this.commentInput.addJira = true
      this._dbService.runQuery(`MATCH (n:Issue) RETURN distinct n.name`, (x) => this.fillIssues(x), DbResponseType.table);

    }
    else {
      this.commentInput.addJira = false
    }

  }
  addGithub() {
    if (!this.commentInput.addGithub) {
      this.commentInput.addGithub = true;
      this._dbService.runQuery(`MATCH (n:PullRequest) RETURN distinct n.name`, (x) => this.fillPr(x), DbResponseType.table);
    }
    else {
      this.commentInput.addGithub = false
    }

  }
  onCheckboxChange(item: any) {
    this.callFunction(item.function);
  }

  callFunction(functionName: string) {
    switch (functionName) {
      case "addJira()":
        this.addJira();
        break;
      case "addGithub()":
        this.addGithub();
        break;
      case "addGraph()":
        this.addGraph();
        break;
    }
  }

  async performSelection() {
    this.comment.body = "[You can inspect developer " + this.key + " from this link](http://" + window.location.hostname + ":" + window.location.port + "/?name=" +  this.key.replace(" ", "%20") + ")\n";
    if (this.commentInput.addGraph) {
      this.saveAsPng(false);
    }
    if (this.commentInput.addGithub) {
      this.comment.header = "Report  @" + this.key.replace(" ", "") + " ";
      
    }
    if (this.commentInput.addJira) {
      this.comment.header = "Report  @" + this.key.replace(" ", "") + " ";

    }
  }

  async postComment() {
    if (this.authentication && this.authentication.authenticated) {
      if (this.commentInput.addGithub) {
        let commentBody = {
          body: `### ${this.comment.header}\n${this.comment.body}`
        };
        if (this.commentInput.addGraph) {
          await this.updateFile().subscribe(response => {
            console.log('Comment posted successfully:', response);
            this.imageUrl = response["content"]["download_url"]
            commentBody = {
              body: `### ${this.comment.header}\n${this.comment.body}\n![image](${this.imageUrl})`
            };
            this.http.post(`https://api.github.com/repos/${this.authentication.github.github_repo}/issues/${this.pr_key}/comments`, commentBody, this.githubHttpOptions).subscribe(response => {
              this.openModal("Pull Request " + this.pr_key, response["html_url"], 'report')
            }, error => {
              console.error('Error posting comment:', error);
            });
          }, error => {
            console.error('Error updating image:', error);
          });
  
        }
        else {
          this.http.post(`https://api.github.com/repos/${this.authentication.github.github_repo}/issues/${this.pr_key}/comments`, commentBody, this.githubHttpOptions).subscribe(response => {
            console.log('Comment posted successfully:', response);
            this.openModal("Pull Request " + this.pr_key, response["html_url"], 'report')
          }, error => {
            console.error('Error posting comment:', error);
          });
        }
      }
      if (this.commentInput.addJira) {
        let body = {
          "header": this.comment.header,
          "text": this.comment.body.substring(this.comment.body.indexOf("]") + 1),
          "url": `http://${window.location.hostname}:${window.location.port}/?name=${this.key.replace(" ", "%20")}`,
          "issueName": this.issue_key,
          "imgData": this.dataURL ? this.dataURL.split(",")[1] : "",
          "uploadImage": this.commentInput.addGraph
        }
        let url = window.location.hostname == "saa.cs.bilkent.edu.tr" ? 
        "http://saa.cs.bilkent.edu.tr/api/sendJiraComment" : 
        `http://${window.location.hostname}:4445/sendJiraComment`;
        this.http.post(url, body, { headers: { 'Content-Type': 'application/json' } })
          .subscribe(
            (response) => {
              console.info('Confirm request success', response);
              const url = `${this.authentication.jira.jira_url}/browse/${this.issue_key}?focusedCommentId=${response["id"]} `
              this.openModal("issue " + this.issue_key, url, 'report')
            },
            (error) => {
              console.error('Confirm request error:', error);
            }
          );
      }
    } else {
      const modalRef = this.modalService.open(ModalContentComponent);
      modalRef.componentInstance.name = 'Shared Database Demo Restrictions'; // Pass data to the modal component
      modalRef.componentInstance.url = '';
      modalRef.componentInstance.templateType = 'error';
      modalRef.componentInstance.message = "This is a shared database demo version of SAA. Certain functionalities, such as reporting on GitHub and Jira, are disabled.";
      modalRef.componentInstance.title = 'Shared Database Demo Restrictions';
    }
  }

  updateFile(): Observable<any> {
    const filename = `image_${Date.now()}.png`;
    const url = `https://api.github.com/repos/${this.authentication.github.github_repo}/contents/assets/${filename}`;
    const body = {
      message: "Add image",
      content: `${this.dataURL.split(",")[1]}`
    };
    const options = this.githubHttpOptions;
    return this.http.put(url, body, options);
  }

  openModal(name, url, templateType): void {
    const modalRef = this.modalService.open(ModalContentComponent);
    modalRef.componentInstance.name = name; // Pass data to the modal component
    modalRef.componentInstance.url = url;
    modalRef.componentInstance.templateType = templateType;
  }

  async saveAsPng(isWholeGraph: boolean) {
    const options = { bg: 'white', scale: 2, full: isWholeGraph };
    const base64png =this._g.cy.pngFull(options, ['cy-context-menus-cxt-menu','cy-panzoom']);
    const image = new Image();
    image.src = await base64png;
    image.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = image.width / 4;
      canvas.height = image.height / 4;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      this.dataURL = canvas.toDataURL('image/png');
    };
  }

  onItemSelected(item: string) {
    this.pr_key = item;
    console.log('Selected Item:', item);
  }

  
}
