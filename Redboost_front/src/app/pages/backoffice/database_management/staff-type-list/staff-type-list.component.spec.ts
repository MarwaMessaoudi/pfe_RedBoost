import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffTypeListComponent } from './staff-type-list.component';

describe('StaffTypeListComponent', () => {
  let component: StaffTypeListComponent;
  let fixture: ComponentFixture<StaffTypeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffTypeListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffTypeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
