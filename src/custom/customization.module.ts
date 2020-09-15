import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { AsdComponent } from './asd/asd.component';
// import statements for custom components should be here

@NgModule({
  // custom components should be inside declarations
  declarations: [],
  // declarations: [AsdComponent],
  imports: [
    CommonModule
  ]
})
export class CustomizationModule {
  // static operationTabs: { component: any, text: string }[] = [{ component: AsdComponent, text: 'Dummy' }];
  // static operationTabs: { component: any, text: string }[] = [{ component: AsdComponent, text: 'Dummy' }, { component: Dummy2Component, text: 'Dummy2' }];
  static operationTabs: { component: any, text: string }[] = [];
}