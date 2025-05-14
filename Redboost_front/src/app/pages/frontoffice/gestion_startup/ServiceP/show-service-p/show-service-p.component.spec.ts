import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowServicePComponent } from './show-service-p.component';

describe('ShowServicePComponent', () => {
  let component: ShowServicePComponent;
  let fixture: ComponentFixture<ShowServicePComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowServicePComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowServicePComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
