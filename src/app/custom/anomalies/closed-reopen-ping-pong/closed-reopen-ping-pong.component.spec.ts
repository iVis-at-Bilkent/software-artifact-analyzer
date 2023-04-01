import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClosedReopenPingPongComponent } from './closed-reopen-ping-pong.component';

describe('ClosedReopenPingPongComponent', () => {
  let component: ClosedReopenPingPongComponent;
  let fixture: ComponentFixture<ClosedReopenPingPongComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClosedReopenPingPongComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClosedReopenPingPongComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
