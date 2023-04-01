import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissingEnvironmentInformationComponent } from './missing-environment-information.component';

describe('MissingEnvironmentInformationComponent', () => {
  let component: MissingEnvironmentInformationComponent;
  let fixture: ComponentFixture<MissingEnvironmentInformationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MissingEnvironmentInformationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissingEnvironmentInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
