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
  selector: 'app-report-commit',
  templateUrl: './report-commit.component.html',
  styleUrls: ['./report-commit.component.css']
})
export class ReportCommitComponent implements OnInit {
  key: string;
  pr_key: string;
  prs: string[];
  commentInput: any = {
    addGraph: false
  };
  addMenu: any[];
  dataURL: string = "";
  attachments: Attachment[] = [];

  githubHttpOptions: any; 
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
    this._dbService.runQuery(`MATCH (n:PullRequest) RETURN distinct n.name`, (x) => this.fillPr(x), DbResponseType.table);
    this.addMenu = [
      { label: 'Graph', value: this.commentInput.addGraph, function: "addGraph()" },
    ]

    this.http.get(`http://${window.location.hostname}:4445/getAuthentication`).subscribe(data => {
      this.authentication = data;
      this.githubHttpOptions = {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${this.authentication.github.access_token}`,
          'Accept': 'application/vnd.github.v3+json'
        })
      };
    });
  }
  fillPr(data) {
    this.prs = [];
    for (let i = 0; i < data.data.length; i++) {
      this.prs.push(data.data[i][0]);
    }
  }

  onSelectChange(){
    this.comment.header = "Report Commit " + this.key + " ";
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
  onCheckboxChange(item: any) {
    this.callFunction(item.function);
  }

  callFunction(functionName: string) {
    switch (functionName) {
      case "addGraph()":
        this.addGraph();
        break;
    }
  }

  async performSelection() {
    this.comment.body = "[You can inspect artifact " + this.key + " from this link](http://" + window.location.hostname + ":" + window.location.port + "/?name=" + this.key + ")\n";
    if (this.commentInput.addGraph) {
      this.saveAsPng(false);
    }
  }

  async postComment() {
    if (this.authentication.authenticated) {
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
          this.openModal("Pull Request" + this.pr_key, response["html_url"], 'report')
        }, error => {
          console.error('Error posting comment:', error);
        });
      }
    } else {
      this.openModal("", "", 'error')
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

}
