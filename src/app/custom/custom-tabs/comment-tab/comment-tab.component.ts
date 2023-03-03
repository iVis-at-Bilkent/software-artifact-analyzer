import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { GlobalVariableService } from '../../../visuall/global-variable.service';
import { getPropNamesFromObj, DATE_PROP_END, DATE_PROP_START, findTypeOfAttribute, debounce, COLLAPSED_EDGE_CLASS, OBJ_INFO_UPDATE_DELAY, CLUSTER_CLASS, extend } from '../../../visuall/constants';
import { TableViewInput, TableData, TableDataType, TableFiltering, property2TableData, filterTableDatas } from '../../../shared/table-view/table-view-types';
import { Observable, Subject, Subscription } from 'rxjs';
import { CytoscapeService } from "../../../visuall/cytoscape.service";
import { CustomizationModule } from '../../customization.module';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-comment-tab',
  templateUrl: './comment-tab.component.html',
  styleUrls: ['./comment-tab.component.css']
})
export class CommentTabComponent implements OnInit, OnDestroy {
  credentials = 'lara.merdol@ug.bilkent.edu.tr:ATATT3xFfGF05CflbDueb6BFnWmfArTRv6h8OwY08_E_xMLUvHqeiFh4YTfpWtf1CMLS4LASzjVbDe5yZOZNzOBvHuA33tatEQvlmcEk-ST1TzWVIpwud9vKcFkW5F9sNEU-DmxinvwDQ0F1tXeRJ26LfH-gWlXuNzW6K3wyHqonmvyX2rX6n28=F8DD5F05';
  encodedCredentials = btoa(this.credentials);

  selectedItemProps: any[];
  selectedItemPropsURL: any[];
  comment: string = '';
  comment_header: string ="";
  state = {
    comment_paragraph : ""
  }

  constructor(private _g: GlobalVariableService, private _cyService: CytoscapeService, private http: HttpClient) {
    this.selectedItemProps = [];
    this.selectedItemPropsURL =[];
    
  }


    @Output() commentAdded = new EventEmitter<string>();
    onAddComment(): Observable<any> {
      console.log(this._g.cy.$(':selected')[0]._private.classes.values().next().value)
      console.log(this._g.cy.$(':selected')[0]._private.data)
      let issueKey = this._g.cy.$(':selected')[0]._private.data.name
      let comment = "Added by SAA"
      const commentData = {
        body: comment
      };


      const headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Authorization', `Basic ${this.encodedCredentials}`)
        .set('Access-Control-Allow-Origin', '*')
        .set('Access-Control-Allow-Credentials', 'true');
      
      const url = `https://saanalyzer.atlassian.net/rest/api/2/issue/${issueKey}/comment`;
      
      this.http.post(url, commentData, { headers }).subscribe(response => {
        console.log('Comment added:', response);
      }, error => {
        console.error('Error adding comment:', error);
      });
      return ;

    }
    ngOnInit() {
      this.state.comment_paragraph = this._g.cy.$(':selected')[0]._private.classes.values().next().value;
   
    }
    commentParagraph (){
      /*
      //const className = this._g.cy.$(':selected')[0]._private.classes.values().next().value;
      const className = "commit"
      if (className == "Issue"){
        this.state.comment_paragraph ="Usage: You can add a comment under a Jira Issue  report to provide additional information or clarification about your investigation."
      }
      else if (className == "Commit"){
        this.state.comment_paragraph = "Usage: You can add a comment under a Github  report to provide additional information or clarification about your investigation."
      }      
      else if (className == "PullRequest"){
        this.state.comment_paragraph = "Usage: You can add a comment under a Github  report to provide additional information or clarification about your investigation."
      }
      else if (className == "File"){
        this.state.comment_paragraph = "You can add a comment under a Github report to provide additional information or clarification about your investigation of a file."
      }else{
        this.state.comment_paragraph = "Usage: You can add a comment under a Github report to provide additional information or clarification about your investigation of a developer."
      }
      //this.state.comment_paragraph = this._g.cy.$(':selected')[0]._private.data.name
      */
      return this.state.comment_paragraph
    }

    showObjectProps() {
      let selected = this._g.cy.$(':selected');
      this.selectedItemProps = selected

    }
  
    ngOnDestroy(): void {

    }
  
  
}
