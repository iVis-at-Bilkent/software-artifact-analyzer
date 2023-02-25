import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { GlobalVariableService } from '../../../visuall/global-variable.service';
import { getPropNamesFromObj, DATE_PROP_END, DATE_PROP_START, findTypeOfAttribute, debounce, COLLAPSED_EDGE_CLASS, OBJ_INFO_UPDATE_DELAY, CLUSTER_CLASS, extend } from '../../../visuall/constants';
import { TableViewInput, TableData, TableDataType, TableFiltering, property2TableData, filterTableDatas } from '../../../shared/table-view/table-view-types';
import { Subject, Subscription } from 'rxjs';
import { CytoscapeService } from "../../../visuall/cytoscape.service";
import { CustomizationModule } from '../../customization.module';

@Component({
  selector: 'app-comment-tab',
  templateUrl: './comment-tab.component.html',
  styleUrls: ['./comment-tab.component.css']
})
export class CommentTabComponent implements OnInit, OnDestroy {

    comment: string = '';
    comment_header: string = '';
  
    @Output() commentAdded = new EventEmitter<string>();
  
    onAddComment() {
      this.commentAdded.emit(this.comment);
      this.commentAdded.emit(this.comment_header);
      this.comment = '';
      this.comment_header = '';
    }
    ngOnInit() {

    }
  
    ngOnDestroy(): void {

    }
  
  
}
