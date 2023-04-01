import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoLinkToBugFixingCommitComponent } from './no-link-to-bug-fixing-commit.component';

describe('NoLinkToBugFixingCommitComponent', () => {
  let component: NoLinkToBugFixingCommitComponent;
  let fixture: ComponentFixture<NoLinkToBugFixingCommitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NoLinkToBugFixingCommitComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoLinkToBugFixingCommitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
