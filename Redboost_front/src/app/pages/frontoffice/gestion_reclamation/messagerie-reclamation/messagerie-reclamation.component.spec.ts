import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagerieReclamationComponent } from './messagerie-reclamation.component';

describe('MessagerieReclamationComponent', () => {
  let component: MessagerieReclamationComponent;
  let fixture: ComponentFixture<MessagerieReclamationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessagerieReclamationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessagerieReclamationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
