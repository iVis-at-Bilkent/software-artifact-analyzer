
import { Component, EventEmitter, OnDestroy, OnInit, Output, ChangeDetectorRef, NgZone } from '@angular/core';
import { GlobalVariableService } from '../../visuall/global-variable.service';
import { Observable } from 'rxjs';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Neo4jDb } from '../../visuall/db-service/neo4j-db.service';
import * as base64js from 'base64-js';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalContentComponent } from './../modal-content/modal-content.component';


interface Attachment {
  name: string;
  data: any,
  type: string;
}
export interface BoolSetting {
  isEnable: boolean;
  text: string;
  path2userPref: () => Promise<any>;
}
@Component({
  selector: 'app-report-component',
  templateUrl: './report-component.component.html',
  styleUrls: ['./report-component.component.css']
})
export class ReportComponentComponent implements OnInit {
  //MENU VARIABLES
  addMenu: any[];
  commentInput: any = {
    addGraph: false, addAnomaly: false, addJira: false, addGithub: false, addReviewer: false
  };
  prs: string[] = []
  issues: string[] = []
  dataURL: string; //Graph screenshot base64
  pr_name: string = "";
  issue_name: string = "";
  comment: string = '';
  comment_header: string;
  className: string = ""

  //RECOMMEND REVIEWER PR
  reviewerData: any[] = [];

  //REPORT ANOMALY VARIABLES
  anomalies: BoolSetting[];
  number_of_anomalies: number = 0;
  anomalyModal: boolean = true;

  //GITHUB  JIRA REST API VARIABLES
  githubHttpOptions: any; //Github rest api header
  sha_github: string = "";
  authentication: any;
  imageUrl: string;
  attachments: Attachment[] = [];



  constructor(public _dbService: Neo4jDb, private _g: GlobalVariableService, private http: HttpClient, private cd: ChangeDetectorRef, private ngZone: NgZone, private modalService: NgbModal) {
    this.anomalies = [
      { text: 'Unassigned Bugs', isEnable: false, path2userPref: this.anomaly1.bind(this) },
      { text: 'No Link to Bug-Fixing Commit', isEnable: false, path2userPref: this.anomaly2.bind(this) },
      { text: 'Ignored Bugs', isEnable: false, path2userPref: this.anomaly3.bind(this) },
      { text: 'Missing Priority', isEnable: false, path2userPref: this.anomaly5.bind(this) },
      { text: 'Missing Environment Information', isEnable: false, path2userPref: this.anomaly6.bind(this) },
      { text: 'No comment bugs', isEnable: false, path2userPref: this.anomaly7.bind(this) },
      { text: 'Non-Assignee Resolver of Bug', isEnable: false, path2userPref: this.anomaly8.bind(this) },
      { text: 'Closed-Reopen Ping Pong', isEnable: false, path2userPref: this.anomaly9.bind(this) },
      { text: 'Not Referenced Duplicates', isEnable: false, path2userPref: this.anomaly10.bind(this) },
      { text: 'Same Resolver Closer', isEnable: false, path2userPref: this.anomaly11.bind(this) }
    ];

  }

