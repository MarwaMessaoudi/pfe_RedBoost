import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignCoachComponent } from './assign-coach.component';

describe('AssignCoachComponent', () => {
  let component: AssignCoachComponent;
  let fixture: ComponentFixture<AssignCoachComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignCoachComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignCoachComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
