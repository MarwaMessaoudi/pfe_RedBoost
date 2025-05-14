import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskActivityUpdateComponent } from './task-activity-update.component';

describe('TaskActivityUpdateComponent', () => {
  let component: TaskActivityUpdateComponent;
  let fixture: ComponentFixture<TaskActivityUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskActivityUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskActivityUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
