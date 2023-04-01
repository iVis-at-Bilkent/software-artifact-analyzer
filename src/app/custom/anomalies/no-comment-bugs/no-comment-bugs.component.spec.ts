import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoCommentBugsComponent } from './no-comment-bugs.component';

describe('NoCommentBugsComponent', () => {
  let component: NoCommentBugsComponent;
  let fixture: ComponentFixture<NoCommentBugsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NoCommentBugsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoCommentBugsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