  ngOnInit() {
    //Get authentication information from saa configuration flask app
    this.http.get(`http://${window.location.hostname}:4445/getAuthentication`).subscribe(data => {
      this.authentication = data;
      this.githubHttpOptions = {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${this.authentication.github_token}`,
          'Accept': 'application/vnd.github.v3+json'
        })
      };
    });
    this._dbService.runQuery(`MATCH (n:PullRequest) RETURN distinct n.name`, (x) => this.fillPr(x), DbResponseType.table);
    this._dbService.runQuery(`MATCH (n:Issue) RETURN distinct n.name`, (x) => this.fillIssues(x), DbResponseType.table);
    let name = ""
    let reported = false;
    setInterval(() => {
      reported = false;
      if (this._g.cy.$(':selected')[0]) {
        this.className = this._g.cy.$(':selected')[0]._private.classes.values().next().value;
        if (this._g.cy.$(':selected')[0]._private.data.name != name) {

          this.anomalies
            .map((anomaly) => anomaly.isEnable = false);
          this.comment = ""
          this.dataURL = ""
          this.pr_name = ""
          this.comment_header = ""
          name = this._g.cy.$(':selected')[0]._private.data.name
          if (this.className == "Issue") {
            const link = "You can inspect artifact " + name + " from this [ link|http://" + window.location.hostname + ":" + window.location.port + "/?name=" + name + "]";
            this.comment = link + "\n" + this.comment
          }
          else {
            const link = "[You can inspect artifact " + name + " from this link](http://" + window.location.hostname + ":" + window.location.port + "/?name=" + name + ")";
            this.comment = link + "\n" + this.comment
          }
          this.commentInput = {
            addGraph: false,
            addAnomaly: false,
            addJira: false,
            addGithub: false,
            addReviewer: false,
          };
          reported = true;
        }

        if (this.className == "Issue") {
          this.addMenu = [
            { label: 'Graph', value: this.commentInput.addGraph, function: "addGraph()" },
            { label: 'Anomaly', value: this.commentInput.addAnomaly, function: "addAnomaly()" },
          ]
        }
        else if (this.className == "Commit") {
          this.addMenu = [
            { label: 'On Pull Request ', value: this.commentInput.addGithub, function: "addGithub()" },
            { label: 'Graph', value: this.commentInput.addGraph, function: "addGraph()" },
          ]
        }
        else if (this.className == "PullRequest") {
          this.addMenu = [
            { label: 'Graph', value: this.commentInput.addGraph, function: "addGraph()" },
            { label: 'Reviewer Recommendation ', value: this.commentInput.addReviewer, function: "addReviewer()" },
          ]

        }
        else if (this.className == "File") {
          this.addMenu = [
            { label: 'On Pull Request ', value: this.commentInput.addGithub, function: "addGithub()" },
            { label: 'Graph', value: this.commentInput.addGraph, function: "addGraph()" },
          ]

        } else if (this.className == "Developer") {
          this.addMenu = [
            { label: 'On Pull Request ', value: this.commentInput.addGithub, function: "addGithub()" },
            { label: 'On Issue', value: this.commentInput.addJira, function: "addJira()" },
            { label: 'Graph', value: this.commentInput.addGraph, function: "addGraph()" },
          ]
        }
        else {
          this.addMenu = [
            { label: 'Graph', value: this.commentInput.addGraph, function: "addGraph()" },
          ]
        }

      }

    }, 500)

    setInterval(() => {
      this._g.openReportTab.subscribe((isOpen) => {

        if (isOpen == true && reported) {
          this.reportAnomaly()
        }
      });
    }, 500);



  }
  openModal(name, url): void {
    const modalRef = this.modalService.open(ModalContentComponent);
    modalRef.componentInstance.name = name; // Pass data to the modal component
    modalRef.componentInstance.url = url; // Pass data to the modal component
  }
  fillPr(data) {
    this.prs = [];
    for (let i = 0; i < data.data.length; i++) {
      this.prs.push(data.data[i][0]);
    }
  }
  fillIssues(data) {
    this.issues = [];
    for (let i = 0; i < data.data.length; i++) {
      this.issues.push(data.data[i][0]);
    }
  }

  //Jira Issue Post Comment
  async postCommentIssue(issueKey: string) {
    const authenticationString = btoa(`${this.authentication.jira_username}:${this.authentication.jira_token}`);
    let body = {
      "header": this.comment_header,
      "text": this.comment.substring(this.comment.indexOf("]") + 1),
      "url":"http://" + window.location.hostname + ":" + window.location.port + "/?name=" + this._g.cy.$(':selected')[0]._private.data.name,
      "issueName": issueKey,
      "imgData": this.dataURL?this.dataURL.split(",")[1]:"",
      "uploadImage": this.commentInput.addGraph
    }
    this.http.post(`http://${window.location.hostname}:4445/sendJiraComment`, body, { headers: { 'Content-Type': 'application/json' } })
      .subscribe(
        (response) => {
          console.info('Confirm request success',response);
          const url = `${this.authentication.jira_url}/browse/${issueKey}?focusedCommentId=${response["id"]} `
          this.openModal("issue " + issueKey, url)
        },
        (error) => {
          console.error('Confirm request error:', error);
        }
      );
  }

  updateFile(): Observable<any> {
    const filename = `image_${Date.now()}.png`;
    const url = `https://api.github.com/repos/${this.authentication.github_repo}/contents/assets/${filename}`;
    const body = {
      message: "Add image",
      content: `${this.dataURL.split(",")[1]}`
    };
    const options = this.githubHttpOptions;
    return this.http.put(url, body, options);
  }
  //Github PullRequest Post Comment To Pull Request
  async postCommentPr(prKey: string) {
    let  commentBody = {
      body: `### ${this.comment_header}\n${this.comment}`
    };

    //If add graph is selected
    if (this.commentInput.addGraph) {
        await this.updateFile().subscribe(response => {
          console.log('Comment posted successfully:', response);
          this.imageUrl = response["content"]["download_url"]
          commentBody = {
            body: `### ${this.comment_header}\n${this.comment}\n![image](${ this.imageUrl })`
          };
          this.http.post(`https://api.github.com/repos/${this.authentication.github_repo}/issues/${prKey}/comments`, commentBody, this.githubHttpOptions).subscribe(response => {
            console.log('Comment posted successfully:', response);
            this.openModal("pull request  " + prKey, response["html_url"])
          }, error => {
            console.error('Error posting comment:', error);
          });
        }, error => {
          console.error('Error updating image:', error);
        });

    }
    else {
      this.http.post(`https://api.github.com/repos/${this.authentication.github_repo}/issues/${prKey}/comments`, commentBody, this.githubHttpOptions).subscribe(response => {
        console.log('Comment posted successfully:', response);
        this.openModal("pull request  " + prKey, response["html_url"])
      }, error => {
        console.error('Error posting comment:', error);
      });
    }


  }

  async postCommentCommit(commitKey: string) {
    let commentBody = {
      body: "### " + this.comment_header + "\n" + this.comment
    };
    if (this.commentInput.addGraph) {
        await this.updateFile().subscribe(response => {
          console.log('Comment posted successfully:', response);
          this.imageUrl = response["content"]["download_url"]
          commentBody = {
            body: `###${this.comment_header}\n${this.comment}\n![image](${ this.imageUrl })`
          };
          this.http.post(`https://api.github.com/repos/${this.authentication.github_repo}/commits/${commitKey}/comments`, commentBody, this.githubHttpOptions).subscribe(response => {
            console.log('Comment posted successfully:', response);
            this.openModal("commit  " + commitKey, response["html_url"])
          }, error => {
            console.error('Error posting comment:', error);
          });
        }, error => {
          console.error('Error updating image:', error);
        });
    }

    else {
      this.http.post(`https://api.github.com/repos/${this.authentication.github_repo}/commits/${commitKey}/comments`, commentBody, this.githubHttpOptions).subscribe(response => {
        console.log('Comment posted successfully:', response);
        this.openModal("commit  " + commitKey, response["html_url"])
      }, error => {
        console.error('Error posting comment:', error);
      });
    }
  }

  onAddComment() {
    if (this.className == "Issue") {
      let issueKey = this._g.cy.$(':selected')[0]._private.data.name
      this.postCommentIssue(issueKey)
    }
    else if (this.className == "Commit") {
      let commitKey = this._g.cy.$(':selected')[0]._private.data.name
      //this.postCommentCommit(commitKey)
      if (this.commentInput.addGithub) {
        this.postCommentPr(this.pr_name)
      }
      else {
        this.postCommentCommit(commitKey)
      }
    }
    else if (this.className == "PullRequest") {
      let prKey = this._g.cy.$(':selected')[0]._private.data.name
      this.postCommentPr(prKey)
    }
    else if (this.className == "File") {
      if (this.commentInput.addGithub) {
        this.postCommentPr(this.pr_name)
      }
    }
    else if (this.className == "Developer") {
      if (this.commentInput.addGithub) {
        this.postCommentPr(this.pr_name)
      }
      if (this.commentInput.addJira) {
        this.postCommentIssue(this.issue_name)
      }
    }
    else {
      alert("Please choose a node first")
    }


  }

  updateCommentInput() {
    this.commentInput = {
      addGraph: false,
      addAnomaly: false,
      addJira: false,
      addGithub: false,
      addReviewer: false,
    };
  }



  settingChanged(val: any) {

  }
  onCheckboxChange(item: any) {
    this.callFunction(item.function);
  }
  callFunction(functionName: string) {
    switch (functionName) {
      case "addGraph()":
        this.addGraph();
        break;
      case "addReviewer()":
        this.addReviewer();
        break;
      case "addAnomaly()":
        this.addAnomaly();
        break;
      case "addJira()":
        this.addJira();
        break;
      case "addGithub()":
        this.addGithub();
        break;
    }
  }




  saveAsPng(isWholeGraph: boolean) {
    const options = { bg: 'white', scale: 2, full: isWholeGraph };
    const base64png: string = this._g.cy.png(options);
    const image = new Image();
    image.src = base64png;
    image.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = image.width/4;
      canvas.height = image.height/4;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      this.dataURL = canvas.toDataURL('image/png');
    };
  }
  // Convert base64 image data to binary
  base64ToBinary(base64Data) {
    const binaryData = atob(base64Data);
    const len = binaryData.length;
    const buffer = new ArrayBuffer(len);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < len; i++) {
      view[i] = binaryData.charCodeAt(i);
    }
    return buffer;
  }

  // Convert base64 image data to binary image
  base64ToBinaryImage(base64Data) {
    const binaryData = this.base64ToBinary(base64Data);
    const blob = new Blob([binaryData], { type: 'image/png' });
    return blob;
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

  closeClicked() {
    this.anomalyModal = false;
  }

  addJira() {
    if (!this.commentInput.addJira) {
      this.commentInput.addJira = true

    }
    else {
      this.commentInput.addJira = false
    }

  }
  addGithub() {
    if (!this.commentInput.addGithub) {
      this.commentInput.addGithub = true;

      /*
      const developer_name = this._g.cy.$(':selected')[0]._private.data.name
      const pull_request_name = this.pr_name
      this.comment_header = "Report  " + developer_name + " "
      */

    }
    else {
      this.commentInput.addGithub = false
    }

  }

  showObjectProps() {
    let selected = this._g.cy.$(':selected');
  }
  async anomaly11(): Promise<any> {
    const count = this._g.userPrefs?.anomalyDefaultValues?.reopenCount.getValue() || 1;
    const cql = ` MATCH (n:Developer)-[r]->(issue:Issue)
    WHERE issue.resolver= n.name and issue.closer = n.name and issue.name = '${this.issue_name}'
    WITH count(n) AS count
    RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, "Same resolver closer");
  }
  async anomaly10(): Promise<any> {
    const count = this._g.userPrefs?.anomalyDefaultValues?.reopenCount.getValue() || 1;
    const cql = `MATCH (n:Issue)  WHERE n.duplicate='True' 
    AND NOT (n)-[:DUPLICATES]-() and  n.name = '${this.issue_name}'
    WITH count(n) AS count
    RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, "Not Referenced duplicates");
  }
  async anomaly9(): Promise<any> {
    const count = this._g.userPrefs?.anomalyDefaultValues?.reopenCount.getValue() || 1;
    const cql = ` MATCH (n:Issue) 
    WHERE n.reopenCount>=${count} and  n.name = '${this.issue_name}'
    WITH count(n) AS count
    RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, "Closed reopen ping pong");
  }


  async anomaly8(): Promise<any> {
    const cql = `MATCH (n:Issue)
    WHERE EXISTS(n.assignee) AND EXISTS(n.resolver) AND  EXISTS(n.assignee) AND  EXISTS(n.resolver) and  n.name = '${this.issue_name}'
    WITH n, n.assignee AS assignee, n.resolver AS resolver
    WHERE assignee <> resolver  
    WITH count(n) AS count,assignee,resolver
    RETURN CASE WHEN count = 0 THEN false ELSE true END, assignee, resolver`;
    return await this.runAnomalyQuery(cql, "No assignee resolver:");

  }


  async anomaly7(): Promise<any> {
    const cql = `MATCH (n:Issue{status:'Done'})
    WHERE size(n.comments) = 0  and  n.name = '${this.issue_name}'
    WITH count(n) AS count
    RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, "No comment on issue");
  }
  async anomaly6(): Promise<any> {
    const cql = `MATCH (n) 
    WHERE NOT  EXISTS(n.environment) and n.affectedVersion = '' and  n.name = '${this.issue_name}'
    WITH count(n) AS count
    RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, 'Missing Environment Information');

  }
  async anomaly5(): Promise<any> {
    const cql = ` MATCH (n:Issue) WHERE n.priority  is NULL   and  n.name = '${this.issue_name}'
    WITH count(n) AS count
     RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, 'Missing Priority');

  }



  async anomaly3(): Promise<any> {
    const time = this._g.userPrefs?.anomalyDefaultValues?.ignoreBug.getValue() || 1;
    const cql = `MATCH (n:Issue)
    WHERE exists(n.history) AND size(n.history) >= 2 and n.name = '${this.issue_name}'
    WITH n, range(0, size(n.history)-2) as index_range
    UNWIND index_range as i
    WITH n, i, datetime(n.history[i]) as from, datetime(n.history[i+1]) as to
    WHERE duration.between(from, to).months > ${time} 
    WITH  from, to, count(n) AS count
    RETURN CASE WHEN count = 0 THEN false ELSE true  END, from, to`;
    return await this.runAnomalyQuery(cql, `Ignored bug:`);
  }

  async anomaly2(): Promise<any> {
    const cql = `MATCH (n:Issue{status:'Done' })
    WHERE NOT (n)-[:REFERENCES]->() and n.commitIds=[] and n.name = '${this.issue_name}'
    WITH count(n) AS count
    RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, "No link to bug fixing commit or pull request");

  }

  async anomaly1(): Promise<any> {
    const cql = `MATCH (n:Issue {status: 'Done'})
      WHERE NOT EXISTS(n.assignee) AND n.name = '${this.issue_name}'
      WITH count(n) AS count
      RETURN CASE WHEN count = 0 THEN false ELSE true END`;
    return await this.runAnomalyQuery(cql, "Unassigned issue");
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
  async performSelection() {
    const prKey = this.commentInput.addGithub ? this.pr_name : this._g.cy.$(':selected')[0]._private.data.name;
    this.comment = "[You can inspect artifact " +  this._g.cy.$(':selected')[0]._private.data.name + " from this link](http://" + window.location.hostname + ":" + window.location.port + "/?name=" +  this._g.cy.$(':selected')[0]._private.data.name + ")\n";
    if (this.commentInput.addGithub) {
      if(this._g.cy.$(':selected')[0]._private.classes.values().next().value == "Developer"){
        const developer_name = this._g.cy.$(':selected')[0]._private.data.name
        const pull_request_name = this.pr_name
        this.comment_header = "Report  @" + developer_name.replace(" ", "") + " "
      }
      else if(this._g.cy.$(':selected')[0]._private.classes.values().next().value == "Commit"){
        const commit_name = this._g.cy.$(':selected')[0]._private.data.name
        const pull_request_name = this.pr_name
        this.comment_header = "Report  Commit " + commit_name + " "
      }else{
        const file_name = this._g.cy.$(':selected')[0]._private.data.name
        const pull_request_name = this.pr_name
        this.comment_header = "Report  File " + file_name + " "       
      }


    }
    if (this.commentInput.addJira) {
      const developer_name = this._g.cy.$(':selected')[0]._private.data.name
      this.comment_header = "Report  @" + developer_name + " "
    }    
    if (this.commentInput.addGraph) {
      this.saveAsPng(true);
    }
    if (this.commentInput.addReviewer) {
      const cb = (x) => {
        this.reviewerData = x.data;
        this.commentInput.addReviewer = true;
        let recomendation = '';
        // Generate table header
        recomendation += 'Recommended developers are;\n';
        // Generate table body
        x.data.forEach(data => {
          if (data[1] != "") {
            recomendation += `@${data[1].replace(' ', '')} with score ${data[0]}\n`
          }
        });
        this.comment = this.comment + recomendation
        this.commentInput.addReviewer = true

      }
      const cql = ` MATCH (pr:PullRequest{name:'${prKey}'})-[*]->(file:File)
      MATCH (dp:Developer)-[]-(Commit)-[]-(pr:PullRequest {name:'${prKey}'})
      with collect(file.name) as filenames, collect(dp.name) as dnames
      MATCH (a:Developer)-[r*0..3]-(b:File)
      WHERE b.name IN filenames
      WITH DISTINCT ID(a) As id,  a.name AS name, round(toFloat(SUM(1.0/size(r)) ) * 100)/100 AS score, filenames as f, dnames as d
      RETURN  id, name, score  ORDER BY score LIMIT 3`;
      this._dbService.runQuery(cql, cb, DbResponseType.table);
    }
    if (this.commentInput.addAnomaly) {

      this.comment = "You can inspect artifact " + name + " from this [ link|http://" + window.location.hostname + ":" + window.location.port + "/?name=" + this._g.cy.$(':selected')[0]._private.data.name + "]\n";
      let commentAnomaly = "";
      this.issue_name = this._g.cy.$(':selected')[0]._private.data.name;
      const queries = this.anomalies
        .filter((anomaly) => anomaly.isEnable)
        .map((anomaly) => anomaly.path2userPref());
      const queryResults = await Promise.all(queries);
      commentAnomaly = queryResults.join(" ");
      if (this.number_of_anomalies > 0) {
        commentAnomaly = "\nAnomalies: We have detected " + this.number_of_anomalies + " anomaly in the issue " + this.issue_name + "." + commentAnomaly;
      } else {
        commentAnomaly += "\nAnomalies: We have not detected any anomaly in the issue " + this.issue_name + ".";
      }
      this.number_of_anomalies = 0;
      this.comment = this.comment + commentAnomaly;
    }


  }

  async reportAnomaly() {
    this._g.openReportTab.next(false);
    this.comment = ""
    this.anomalies.map((anomaly) => {
      anomaly.isEnable = true;
    })
    this.commentInput.addAnomaly = true;
    this.performSelection()
  }


}





