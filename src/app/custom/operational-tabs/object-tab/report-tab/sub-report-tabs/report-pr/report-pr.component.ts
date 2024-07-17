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
  selector: 'app-report-pr',
  templateUrl: './report-pr.component.html',
  styleUrls: ['./report-pr.component.css']
})
export class ReportPrComponent implements OnInit {
  key:string;
  commentInput: any = {
    addGraph: false, addReviewer: false
  };
  addMenu: any[];
  dataURL: string="";
  attachments: Attachment[] = [];
  reviewerData: any[] = [];
  githubHttpOptions: any; //Github rest api header
  sha_github: string = "";
  authentication: any;
  imageUrl: string;
  comment: any;

  constructor(public _dbService: Neo4jDb, private _g: GlobalVariableService, private http: HttpClient, private modalService: NgbModal) {}

  ngOnInit(): void {
    this.key = this._g.cy.$(':selected')[0]._private.data.name;
    this.comment = {
      header:"",
      body : "",
    }
    
    this.addMenu = [
      { label: 'Graph', value: this.commentInput.addGraph, function: "addGraph()" },
      { label: 'Reviewer Recommendation ', value: this.commentInput.addReviewer, function: "addReviewer()" },
    ]
    let url = window.location.hostname == "saa.cs.bilkent.edu.tr" ? 
    "http://saa.cs.bilkent.edu.tr/api/getAuthentication" : 
    `http://${window.location.hostname}:4445/getAuthentication`;
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

  addReviewer() {
    if (!this.commentInput.addReviewer) {
      this.commentInput.addReviewer = true;

    }
    else {
      this.commentInput.addReviewer = false
    }
  }

  onCheckboxChange(item: any) {
    this.callFunction(item.function);
  }

  callFunction(functionName: string) {
    switch (functionName) {
      case "addReviewer()":
        this.addReviewer();
        break;
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
    if (this.commentInput.addReviewer) {
      const cb = (x) => {
        this.reviewerData = x.data;
        let recommendation = '';
        if(x.data[0][1].length>0){
          recommendation += 'Recommended developers are;\n';
          x.data[0][1].forEach((developer, index) => {
            recommendation += `@${developer.replace(' ', '')} with score ${x.data[0][2][index].toFixed(2)}\n`
          });
        }
        else{
          recommendation += 'There is no recommended reviewer.\n';
        }
        this.comment.body = this.comment.body + recommendation;
      }
      const timeMap = this.getTimebarMapping4Java();
      let d1 = this._g.userPrefs.dbQueryTimeRange.start.getValue();
      let d2 = this._g.userPrefs.dbQueryTimeRange.end.getValue();
      if (!this._g.userPrefs.isLimitDbQueries2range.getValue()) {
        d1 = 0;
        d2 = 0;
      }
      let ignoredDevelopers;
      let possibleDevelopers
      let fileIds;
      const inclusionType = this._g.userPrefs.objectInclusionType.getValue();
      const timeout = this._g.userPrefs.dbTimeout.getValue() * 1000;
      
      const cbSub1 = (x) => {
        fileIds = x.data[0][0]
        if (fileIds.length > 0) {
        this._dbService.runQuery(`MATCH (file:File)-[*1..3]-(developer:Developer)
        WHERE elementId(file) IN ['${fileIds.join("','")}'] 
        RETURN COLLECT(DISTINCT elementId(developer)) AS developersList`, cbSub2, DbResponseType.table, false);
        }
      }
      const cbSub2 = (x) => {
        possibleDevelopers = x.data[0][0]
        if (possibleDevelopers.length > 0) {
          this._dbService.runQuery(`MATCH (N:PullRequest{name:'${this.key}'})-[:INCLUDES]-(c:Commit)-[:COMMITTED]-(d:Developer) 
          WITH collect(distinct elementId(d)) AS ignoreDevs return ignoreDevs`, cbSub3, DbResponseType.table, false);
        }
      }
      const cbSub3 = (x) => {
        let ignoredDevelopers = x.data[0][0]
        possibleDevelopers = possibleDevelopers.filter(dev => !ignoredDevelopers.includes(dev));
        if (possibleDevelopers.length > 0) {
          this._dbService.runQuery(`CALL findNodesWithMostPathBetween(['${fileIds.join("','")}'], ['COMMENTED'],['${possibleDevelopers.join("','")}'],'recency',3,3, false,
       225, 1, null, false, 'score', 0,${timeMap}, ${d1}, ${d2}, ${inclusionType}, ${timeout}, null)`, cb, DbResponseType.table, false);
        }
      }
  
  
      this._dbService.runQuery(`MATCH (N:PullRequest{name:'${this.key}'})-[:INCLUDES]-(c:Commit)-[:CONTAINS]-(f:File) WITH collect(distinct elementId(f)) AS fileIds  RETURN fileIds`, cbSub1, DbResponseType.table, false);





    }
  }

  async postComment() {
    if (this.authentication.authenticated) {
      let commentBody = {
        body: `### ${this.comment.header}\n${this.comment.body}`
      };
      //If add graph is selected
      if (this.commentInput.addGraph) {
        await this.updateFile().subscribe(response => {
          this.imageUrl = response["content"]["download_url"]
          commentBody = {
            body: `### ${this.comment.header}\n${this.comment.body}\n![image](${this.imageUrl})`
          };
          this.http.post(`https://api.github.com/repos/${this.authentication.github.github_repo}/issues/${this.key}/comments`, commentBody, this.githubHttpOptions).subscribe(response => {
            this.openModal("pull request  " + this.key, response["html_url"], 'report')
          }, error => {
            console.error('Error posting comment:', error);
          });
        }, error => {
          console.error('Error updating image:', error);
        });

      }
      else {
        this.http.post(`https://api.github.com/repos/${this.authentication.github.github_repo}/issues/${this.key}/comments`, commentBody, this.githubHttpOptions).subscribe(response => {
          console.log('Comment posted successfully:', response);
          this.openModal("pull request  " + this.key, response["html_url"], 'report')
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

  getTimebarMapping4Java(): string {
    const mapping = this._g.appDescription.getValue().timebarDataMapping;
    let s = '{'
    for (const k in mapping) {
      s += k + ':["' + mapping[k].begin_datetime + '","' + mapping[k].end_datetime + '"],';
    }
    s = s.slice(0, -1);
    s += '}'
    return s;
  }
}
