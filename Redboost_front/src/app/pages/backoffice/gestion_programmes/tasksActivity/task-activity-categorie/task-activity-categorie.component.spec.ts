import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskActivityCategorieComponent } from './task-activity-categorie.component';

describe('TaskActivityCategorieComponent', () => {
  let component: TaskActivityCategorieComponent;
  let fixture: ComponentFixture<TaskActivityCategorieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskActivityCategorieComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskActivityCategorieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
