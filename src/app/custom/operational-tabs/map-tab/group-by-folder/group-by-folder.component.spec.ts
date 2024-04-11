import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupByFolderComponent } from './group-by-folder.component';

describe('GroupByFolderComponent', () => {
  let component: GroupByFolderComponent;
  let fixture: ComponentFixture<GroupByFolderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupByFolderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupByFolderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
