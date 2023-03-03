import { Component, Injectable } from '@angular/core';
import { NavbarDropdown } from '../visuall/navbar/inavbar';
import { GlobalVariableService } from '../visuall/global-variable.service';
import {DialogElementsExample} from './custom-tabs/graph-builder-dialog-tab/dialog-elements-example';
import { ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatDialogModule} from '@angular/material/dialog';
import {MatMenuTrigger} from '@angular/material/menu';

@Injectable({
  providedIn: 'root'
})
/** Custom menu items and action functions for the items should be added to this class.
 * You might need to import other services but you should only edit this file.
 * Using 'menu' function, provided items will be added to navbar.
 * 'isStd' property must be false for all items.
 * If 'dropdown' is not existing inside standard menu, it will be added as a new item.
 sample menu   
 this._menu = [{
      dropdown: 'File', actions: [{ txt: 'Custom Action 1', id: '', fn: 'fn1', isStd: false }]
    },
    {
      dropdown: 'Custom DropDown 1', actions: [{ txt: 'Custom Action 1', id: '', fn: 'fn2', isStd: false }]
    }];
 **/


export class NavbarCustomizationService {

  private _menu: NavbarDropdown[];
  get menu(): NavbarDropdown[] {
    return this._menu;
  }

  constructor(private _g: GlobalVariableService ) {
    this._menu = [
     // {
        //dropdown: 'New Project', actions: [{ txt: 'New Project', id: '', fn: 'fn1', isStd: false }]
     // },
    ];
    // this._menu = [{
    //   dropdown: 'File', actions: [{ txt: 'Custom Action 1', id: '', fn: 'fn1', isStd: false }]
    // },
    // {
    //   dropdown: 'Custom DropDown 1', actions: [{ txt: 'Custom Action 2', id: '', fn: 'fn2', isStd: false }]
    // }];
  }
  
   fn1() {

  console.log('fn1 called');

   }

  // fn2() {
  //   console.log('fn2 called');
  // }

}


