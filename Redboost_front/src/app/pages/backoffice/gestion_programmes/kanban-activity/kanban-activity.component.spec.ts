import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KanbanActivityComponent } from './kanban-activity.component';

describe('KanbanActivityComponent', () => {
  let component: KanbanActivityComponent;
  let fixture: ComponentFixture<KanbanActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanActivityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KanbanActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
