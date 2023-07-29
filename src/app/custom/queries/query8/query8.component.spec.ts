import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Query8Component } from './query8.component';

describe('Query8Component', () => {
  let component: Query8Component;
  let fixture: ComponentFixture<Query8Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Query8Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Query8Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
