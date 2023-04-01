import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReassignmentBugAssigneeComponent } from './reassignment-bug-assignee.component';

describe('ReassignmentBugAssigneeComponent', () => {
  let component: ReassignmentBugAssigneeComponent;
  let fixture: ComponentFixture<ReassignmentBugAssigneeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReassignmentBugAssigneeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReassignmentBugAssigneeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
