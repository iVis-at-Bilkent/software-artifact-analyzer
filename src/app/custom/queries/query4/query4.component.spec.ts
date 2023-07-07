import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Query4Component } from './query4.component';

describe('Query4Component', () => {
  let component: Query4Component;
  let fixture: ComponentFixture<Query4Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Query4Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Query4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
