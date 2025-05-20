import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingLinkViewComponent } from './booking-link-view.component';

describe('BookingLinkViewComponent', () => {
  let component: BookingLinkViewComponent;
  let fixture: ComponentFixture<BookingLinkViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BookingLinkViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingLinkViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
