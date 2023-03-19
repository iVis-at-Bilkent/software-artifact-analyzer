
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
  pr_name: string="";
  comment_paragraph: string;
  attachments: Attachment[] = [];
  reviewerData: any[]=[];
  dataURL: string;
  imageUrl: string;
  sha_github: string="";
  panel: any;
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
  constructor(private _dbService: Neo4jDb, private _g: GlobalVariableService, private _cyService: CytoscapeService, private http: HttpClient, private _modalService: NgbModal) {
    this.selectedItemProps = [];
    this.selectedItemPropsURL = [];

  }

  
  //Jira Issue Post Comment
  postCommentIssue(issueKey: string, comment: string) {
    if(this.commentInput){

    }
    const headers = new HttpHeaders({
      "Authorization":"Basic bGFyYS5tZXJkb2xAdWcuYmlsa2VudC5lZHUudHI6QVRBVFQzeEZmR0YwYjc1Y0tVR1B3Ykd5SFR6S3ppdTlSN09qbTBBb2ZnUkZBWVoxR0xZS2xDU0dFR1RsNGRDd1psSzdEQlhwMnVHd3BoSUxoVmE1Zk95V19ldXdCWUNCLU1GdWczT0NZZFZlYzhqRHFaYnlGYzEzaHhEVXREUl9KY094MmZYaTQ4UFRRRWZ5Mkp2N0ZPUmJaMjRSNE82SnJkdEhKc0c2WGJxX1ctc0tlVkVOa2dRPTUxRTgzRkE4",
      "X-XSRF-TOKEN": "0208468e-1db3-4e34-9d34-4cf405d708e7_4221842a76dd916459c6aa9fce229477d533bf1b_lin",

    });

    const body = {
      body: "comment"
    };
    this.http.post('/rest/api/2/issue/'+issueKey+'/comment', body, { headers }).subscribe(
      (response) => {
        console.log('Comment added successfully:', response);
      },
      (error) => {
        console.error('Error adding comment:', error);
      }
    );
  }


  updateFile(): Observable<any> {
    const url = `https://api.github.com/repos/LaraMerdol/codebanksystemProject/contents/image.png`;

    const body = {
      message: "txt file",
      content:`${this.dataURL.split(",")[1]}`,
      sha: this.sha_github
    };

    const options = this.httpOptions;
    return this.http.put(url, body, options);
  }
  //Github PullRequest Post Comment To Pull Request
  async postCommentPr(prKey: string ) {
    const commentBody = {
      body:  "### "+this.comment_header+"\n"+this.comment
    };    

    //If add graph is selected
    if( this.commentInput.addGraph){
      this.http.get(`https://api.github.com/repos/LaraMerdol/codebanksystemProject/contents/image.png`, this.httpOptions).subscribe(async response => {
        this.sha_github = response["sha"];
        await this.updateFile().subscribe(response => {
          console.log('Comment posted successfully:', response);
          alert('Comment posted successfully')
          this.imageUrl = response["content"]["download_url"]
          commentBody.body+='\n\n![image](' + this.imageUrl + ')'
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

    else{  
      this.http.post(`https://api.github.com/repos/LaraMerdol/codebanksystemProject/issues/${prKey}/comments`, commentBody, this.httpOptions).subscribe(response => {
        console.log('Comment posted successfully:', response);
        alert('Comment posted successfully')
      }, error => {
        console.error('Error posting comment:', error);
      });     
    }

  }  

  async postCommentCommit(commitKey: string ) {
    const commentBody = {
      body:  "### "+this.comment_header+"\n"+this.comment
    };   
    console.log(this._g.cy.$(':selected')[0]._private.data) 
    if( this.commentInput.addGraph){
      this.http.get(`https://api.github.com/repos/LaraMerdol/codebanksystemProject/contents/image.png`, this.httpOptions).subscribe(async response => {
        this.sha_github = response["sha"];
        await this.updateFile().subscribe(response => {
          console.log('Comment posted successfully:', response);
          this.imageUrl = response["content"]["download_url"]
          commentBody.body+='\n\n![image](' + this.imageUrl + ')'
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

    else{  
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
      if(this.commentInput.addGithub){
        this.postCommentPr( this.pr_name)     
     } 
     else{
      this.postCommentCommit(commitKey)
     }
    }
    else if (this.className == "PullRequest") {     
      let prKey = this._g.cy.$(':selected')[0]._private.data.name
      this.postCommentPr( prKey)     
    }
    else if (this.className == "File") {
      if(this.commentInput.addGithub){
        this.postCommentPr( this.pr_name)     
     }
    } 
    else if (this.className == "Developer") {
      if(this.commentInput.addGithub){
         this.postCommentPr( this.pr_name)     
      }
      else if (this.commentInput.addJira){
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
      addReviewer: false
    };
  }

  ngOnInit() {
    let name = ""
    
    setInterval(() => {
      if (this._g.cy.$(':selected')[0]) {

        
        if( this._g.cy.$(':selected')[0]._private.data.name != name){
          this.comment = ""
          this.comment_header =""
          name = this._g.cy.$(':selected')[0]._private.data.name
          const link = "[You can inspect artifact "+ name+" from this link](http://"+window.location.hostname+":"+window.location.port+"/?name="+name+")";
          console.log(link)
          this.comment = link+"\n"+this.comment     
          this.commentInput = {
            addGraph: false, 
            addAnomaly: false, 
            addJira: false, 
            addGithub: false, 
            addReviewer: false
          };

        }         
        this.className = this._g.cy.$(':selected')[0]._private.classes.values().next().value;
        if (this.className == "Issue") {
          this.addMenu = [
            { label: 'Add Graph', value: this.commentInput.addGraph, function: "addGraph()" },
            { label: 'Add Anomaly', value: this.commentInput.addAnomaly, function: "addAnomaly()" },
          ]
        }
        else if (this.className == "Commit") {
          this.addMenu = [
            { label: 'Add Graph', value: this.commentInput.addGraph, function: "addGraph()" },
            { label: 'Pull Request ', value: this.commentInput.addGithub, function: "addGithub()" },
          ]
        }
        else if (this.className == "PullRequest") {
          this.addMenu = [
            { label: 'Add Graph', value: this.commentInput.addGraph, function: "addGraph()" },
            { label: 'Add Reviewer Recommendation ', value: this.commentInput.addReviewer, function: "addReviewer()" },
          ]

        }
        else if (this.className == "File") {
          this.addMenu = [
            { label: 'Pull Request ', value: this.commentInput.addGithub, function: "addGithub()" },
            { label: 'Add Graph', value: this.commentInput.addGraph, function: "addGraph()" },
          ]

        } else {
          this.addMenu = [
            { label: 'Pull Request ', value: this.commentInput.addGithub, function: "addGithub()" },
            { label: 'Issue', value: this.commentInput.addJira, function: "addJira()" },
            { label: 'Add Graph', value: this.commentInput.addGraph, function: "addGraph()" },
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
      this.saveAsPng(true);

    }
    else {
      this.commentInput.addGraph = false
      this.dataURL = ""
      this.attachments = []
    }

  }
  addReviewer() {
    if (!this.commentInput.addReviewer) {  
      const cb = (x) => {
        this.reviewerData = x.data;
        console.log(this.reviewerData )
        this.commentInput.addReviewer = true;

        console.log(x)
        let recomendation = '';
        // Generate table header
        recomendation += 'Recommended developers are;\n';
        // Generate table body
        x.data.forEach(data => {
          if(data[1]!=""){
            recomendation += `@${data[1].replace(' ', '')} with score ${data[0]}\n`          
          }
        });
        
        this.comment= this.comment +recomendation
        this.commentInput.addReviewer = true

      }
      const prKey = this.commentInput.addGithub? this.pr_name : this._g.cy.$(':selected')[0]._private.data.name;
      const cql = ` MATCH (pr:PullRequest{name:'${prKey}'})-[*]->(file:File)
      MATCH (dp:Developer)-[]-(Commit)-[]-(pr:PullRequest {name:'${prKey}'})
      with collect(file.name) as filenames, collect(dp.name) as dnames
      MATCH (a:Developer)-[r*0..3]-(b:File)
      WHERE b.name IN filenames
      WITH DISTINCT ID(a) As id,  a.name AS name,  SUM(1.0/size(r)) AS score , filenames as f, dnames as d
      RETURN  id, name, score  ORDER BY score LIMIT 3`;
      this._dbService.runQuery(cql, cb, DbResponseType.table);      
    }
    else {
      this.commentInput.addReviewer = false
    }

  }
  
  addAnomaly() {
    console.log("x")
    if (!this.commentInput.addAnomaly) {
      this.commentInput.addAnomaly = true;
      this.comment =this.comment + "No anomaly found"
      const cb = (x) => {
        console.log(x)
      };
      const cql = ` MATCH (n:Developer)-[r]->(issue:Issue)
      WHERE issue.resolver= n.name and issue.closer = n.name 
      RETURN  ID(n) as id,  n.name AS Developer, Collect(distinct issue.name) AS Issues, count(distinct issue.name) as Count `;
      this._dbService.runQuery(cql, cb, DbResponseType.table);   
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
      const developer_name = this._g.cy.$(':selected')[0]._private.data.name
      const pull_request_name = this.pr_name
      this.comment_header = "Report  " +developer_name+" "


    }
    else {
      this.commentInput.addGithub = false
    }

  }
  showObjectProps() {
    let selected = this._g.cy.$(':selected');
    this.selectedItemProps = selected
  }



}





