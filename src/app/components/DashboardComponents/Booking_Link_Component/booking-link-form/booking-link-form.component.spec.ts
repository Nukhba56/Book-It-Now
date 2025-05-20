import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingLinkFormComponent } from './booking-link-form.component';

describe('BookingLinkFormComponent', () => {
  let component: BookingLinkFormComponent;
  let fixture: ComponentFixture<BookingLinkFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BookingLinkFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingLinkFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
