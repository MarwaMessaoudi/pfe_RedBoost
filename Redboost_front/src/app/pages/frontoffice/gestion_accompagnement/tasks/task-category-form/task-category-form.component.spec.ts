import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskCategoryFormComponent } from './task-category-form.component';

describe('TaskCategoryFormComponent', () => {
  let component: TaskCategoryFormComponent;
  let fixture: ComponentFixture<TaskCategoryFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCategoryFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskCategoryFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
