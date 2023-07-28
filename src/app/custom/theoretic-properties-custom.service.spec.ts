import { TestBed } from '@angular/core/testing';

import { TheoreticPropertiesCustomService } from './theoretic-properties-custom.service';

describe('TheoreticPropertiesCustomService', () => {
  let service: TheoreticPropertiesCustomService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TheoreticPropertiesCustomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
