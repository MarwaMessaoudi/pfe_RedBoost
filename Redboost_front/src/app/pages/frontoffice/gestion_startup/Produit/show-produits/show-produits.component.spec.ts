import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowProduitsComponent } from './show-produits.component';

describe('ShowProduitsComponent', () => {
  let component: ShowProduitsComponent;
  let fixture: ComponentFixture<ShowProduitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowProduitsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowProduitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
