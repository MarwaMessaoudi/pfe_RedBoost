import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllReclamationsComponent } from './all-reclamations.component';

describe('AllReclamationsComponent', () => {
  let component: AllReclamationsComponent;
  let fixture: ComponentFixture<AllReclamationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllReclamationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllReclamationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
