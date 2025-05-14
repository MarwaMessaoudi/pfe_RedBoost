import { TestBed } from '@angular/core/testing';

import { ServicePService } from './service-p.service';

describe('ServicePService', () => {
  let service: ServicePService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServicePService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
