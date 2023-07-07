import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Query7Component } from './query2.component';

describe('Query7Component', () => {
  let component: Query7Component;
  let fixture: ComponentFixture<Query7Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Query7Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Query7Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
