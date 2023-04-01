import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotReferencedDuplicatesComponent } from './not-referenced-duplicates.component';

describe('NotReferencedDuplicatesComponent', () => {
  let component: NotReferencedDuplicatesComponent;
  let fixture: ComponentFixture<NotReferencedDuplicatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NotReferencedDuplicatesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotReferencedDuplicatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
