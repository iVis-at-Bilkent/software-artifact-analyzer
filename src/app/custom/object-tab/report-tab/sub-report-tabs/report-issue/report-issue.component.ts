import { Component, OnInit } from '@angular/core';
import { GlobalVariableService } from '../../../../../visuall/global-variable.service';
import { Observable } from 'rxjs';
import { DbResponseType } from 'src/app/visuall/db-service/data-types';
import { HttpClient } from '@angular/common/http';
import { Neo4jDb } from '../../../../../visuall/db-service/neo4j-db.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalContentComponent } from '../../../modal-content/modal-content.component';

interface Attachment {
  name: string;
  data: any,
  type: string;
}
 
interface BoolSetting {
  isEnable: boolean;
  text: string;
  name: string;
}

@Component({
  selector: 'app-report-issue',
  templateUrl: './report-issue.component.html',
  styleUrls: ['./report-issue.component.css']
})
export class ReportIssueComponent implements OnInit {
  key:string;
  commentInput: any = {
    addGraph: false,  addAnomaly: false
  };
  addMenu: any[];
  dataURL: string="";
  attachments: Attachment[] = [];
  authentication: any;
  imageUrl: string;
  comment: any;
  anomalies: BoolSetting[];
  number_of_anomalies: number = 0;
  anomalyModal: boolean = true;

  constructor(public _dbService: Neo4jDb, private _g: GlobalVariableService, private http: HttpClient, private modalService: NgbModal) {}

  ngOnInit(): void {
    this.key = this._g.cy.$(':selected')[0]._private.data.name;
    this.comment = {
      header:"",
      body : "",
    }
    this.anomalies = [
      { text: 'Unassigned Bugs', isEnable: true, name: "Unassigned issue" },
      { text: 'No Link to Bug-Fixing Commit', isEnable: true, name: "No link to bug fixing commit or pull request" },
      { text: 'Ignored Bugs', isEnable: true, name: "Ignored bug" },
      { text: 'Missing Priority', isEnable: true, name: "Missing Priority" },
      { text: 'Missing Environment Information', isEnable: true, name: "Missing Environment Information" },
      { text: 'No comment bugs', isEnable: true, name: "No comment on issue" },
      { text: 'Non-Assignee Resolver of Bug', isEnable: true, name: "No assignee resolver" },
      { text: 'Closed-Reopen Ping Pong', isEnable: true, name: "Closed reopen ping pong" },
      { text: 'Reassignment of Bug Assignee', isEnable: true, name: "Reassignment of Bug Assignee" },
      { text: 'Not Referenced Duplicates', isEnable: true, name: "Not Referenced duplicate" },
      { text: 'Same Resolver Closer', isEnable: true, name: "Same resolver closer" }
    ];   
    this.addMenu = [
      { label: 'Graph', value: this.commentInput.addGraph, function: "addGraph()" },
      { label: 'Anomaly', value: this.commentInput.addAnomaly, function: "addAnomaly()" },
    ]

    this.http.get(`http://${window.location.hostname}:4445/getAuthentication`).subscribe(data => {
      this.authentication = data;
    });

    if(this._g.openReportTab.getValue()){
      this.commentInput={
        addGraph: false,  addAnomaly: true
      };
      this.addMenu = [
        { label: 'Graph', value: this.commentInput.addGraph, function: "addGraph()" },
        { label: 'Anomaly', value: this.commentInput.addAnomaly, function: "addAnomaly()" },
      ]
      this.performSelection();
      
    }
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
  
  addAnomaly() {
    if (!this.commentInput.addAnomaly) {
      this.commentInput.addAnomaly = true;
      this.anomalyModal = true;

    }
    else {
      this.commentInput.addAnomaly = false
      this.anomalyModal = false;
    }
  }

  onCheckboxChange(item: any) {
    this.callFunction(item.function);
  }

  callFunction(functionName: string) {
    switch (functionName) {
      case "addAnomaly()":
        this.addAnomaly();
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
    if (this.commentInput.addAnomaly) {
      let commentAnomaly = "";
      const queries = this.anomalies
        .filter((anomaly) => anomaly.isEnable)
        .map((anomaly) => this.anomalyQ(anomaly.name));
      const queryResults = await Promise.all(queries);
      commentAnomaly = queryResults.join(" ");
      if (this.number_of_anomalies > 0) {
        commentAnomaly = "\nAnomalies: We have detected " + this.number_of_anomalies + " anomaly in the issue " + this.key + "." + commentAnomaly;
      } else {
        commentAnomaly += "\nAnomalies: We have not detected any anomaly in the issue " + this.key + ".";
      }
      this.number_of_anomalies = 0;
      this.comment.body = this.comment.body + commentAnomaly;
    }
  }

  async postComment() {
    if (this.authentication.authenticated) {
      const authenticationString = btoa(`${this.authentication.jira_username}:${this.authentication.jira_token}`);
      let body = {
        "header": this.comment.header,
        "text": this.comment.body.substring(this.comment.body.indexOf("]") + 1),
        "url": `http://${window.location.hostname}:${window.location.port}/?name=${this.key.replace(" ", "%20")}`,
        "issueName": this.key,
        "imgData": this.dataURL ? this.dataURL.split(",")[1] : "",
        "uploadImage": this.commentInput.addGraph
      }
      this.http.post(`http://${window.location.hostname}:4445/sendJiraComment`, body, { headers: { 'Content-Type': 'application/json' } })
        .subscribe(
          (response) => {
            console.info('Confirm request success', response);
            const url = `${this.authentication.jira_url}/browse/${this.key}?focusedCommentId=${response["id"]} `
            this.openModal("issue " + this.key, url, 'report')
          },
          (error) => {
            console.error('Confirm request error:', error);
          }
        );
    }
    else {
      this.openModal("", "", 'error')
    }
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
  async anomalyQ(anomalyName: string): Promise<any> {
    const cql = ` MATCH (issue:Issue {name : '${this.key}'})
    WHERE issue.anomalyList  IS NOT NULL AND '${anomalyName}' IN issue.anomalyList
    RETURN true`
    return await this.runAnomalyQuery(cql, anomalyName);
  }


  async runAnomalyQuery(cql: string, name: string) {
    return new Promise((resolve, reject) => {
      const cb = (x) => {
        const result = x.data[0]
        if (result && result[0]) {
          this.number_of_anomalies += 1
          if (name == "Ignored bug:") {
            const startDateString = result[1].slice(0, 10);
            const endDateString = result[2].slice(0, 10);
            resolve(`\nAnomaly Found:Ignored bug: From ${startDateString} To ${endDateString}`);
          }
          else if (name == "No assignee resolver:") {
            resolve(`\nNo assignee resolver: Assignee ${result[1]} Resolver ${result[0]}`);
          }
          else {
            resolve("\nAnomaly Found: " + name);
          }
        }
        else {
          resolve("");
        }
      };
      this._dbService.runQuery(cql, cb, DbResponseType.table);
    });
  }

}
