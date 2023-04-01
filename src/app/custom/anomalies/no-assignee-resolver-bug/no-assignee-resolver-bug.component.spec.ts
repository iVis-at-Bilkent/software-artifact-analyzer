import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoAssigneeResolverBugComponent } from './no-assignee-resolver-bug.component';

describe('NoAssigneeResolverBugComponent', () => {
  let component: NoAssigneeResolverBugComponent;
  let fixture: ComponentFixture<NoAssigneeResolverBugComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NoAssigneeResolverBugComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoAssigneeResolverBugComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
