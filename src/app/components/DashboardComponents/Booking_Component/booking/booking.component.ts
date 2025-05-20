import { ActivatedRoute, Router } from '@angular/router';
import { Component, HostListener } from '@angular/core';
import { CustomerBookingService } from '../../../../services/customer-booking.service';
import { Booking } from '../../../../interface/CustomerBooking.interface';
import { FirebaseAuthService } from '../../../../services/firebase-auth.service';

@Component({
  selector: 'app-booking',
  standalone: false,
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.css'
})
export class BookingComponent {

  isDropdownVisible = false;
  selectedBookingId: string | null = null;
  selectedBookingIdForAction: string | null = null;
  currentBookingToEdit: any = null;
  showBookingFormDialog: boolean = false;
  businessId: string = '';
  bookings: Booking[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 5;
  paginatedData: Booking[] = [];
  totalPages: number = 1;

  servicesMap: Record<string, string> = {};   // serviceId -> serviceName
  customersMap: Record<string, string> = {};  // customerId -> customerName


  constructor(
    private router: Router,
    private bookingService: CustomerBookingService,
    private authService : FirebaseAuthService
  ) { }

  async ngOnInit() {

    const user = await this.authService.getAuthenticatedUser();
    this.businessId = user.uid;
    this.loadCustomerAndServicesNameMaps();
  }

  async loadCustomerAndServicesNameMaps(){

    try{
      const maps = await this.bookingService.getServiceAndCustomerNameMaps();
      this.servicesMap = maps.serviceMap;
      this.customersMap = maps.customerMap;
      console.log("Service Map:", this.servicesMap);
      console.log("Customer Map:", this.customersMap);
      this.loadBookings();
    } catch (error) {
      console.error("Error loading service/customer data:", error);
    }
  }

  loadBookings(): void {
    this.bookingService.getBookingsByBusiness().subscribe(bookingData => {

      this.bookings = bookingData;
      console.log('Bookings:', this.bookings);
      this.totalPages = Math.ceil(this.bookings.length / this.itemsPerPage);
      this.updatePagination();
    });
  }

  updatePagination(): void {

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedData = this.bookings.slice(startIndex, endIndex);
    // this.totalPages = Math.ceil(this.bookings.length / this.itemsPerPage);

  }

  nextPage(): void {

    if (this.currentPage < this.totalPages) {

      this.currentPage++;
      this.updatePagination();

    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  // Action button handler
  handleAction(booking: any): void {
    console.log('Action clicked for:', booking);
  }

  // ✅ Called when user clicks "+ New Booking"
  createNewBookingFromDashboard() {

    this.currentBookingToEdit = null;
    this.showBookingFormDialog = true;
  }

  // ✅ Close modal
  closeBookingFromDialog() {

    this.currentBookingToEdit = null;
    this.showBookingFormDialog = false;
  }

    // ✅ Toggle dropdown actions
    toggleActionDropdown(bookingId: string | undefined) {
      if(!bookingId){
        return;
      }
      this.selectedBookingId =  bookingId
        this.isDropdownVisible = this.selectedBookingId === bookingId ? !this.isDropdownVisible : true;
    }

  editBooking(booking: any) {

    this.currentBookingToEdit = booking;
    this.showBookingFormDialog = true;
  }

  async deleteBooking(bookingId: string): Promise<void> {

    if(confirm("Are you sure you want to delete this booking?")){
      try{

        await this.bookingService.deleteBooking(bookingId);
        this.bookings = this.bookings.filter(booking => booking.id !== bookingId);
        this.totalPages = Math.max(1,  Math.ceil(this.bookings.length / this.itemsPerPage));

          if(this.currentPage > this.totalPages){
            this.currentPage = this.totalPages
          }
          this.updatePagination();
          alert("Booking deleted successfully.")

        } catch (err) {
      console.error("Error deleting booking:", err);
      alert("Failed to delete booking.");
    }
    }
  }


  @HostListener('document: click', ['$event'])
  handleOutsideClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.account-menu')) {
      this.isDropdownVisible = false;
      this.selectedBookingId = null;
    }

  }




}

