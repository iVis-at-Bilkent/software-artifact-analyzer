import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SameResolverCloserComponent } from './same-resolver-closer.component';

describe('SameResolverCloserComponent', () => {
  let component: SameResolverCloserComponent;
  let fixture: ComponentFixture<SameResolverCloserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SameResolverCloserComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SameResolverCloserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
