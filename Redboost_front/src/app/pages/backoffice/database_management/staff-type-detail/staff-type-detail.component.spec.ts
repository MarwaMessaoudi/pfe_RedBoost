import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffTypeDetailComponent } from './staff-type-detail.component';

describe('StaffTypeDetailComponent', () => {
  let component: StaffTypeDetailComponent;
  let fixture: ComponentFixture<StaffTypeDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffTypeDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffTypeDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
