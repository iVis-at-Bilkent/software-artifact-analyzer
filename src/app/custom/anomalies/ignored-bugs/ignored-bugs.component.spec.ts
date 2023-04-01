import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IgnoredBugsComponent } from './ignored-bugs.component';

describe('IgnoredBugsComponent', () => {
  let component: IgnoredBugsComponent;
  let fixture: ComponentFixture<IgnoredBugsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IgnoredBugsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IgnoredBugsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
