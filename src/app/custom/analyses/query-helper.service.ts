import { Injectable } from '@angular/core';
import { TableFiltering } from '../../shared/table-view/table-view-types';
import { GlobalVariableService } from '../../visuall/global-variable.service';
import { CytoscapeService } from '../../visuall/cytoscape.service';

@Injectable({
  providedIn: 'root'
})
export class QueryHelperService {


  constructor(private _g: GlobalVariableService, private _cyService: CytoscapeService) {}

getQueryCondition4TxtFilter(filter: TableFiltering, cols: string[], isIgnoreCase: boolean): string {
  if (filter == null || filter.txt.length < 1) {
    return '';
  }
  let s = '';

  for (let i = 0; i < cols.length; i++) {
    if (isIgnoreCase) {
      s += ` LOWER(toString(${cols[i]})) CONTAINS LOWER('${filter.txt}') OR `;
    } else {
      s += ` toString(${cols[i]}) CONTAINS '${filter.txt}' OR `;
    }
  }
  s = s.slice(0, -3);
  s = 'AND (' + s + ')';
  return s;
}



getOrderByExpression4Query(filter: TableFiltering, orderBy: string, orderDirection: string, ui2Db: any) {
  if (filter != null && filter.orderDirection.length > 0 && filter.orderBy.length > 0) {
    orderBy = ui2Db[filter.orderBy];
    orderDirection = filter.orderDirection;
  }
  return orderBy + ' ' + orderDirection;
}

buildIdFilter(ids: string[] | number[], hasEnd = false, isEdgeQuery = false): string {
  if (ids === undefined) {
    return '';
  }
  let varName = 'n';
  if (isEdgeQuery) {
    varName = 'e';
  }
  let cql = '';
  if (ids.length > 0) {
    cql = '(';
  }
  for (let i = 0; i < ids.length; i++) {
    cql += `ElementId(${varName})='${ids[i]}' OR `
  }

  if (ids.length > 0) {
    cql = cql.slice(0, -4);

    cql += ')';
    if (hasEnd) {
      cql += ' AND ';
    }
  }
  return cql;
}

preprocessTableDataZip(data, uiColumns): any[] {
  const dbColumns = data.columns as string[];
  let columnMapping = [];
  for (let i = 0; i < uiColumns.length; i++) {
    columnMapping.push(dbColumns.indexOf(uiColumns[i]));
  }
  const rawData = data.data[0];
  const objArr: any[] = [];
  for (let i = 0; i < rawData[0].length; i++) {
    const obj = {};
    for (let j = 0; j < columnMapping.length; j++) {
      obj[uiColumns[j]] = rawData[columnMapping[j]][i];
    }
    objArr.push(obj as any)
  }
  return objArr;
}

preprocessTableData(data, uiColumns): any[] {
  const dbColumns = data.columns as string[];
  let columnMapping = [];
  for (let i = 0; i < uiColumns.length; i++) {
    columnMapping.push(dbColumns.indexOf(uiColumns[i]));
  }
  const rawData = data.data;
  const objArr: any[] = [];
  for (let i = 0; i < rawData.length; i++) {
    const obj = {};
    for (let j = 0; j < columnMapping.length; j++) {
      obj[uiColumns[j]] = rawData[i][columnMapping[j]];
    }
    objArr.push(obj as any)
  }
  return objArr;
}


getDateRangeCQL() {

  const isLimit = this._g.userPrefs.isLimitDbQueries2range.getValue();
  if (!isLimit) {
    return 'TRUE';
  }
  const d1 = this._g.userPrefs.dbQueryTimeRange.start.getValue();
  const d2 = this._g.userPrefs.dbQueryTimeRange.end.getValue();
  const a = new Date(d1);
  const c = new Date(d2);
  const b = a.toISOString()
  const d = c.toISOString()

  return ` ${d2} >= n.createdAt  AND ${d1}<= n.closeDate`;
}

}