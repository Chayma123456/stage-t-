import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardEquipeComponent } from './dashboard-equipe.component';

describe('DashboardEquipeComponent', () => {
  let component: DashboardEquipeComponent;
  let fixture: ComponentFixture<DashboardEquipeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardEquipeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DashboardEquipeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
