
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { GlobalVariableService } from '../../visuall/global-variable.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { getPropNamesFromObj, DATE_PROP_END, DATE_PROP_START, findTypeOfAttribute, debounce, COLLAPSED_EDGE_CLASS, OBJ_INFO_UPDATE_DELAY, CLUSTER_CLASS, extend } from '../../visuall/constants';
import { TableViewInput, TableData, TableDataType, TableFiltering, property2TableData, filterTableDatas } from '../../shared/table-view/table-view-types';
import { Observable, Subject, Subscription } from 'rxjs';
import { CytoscapeService } from "../../visuall/cytoscape.service";
import { DbResponseType, GraphResponse } from 'src/app/visuall/db-service/data-types';
import { CustomizationModule } from '../customization.module';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { SaveAsPngModalComponent } from '../../visuall/popups/save-as-png-modal/save-as-png-modal.component';
import { Neo4jDb } from '../../visuall/db-service/neo4j-db.service';
import { CookieService } from 'ngx-cookie-service';
import { RandomSelectionComponent } from '../../shared/random-selection/random-selection.component';
import { HttpXsrfTokenExtractor } from '@angular/common/http';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
//import api from '@forge/api';
interface Attachment {
  name: string;
  data: any,
  type: string;
}
@Component({
  selector: 'app-report-component',
  templateUrl: './report-component.component.html',
  styleUrls: ['./report-component.component.css']
})
export class ReportComponentComponent implements OnInit {
  credentials = 'lara.merdol@ug.bilkent.edu.tr:ATATT3xFfGF05CflbDueb6BFnWmfArTRv6h8OwY08_E_xMLUvHqeiFh4YTfpWtf1CMLS4LASzjVbDe5yZOZNzOBvHuA33tatEQvlmcEk-ST1TzWVIpwud9vKcFkW5F9sNEU-DmxinvwDQ0F1tXeRJ26LfH-gWlXuNzW6K3wyHqonmvyX2rX6n28=F8DD5F05';
  encodedCredentials = btoa(this.credentials);
  className: string = ""
  selectedItemProps: any[];
  selectedItemPropsURL: any[];
  comment: string = '';
  comment_header: string;
  pr_name: string = "";
  comment_paragraph: string;
  attachments: Attachment[] = [];
  reviewerData: any[] = [];
  dataURL: string;
  imageUrl: string;
  sha_github: string = "";
  panel: any;
  csrfToken: any;
  prs: string[] = []
  code: string=""
  commentInput: any = {
    addGraph: false, addAnomaly: false, addJira: false, addGithub: false, addReviewer: false
  };
  addMenu: any[];
  httpOptions = {
    headers: new HttpHeaders({
      'Authorization': 'Bearer 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',
      'Accept': 'application/vnd.github.v3+json'
    })
  };
  constructor( private route: ActivatedRoute, private tokenExtractor: HttpXsrfTokenExtractor, private cookieService: CookieService, private _dbService: Neo4jDb, private _g: GlobalVariableService, private _cyService: CytoscapeService,
    private http: HttpClient, private _modalService: NgbModal) {
    this.selectedItemProps = [];
    this.selectedItemPropsURL = [];
  }
  afterLogin(){
    const headers = new HttpHeaders()
    .set('Content-Type', 'application/json');
    console.log("geldi")

    // Set the data for the POST request
    const data = {
      "grant_type": 'authorization_code',
      "client_id": 'Gte89X7se0jg0EGuEqZFSwBgQoGDIEhU',
      "client_secret": 'ATOArGowlE0ILdGC19sGXhYf4nWhlXAqpIdqSyMaEYR_UcCZhNi7jDdl2EOFleUUzOL5DCAFCEB0',
      "code": this.code,
      "redirect_uri": 'http://localhost:4400/?name=SAA-3/'
    };

    // Make the POST request
    console.log("geldi")
    this.http.post('/oauth/token', data, { headers }).subscribe(
      (response) => {
        console.log('Token:', response);
      },
      (error) => {
        console.error('Error adding comment:', error);
      })
  }
  login() {
    window.location.href = 'https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=Gte89X7se0jg0EGuEqZFSwBgQoGDIEhU&scope=read%3Ajira-work%20manage%3Ajira-project%20manage%3Ajira-configuration%20read%3Ajira-user%20write%3Ajira-work%20manage%3Ajira-webhook%20manage%3Ajira-data-provider&redirect_uri=http%3A%2F%2Flocalhost%3A4400%2F%3Fname%3DSAA-3&state=${YOUR_USER_BOUND_VALUE}&response_type=code&prompt=consent';
  }

