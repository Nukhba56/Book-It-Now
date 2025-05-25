import { ActivatedRoute } from '@angular/router';
import { Service } from './../../../../interface/service.interface';
import { BookingLinkService } from './../../../../services/bookinglink.service';
import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-booking-link',
  standalone: false,
  templateUrl: './booking-link.component.html',
  styleUrl: './booking-link.component.css'
})
export class BookingLinkComponent {
  isDropdownVisible = false;
  bookingLinkData: any = null;
  serviceCount: number = 0;
  showEditForm: boolean = false;
  selectedBookingLink: any = null;

  constructor(
    private bookingLinkService: BookingLinkService,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) { }

  async ngOnInit() {
    this.loadBookingLinkData();
  }

  async loadBookingLinkData() {
    try {
      const user = await this.bookingLinkService.getValidUser();
      //get the booking link metadata
      const metadata = await this.bookingLinkService.getBookingLinkByBusinessOwnerId();
      console.log("Booking link metadata:", metadata);
      if (metadata) {
        this.bookingLinkData = [{
          ...metadata,
          businessId: user.uid
        }]
      }
      //check and count services
      this.serviceCount = metadata?.services?.length || 0;
    } catch (error) {
      console.error('Error fetching booking link data:', error);
      this.toastr.error('Failed to load booking link data.', 'Error');
    }
  }

  copyLink(booking: any) {
    const link = `http://localhost:4200/customer_booking/${booking.businessId}`;
    navigator.clipboard.writeText(link).then(() => {
      this.toastr.success('Booking link copied!', 'Copied');
    }).catch(err => {
      console.error('Could not copy link: ', err);
      this.toastr.error('Could not copy booking link.', 'Error');
    });
  }

  toggleActionDropdown() {
    this.isDropdownVisible = !this.isDropdownVisible;
    console.log("toogle", this.isDropdownVisible);
  }

  editBookingLink(bookingLink: any) {
    this.selectedBookingLink = bookingLink;
    this.showEditForm = true;
    this.isDropdownVisible = false;
  }

  onFormSubmitted() {
    this.showEditForm = false;
    this.selectedBookingLink = null;
    this.loadBookingLinkData();
  }

  onFormClosed() {
    this.showEditForm = false;
    this.selectedBookingLink = null;
  }
}
