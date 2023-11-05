
import { Component, OnInit } from '@angular/core';
import { GlobalVariableService } from '../../visuall/global-variable.service';
import { Observable } from 'rxjs';
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Neo4jDb } from '../../visuall/db-service/neo4j-db.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalContentComponent } from './../modal-content/modal-content.component';
import { BehaviorSubject } from 'rxjs';

interface Attachment {
  name: string;
  data: any,
  type: string;
}
export interface BoolSetting {
  isEnable: boolean;
  text: string;
  name: string;
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


  selectedItem = new BehaviorSubject<any>(null);


  constructor(public _dbService: Neo4jDb, private _g: GlobalVariableService, private http: HttpClient, private modalService: NgbModal) {
    this.anomalies = [
      { text: 'Unassigned Bugs', isEnable: true, name: "Unassigned issue" },
      { text: 'No Link to Bug-Fixing Commit', isEnable: false, name: "No link to bug fixing commit or pull request" },
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
    setInterval(() => {
      if (this._g.cy.$(':selected')[0]) {
        this.selectedItem.next(this._g.cy.$(':selected')[0]._private.data.name)
        this.className = this._g.cy.$(':selected')[0]._private.classes.values().next().value;
        if (this._g.cy.$(':selected')[0]._private.data.name !== name) {
          this.anomalies
            .map((anomaly) => anomaly.isEnable = true);
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
          if  (this._g.openReportTab.getValue()) {
            this.reportAnomaly()
          }
          
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







  }
  openModal(name, url, templateType): void {
    const modalRef = this.modalService.open(ModalContentComponent);
    modalRef.componentInstance.name = name; // Pass data to the modal component
    modalRef.componentInstance.url = url;
    modalRef.componentInstance.templateType =templateType;
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
    if(this.authentication.authenticated){
      const authenticationString = btoa(`${this.authentication.jira_username}:${this.authentication.jira_token}`);
      let body = {
        "header": this.comment_header,
        "text": this.comment.substring(this.comment.indexOf("]") + 1),
        "url": "http://" + window.location.hostname + ":" + window.location.port + "/?name=" + this._g.cy.$(':selected')[0]._private.data.name,
        "issueName": issueKey,
        "imgData": this.dataURL ? this.dataURL.split(",")[1] : "",
        "uploadImage": this.commentInput.addGraph
      }
      this.http.post(`http://${window.location.hostname}:4445/sendJiraComment`, body, { headers: { 'Content-Type': 'application/json' } })
        .subscribe(
          (response) => {
            console.info('Confirm request success', response);
            const url = `${this.authentication.jira_url}/browse/${issueKey}?focusedCommentId=${response["id"]} `
            this.openModal("issue " + issueKey, url,'report')
          },
          (error) => {
            console.error('Confirm request error:', error);
          }
        );
    }
    else{
      this.openModal("","",'error')
    }

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
    if(this.authentication.authenticated){
    let commentBody = {
      body: `### ${this.comment_header}\n${this.comment}`
    };

    //If add graph is selected
    if (this.commentInput.addGraph) {
      await this.updateFile().subscribe(response => {
        console.log('Comment posted successfully:', response);
        this.imageUrl = response["content"]["download_url"]
        commentBody = {
          body: `### ${this.comment_header}\n${this.comment}\n![image](${this.imageUrl})`
        };
        this.http.post(`https://api.github.com/repos/${this.authentication.github_repo}/issues/${prKey}/comments`, commentBody, this.githubHttpOptions).subscribe(response => {
          console.log('Comment posted successfully:', response);
          this.openModal("pull request  " + prKey, response["html_url"],'report')
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
        this.openModal("pull request  " + prKey, response["html_url"],'report')
      }, error => {
        console.error('Error posting comment:', error);
      });
    }
  }else{
    this.openModal("","",'error')
  }

  }

  async postCommentCommit(commitKey: string) {
    if(this.authentication.authenticated){
    let commentBody = {
      body: "### " + this.comment_header + "\n" + this.comment
    };
    if (this.commentInput.addGraph) {
      await this.updateFile().subscribe(response => {
        console.log('Comment posted successfully:', response);
        this.imageUrl = response["content"]["download_url"]
        commentBody = {
          body: `###${this.comment_header}\n${this.comment}\n![image](${this.imageUrl})`
        };
        this.http.post(`https://api.github.com/repos/${this.authentication.github_repo}/commits/${commitKey}/comments`, commentBody, this.githubHttpOptions).subscribe(response => {
          console.log('Comment posted successfully:', response);
          this.openModal("commit  " + commitKey, response["html_url"],'report')
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
        this.openModal("commit  " + commitKey, response["html_url"],'report')
      }, error => {
        console.error('Error posting comment:', error);
      });
    }
  }else{
    this.openModal("","",'error')
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
      canvas.width = image.width / 4;
      canvas.height = image.height / 4;
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

  async anomalyQ(anomalyName: string): Promise<any> {
    const cql = ` MATCH (issue:Issue {name : '${this.issue_name}'})
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
  async performSelection() {
    const prKey = this.commentInput.addGithub ? this.pr_name : this._g.cy.$(':selected')[0]._private.data.name;
    this.comment = "[You can inspect artifact " + this._g.cy.$(':selected')[0]._private.data.name + " from this link](http://" + window.location.hostname + ":" + window.location.port + "/?name=" + this._g.cy.$(':selected')[0]._private.data.name + ")\n";
    if (this.commentInput.addGithub) {
      if (this._g.cy.$(':selected')[0]._private.classes.values().next().value == "Developer") {
        const developer_name = this._g.cy.$(':selected')[0]._private.data.name
        const pull_request_name = this.pr_name
        this.comment_header = "Report  @" + developer_name.replace(" ", "") + " "
      }
      else if (this._g.cy.$(':selected')[0]._private.classes.values().next().value == "Commit") {
        const commit_name = this._g.cy.$(':selected')[0]._private.data.name
        const pull_request_name = this.pr_name
        this.comment_header = "Report  Commit " + commit_name + " "
      } else {
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
        x.data[0][1].forEach((developer, index) => {
          recomendation += `@${developer.replace(' ', '')} with score ${ x.data[0][2][index].toFixed(2)}\n`

        });
        this.comment = this.comment + recomendation
        this.commentInput.addReviewer = true

      }
      //const idFilter = buildIdFilter(e.dbIds);;
      const orderBy = 'score';
      let orderDir = 0;
      const timeMap = this.getTimebarMapping4Java();
      let d1 = this._g.userPrefs.dbQueryTimeRange.start.getValue();
      let d2 = this._g.userPrefs.dbQueryTimeRange.end.getValue();
      if (!this._g.userPrefs.isLimitDbQueries2range.getValue()) {
        d1 = 0;
        d2 = 0;
      }
      let ignoredDevelopers;
      let fileIds;
      const inclusionType = this._g.userPrefs.objectInclusionType.getValue();
      const timeout = this._g.userPrefs.dbTimeout.getValue() * 1000;
      const cbSub1 = (x) => {
        ignoredDevelopers = x.data[0][0]
        this._dbService.runQuery(`MATCH (N:PullRequest{name:'${prKey}'})-[:INCLUDES]-(c:Commit)-[:CONTAINS]-(f:File) WITH collect(distinct elementId(f)) AS fileIds  RETURN fileIds`, cbSub2, DbResponseType.table, false);
      }
      const cbSub2 = (x) => {
        fileIds = x.data[0][0]
        this._dbService.runQuery(`CALL findNodesWithMostPathBetweenTable(['${fileIds.join("','")}'], ['COMMENTED'],'Developer',['${ignoredDevelopers.join("','")}'],3,3, false,
      225, 1, null, false, '${orderBy}', ${orderDir}, ${timeMap}, ${d1}, ${d2}, ${inclusionType}, ${timeout}, null)`, cb, DbResponseType.table, false);
      }
      this._dbService.runQuery(`MATCH (N:PullRequest{name:'${prKey}'})-[:INCLUDES]-(c:Commit)-[:COMMITTED]-(d:Developer) WITH collect(distinct elementId(d)) AS ignoreDevs return ignoreDevs`, cbSub1, DbResponseType.table, false);

    }
    if (this.commentInput.addAnomaly) {

      this.comment = "You can inspect artifact " + name + " from this [ link|http://" + window.location.hostname + ":" + window.location.port + "/?name=" + this._g.cy.$(':selected')[0]._private.data.name + "]\n";
      let commentAnomaly = "";
      this.issue_name = this._g.cy.$(':selected')[0]._private.data.name;
      const queries = this.anomalies
        .filter((anomaly) => anomaly.isEnable)
        .map((anomaly) => this.anomalyQ(anomaly.name));
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
  private getTimebarMapping4Java(): string {
    // {Person:["start_t", "end_t"]}
    const mapping = this._g.appDescription.getValue().timebarDataMapping;
    let s = '{'
    for (const k in mapping) {
      s += k + ':["' + mapping[k].begin_datetime + '","' + mapping[k].end_datetime + '"],';
    }
    s = s.slice(0, -1);
    s += '}'
    return s;
  }

  async reportAnomaly() {
    this.comment = ""
    this.comment_header = "Report Anomalies"
    this.anomalies.map((anomaly) => {
      anomaly.isEnable = true;
    })
    this.commentInput.addAnomaly = true;
    this.performSelection()
  }


}





