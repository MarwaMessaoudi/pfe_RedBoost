import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhaseListComponent } from './phase-list.component';

describe('PhaseListComponent', () => {
  let component: PhaseListComponent;
  let fixture: ComponentFixture<PhaseListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhaseListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhaseListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
