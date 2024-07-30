import { TableViewInput, TableFiltering, TableData } from '../../shared/table-view/table-view-types';
import { Subject } from 'rxjs';
import { GraphResponse } from 'src/app/visuall/db-service/data-types';

export interface QueryComponent<T>  {
  tableInput: TableViewInput;
  tableFilled: Subject<boolean>;
  tableResponse: T; 
  graphResponse: GraphResponse;
  clearTableFilter: Subject<boolean>;

  ngOnInit(): void;
  prepareQuery(): void;
  loadTable(skip: number, filter?: TableFiltering): void;
  loadGraph(skip: number, filter?: TableFiltering): void;
  filterGraphResponse(x: GraphResponse): GraphResponse;
  fillTable(data: T[], totalDataCount: number | null): void;
  getDataForQueryResult(e: any): void;
  filterTable(filter: TableFiltering): void;
  filterTableResponse(x: T[], filter: TableFiltering): T[];
}