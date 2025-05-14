import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskActivityCardComponent } from './task-card-activity.component';

describe('TaskCardActivityComponent', () => {
  let component: TaskActivityCardComponent;
  let fixture: ComponentFixture<TaskActivityCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskActivityCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskActivityCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
