import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissingPriorityComponent } from './missing-priority.component';

describe('MissingPriorityComponent', () => {
  let component: MissingPriorityComponent;
  let fixture: ComponentFixture<MissingPriorityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MissingPriorityComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissingPriorityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