  //Jira Issue Post Comment
  postCommentIssue(issueKey: string, comment: string) {
    const code = this.route.snapshot.queryParamMap.get('code')?this.route.snapshot.queryParamMap.get('code'):"";

    if(code == ""){
      console.log(code)
    const headers = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJraWQiOiJmZTM2ZThkMzZjMTA2N2RjYTgyNTg5MmEiLCJhbGciOiJSUzI1NiJ9.eyJqdGkiOiI5Y2UzYTVkOS02NTUzLTRjZWYtOGZlYi05ZjMxYjRkY2FiZWYiLCJzdWIiOiI2M2U3NmRmNTg5NzhkN2E0MzUzZWQzZGQiLCJuYmYiOjE2Nzk5NDA1ODYsImlzcyI6Imh0dHBzOi8vYXRsYXNzaWFuLWFjY291bnQtcHJvZC5wdXMyLmF1dGgwLmNvbS8iLCJpYXQiOjE2Nzk5NDA1ODYsImV4cCI6MTY3OTk0NDE4NiwiYXVkIjoiR3RlODlYN3NlMGpnMEVHdUVxWkZTd0JnUW9HRElFaFUiLCJjbGllbnRfaWQiOiJHdGU4OVg3c2UwamcwRUd1RXFaRlN3QmdRb0dESUVoVSIsImh0dHBzOi8vYXRsYXNzaWFuLmNvbS9lbWFpbERvbWFpbiI6InVnLmJpbGtlbnQuZWR1LnRyIiwiaHR0cHM6Ly9pZC5hdGxhc3NpYW4uY29tL2F0bF90b2tlbl90eXBlIjoiQUNDRVNTIiwiaHR0cHM6Ly9hdGxhc3NpYW4uY29tL2ZpcnN0UGFydHkiOmZhbHNlLCJodHRwczovL2lkLmF0bGFzc2lhbi5jb20vc2Vzc2lvbl9pZCI6ImIyNDY4ZGY5LWVmZWMtNGMyOS1iMGE2LWNkMTViOGYxNTU3MSIsImh0dHBzOi8vYXRsYXNzaWFuLmNvbS92ZXJpZmllZCI6dHJ1ZSwiaHR0cHM6Ly9hdGxhc3NpYW4uY29tL3N5c3RlbUFjY291bnRFbWFpbCI6IjEzNzUzYWY1LWUyNDgtNGY4My04MDMwLTVlNDliYjY0NTZjZkBjb25uZWN0LmF0bGFzc2lhbi5jb20iLCJodHRwczovL2lkLmF0bGFzc2lhbi5jb20vdWp0IjoiYTU1Y2MwNGUtNDVmYy00ZTMwLThiYjctNTQ5MjFhOWMyOGU2IiwiaHR0cHM6Ly9pZC5hdGxhc3NpYW4uY29tL3Byb2Nlc3NSZWdpb24iOiJ1cy1lYXN0LTEiLCJzY29wZSI6Im1hbmFnZTpqaXJhLXByb2plY3QgbWFuYWdlOmppcmEtY29uZmlndXJhdGlvbiByZWFkOmppcmEtd29yayBtYW5hZ2U6amlyYS1kYXRhLXByb3ZpZGVyIHdyaXRlOmppcmEtd29yayBtYW5hZ2U6amlyYS13ZWJob29rIHJlYWQ6amlyYS11c2VyIiwiY2xpZW50X2F1dGhfdHlwZSI6IlBPU1QiLCJodHRwczovL2F0bGFzc2lhbi5jb20vb2F1dGhDbGllbnRJZCI6Ikd0ZTg5WDdzZTBqZzBFR3VFcVpGU3dCZ1FvR0RJRWhVIiwiaHR0cHM6Ly9hdGxhc3NpYW4uY29tLzNsbyI6dHJ1ZSwiaHR0cHM6Ly9pZC5hdGxhc3NpYW4uY29tL3ZlcmlmaWVkIjp0cnVlLCJodHRwczovL2F0bGFzc2lhbi5jb20vc3lzdGVtQWNjb3VudElkIjoiNzEyMDIwOmY3MjM0MDg0LWQwZTMtNDFjMi1hNTQ5LTE4NzI2MTFjMWVmZSIsImh0dHBzOi8vYXRsYXNzaWFuLmNvbS9zeXN0ZW1BY2NvdW50RW1haWxEb21haW4iOiJjb25uZWN0LmF0bGFzc2lhbi5jb20ifQ.WB5P-gCXQiIaTb5gjUmmX1rMy_d2y0XvCe-b786I_ujGsL8H913hCW14N1r3ljs-u40VcK85cdlKTucWEVfi5Xyn4H7ejIEfdU1-eD2Rmkdl7n1lr2HqiEDjotJ6EnJGsNAQLR9X00id2MaRcGpsz-NyEcshfA0HsqhbH50Emy7e7noAp0RkelpW5R0lddqzLeDG82R9eMJ0xiBi1I_1ufBLzigDhMSyBaRPiDGIa28EZZoXUoXrjtecKm-HWaqsFUSP2vSs3wW2FacvDcTkSqBLl-cHJhpN6_1FCjLkry_KSl6RSLW6-Y6uxd_yYIzOoflRVGV9u4tXkmZ9JAKLVA',
      }),
    };
    const body = {
      body: "h2. " + this.comment_header + "\n" + this.comment
    };
    this.http.post('https://api.atlassian.com/ex/jira/b9404671-23b7-4a57-90ab-7fea46d4ab63/rest/api/2/issue/SAA-3/comment', body, headers).subscribe(
      (response) => {
        console.log('Comment added successfully:', response);
      },
      (error) => {
        console.error('Error adding comment:', error);
      }
    );
    }
    else{
      this.login();
    }
  }

  updateFile(): Observable<any> {
    const url = `https://api.github.com/repos/LaraMerdol/codebanksystemProject/contents/image.png`;

    const body = {
      message: "txt file",
      content: `${this.dataURL.split(",")[1]}`,
      sha: this.sha_github
    };

    const options = this.httpOptions;
    return this.http.put(url, body, options);
  }
  //Github PullRequest Post Comment To Pull Request
  async postCommentPr(prKey: string) {
    const commentBody = {
      body: "### " + this.comment_header + "\n" + this.comment
    };

    //If add graph is selected
    if (this.commentInput.addGraph) {
      this.http.get(`https://api.github.com/repos/LaraMerdol/codebanksystemProject/contents/image.png`, this.httpOptions).subscribe(async response => {
        this.sha_github = response["sha"];
        await this.updateFile().subscribe(response => {
          console.log('Comment posted successfully:', response);
          alert('Comment posted successfully')
          this.imageUrl = response["content"]["download_url"]
          commentBody.body += '\n\n![image](' + this.imageUrl + ')'
          this.http.post(`https://api.github.com/repos/LaraMerdol/codebanksystemProject/issues/${prKey}/comments`, commentBody, this.httpOptions).subscribe(response => {
            console.log('Comment posted successfully:', response);
          }, error => {
            console.error('Error posting comment:', error);
          });
          console.log(commentBody.body)
        }, error => {
          console.error('Error updating image:', error);
        });
      }, error => {
        console.error('Error getting ssh:', error);
      });
    }

    else {
      this.http.post(`https://api.github.com/repos/LaraMerdol/codebanksystemProject/issues/${prKey}/comments`, commentBody, this.httpOptions).subscribe(response => {
        console.log('Comment posted successfully:', response);
        alert('Comment posted successfully')
      }, error => {
        console.error('Error posting comment:', error);
      });
    }

  }

  async postCommentCommit(commitKey: string) {
    const commentBody = {
      body: "### " + this.comment_header + "\n" + this.comment
    };
    console.log(this._g.cy.$(':selected')[0]._private.data)
    if (this.commentInput.addGraph) {
      this.http.get(`https://api.github.com/repos/LaraMerdol/codebanksystemProject/contents/image.png`, this.httpOptions).subscribe(async response => {
        this.sha_github = response["sha"];
        await this.updateFile().subscribe(response => {
          console.log('Comment posted successfully:', response);
          this.imageUrl = response["content"]["download_url"]
          commentBody.body += '\n\n![image](' + this.imageUrl + ')'
          this.http.post(`https://api.github.com/repos/LaraMerdol/codebanksystemProject/commits/${commitKey}/comments`, commentBody, this.httpOptions).subscribe(response => {
            console.log('Comment posted successfully:', response);
            alert('Comment posted successfully')
          }, error => {
            console.error('Error posting comment:', error);
          });
          console.log(commentBody.body)
        }, error => {
          console.error('Error updating image:', error);
        });
      }, error => {
        console.error('Error getting ssh:', error);
      });
    }

    else {
      this.http.post(`https://api.github.com/repos/LaraMerdol/codebanksystemProject/commits/${commitKey}/comments`, commentBody, this.httpOptions).subscribe(response => {
        console.log('Comment posted successfully:', response);
        alert('Comment posted successfully')
      }, error => {
        console.error('Error posting comment:', error);
      });
    }
  }

  onAddComment() {
    if (this.className == "Issue") {
      //let issueKey = this._g.cy.$(':selected')[0]._private.data.name
      this.postCommentIssue("SAA-3", "Bu bir deneme")
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
      else if (this.commentInput.addJira) {
        this.postCommentIssue("SAA-3", "Bu bir deneme")
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

  fillGenres(data) {
    console.log(data)
    this.prs = [];
    for (let i = 0; i < data.data.length; i++) {
      this.prs.push(data.data[i][0]);
    }
  }
  ngOnInit() {

    this._dbService.runQuery(`MATCH (n:PullRequest) RETURN distinct n.name`, (x) => this.fillGenres(x), DbResponseType.table);
    let name = ""
    setInterval(() => {
      if (this._g.cy.$(':selected')[0]) {
        this.className = this._g.cy.$(':selected')[0]._private.classes.values().next().value;
        if (this._g.cy.$(':selected')[0]._private.data.name != name) {
          this.comment = ""
          this.dataURL = ""
          this.pr_name = ""
          this.comment_header = ""
          name = this._g.cy.$(':selected')[0]._private.data.name
          if(this.className == "Issue"){
            const link = "You can inspect artifact " + name + " from this [ link|http://" + window.location.hostname + ":" + window.location.port + "/?name=" + name + "]";
            this.comment = link + "\n" + this.comment
            console.log(link)
          }
          else{
            const link = "[You can inspect artifact " + name + " from this link](http://" + window.location.hostname + ":" + window.location.port + "/?name=" + name + ")";
            this.comment = link + "\n" + this.comment
            console.log(link)
          }
          this.commentInput = {
            addGraph: false,
            addAnomaly: false,
            addJira: false,
            addGithub: false,
            addReviewer: false,
          };
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
          //console.log(this.commentInput)
          this.addMenu = [
            { label: 'Graph', value: this.commentInput.addGraph, function: "addGraph()" },
          ]
        }

      }
    }, 500);


  }
  onCheckboxChange(item: any) {
    //item.value = !item.value; // toggle the value of the checkbox
    // call the function associated with the checkbox
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

      // add more cases for other functions
    }
  }




  saveAsPng(isWholeGraph: boolean) {
    const options = { bg: 'white', scale: 3, full: isWholeGraph };
    const base64png: string = this._g.cy.png(options);
    const image = new Image();
    image.src = base64png;
    image.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      this.dataURL = canvas.toDataURL('image/png');
      console.log(this.dataURL.split(",")[1])
    };
  }
  addGraph() {
    if (!this.commentInput.addGraph) {
      this.commentInput.addGraph = true;
      //this._modalService.open(SaveAsPngModalComponent);
      //this.saveAsPng(true);

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
    console.log("x")
    if (!this.commentInput.addAnomaly) {
      this.commentInput.addAnomaly = true;

    }
    else {
      this.commentInput.addAnomaly = false
    }

  }
  addJira() {
    if (!this.commentInput.addJira) {
      console.log(this._g.initialQuery)
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
    this.selectedItemProps = selected
  }

  performSelection() {
    if (this.commentInput.addGithub) {
      const developer_name = this._g.cy.$(':selected')[0]._private.data.name
      const pull_request_name = this.pr_name
      this.comment_header = "Report  " + developer_name + " "
    }
    if (this.commentInput.addGraph) {
      this.saveAsPng(true);
    }
    if (this.commentInput.addReviewer) {
      const cb = (x) => {
        this.reviewerData = x.data;
        console.log(this.reviewerData)
        this.commentInput.addReviewer = true;

        console.log(x)
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
      const prKey = this.commentInput.addGithub ? this.pr_name : this._g.cy.$(':selected')[0]._private.data.name;
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
      this.comment = this.comment + "No anomaly found"
      const cb = (x) => {
        console.log(x)
        
      };
      const cql = ` MATCH (n:Developer)-[r]->(issue:Issue)
      WHERE issue.resolver= n.name and issue.closer = n.name 
      RETURN  ID(n) as id,  n.name AS Developer, Collect(distinct issue.name) AS Issues, count(distinct issue.name) as Count `;
      this._dbService.runQuery(cql, cb, DbResponseType.table);

    }
  }

}





