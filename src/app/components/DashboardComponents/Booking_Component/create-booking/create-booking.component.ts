import { PaymentIntentRequest, StripeService } from './../../../../services/stripe.service';
import { Booking } from './../../../../interface/CustomerBooking.interface';
import { Availability } from './../../../../interface/availability.model';
import { Component, Input, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingLinkService } from '../../../../services/bookinglink.service';
import { AvailabilityService } from '../../../../services/availability.service';
import { CustomerBookingService } from '../../../../services/customer-booking.service';
import { endBefore, Timestamp } from 'firebase/firestore';
import { CustomerService } from '../../../../services/customer.service';
import { Customers } from '../../../../interface/customer.interface';
import { StripeComponent } from '../../../stripe/stripe.component';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

interface CustomerDetails {
  name: string;
  email: string;
}

@Component({
  selector: 'app-create-booking',
  standalone: false,
  templateUrl: './create-booking.component.html',
  styleUrl: './create-booking.component.css'
})
export class CreateBookingComponent {

  @ViewChild(StripeComponent) stripeComponent!: StripeComponent;
  isProcessingPayment: boolean = false;
  paymentIntent: string = '';
  key: string = '';
  paymentForm!: FormGroup<any>;
  @Input() editBookingData: Booking | null = null;
  @Input() businessId: string = ''; // used from dashboard
  // Stepper & Navigation
  currentStep = 1;
  currentMonth = new Date();
  currentYear = new Date().getFullYear();
  weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Booking Data
  customerId: any = '';
  bookingMetadta: any = '';
  customerData: Customers | null = null;
  services: any[] = [];
  availabilities: Availability[] = [];

  // Selected Options
  selectedService: string | null = null;
  selectedDate: string | null = null;
  selectedTimeSlot: string | null = null;

  // Calendar & Time
  days: { date: Date | null; booked: boolean; available: boolean }[] = [];
  timeSlots: string[] = [];
  loadingSlots = false;

  showPayment = false;
  paymentAmount = 0;

  constructor(
    private route: ActivatedRoute,
    private bookingLinkService: BookingLinkService,
    private availabilityService: AvailabilityService,
    private customerBooking: CustomerBookingService,
    private customerService: CustomerService,
    private stripeService: StripeService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {

    if (this.editBookingData) {
      //Editing an existing booking from dashboard
      this.loadBookingForEdit(this.editBookingData);
      return;
    } else {
      if (!this.businessId) {
        this.businessId = this.route.snapshot.paramMap.get('businessId') || ''
        console.log("business id:", this.businessId);
      }
      // this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
      this.generateCalendar(this.currentMonth);
      this.generateTimeSlots(); // for testing/random only
      // this.loadPublicBookingData();
    }
    // Determine context: dashboard (private) or public link
    if (this.route.routeConfig?.path === 'createBooking_fromDashboard') {
      this.loadPrivateBookingData();
    } else {
      this.loadPublicBookingData();
    }

    //payment form
    this.paymentForm = new FormGroup({
      amount: new FormControl('', Validators.required),
      payment_status: new FormControl('', Validators.required),
      change_return: new FormControl(0)
    })
  }
  /** Stepper Navigation */
  nextStep() {
    if (this.currentStep < 5) this.currentStep++;
  }

  back() {
    if (this.currentStep > 1) this.currentStep--;
  }
  save() {
    // Refresh availability when moving to Step 2
    if (this.currentStep === 1 && this.selectedService) {
      this.selectService(this.selectedService, this.currentMonth.getFullYear(), this.currentMonth.getMonth());
    }

    // Create payment intent when moving to payment step
    if (this.currentStep === 3) {
      this.getPaymentIntent();
    }

    this.nextStep();
  }
  /** Load initial data */
  async loadPublicBookingData() {
    try {
      this.bookingMetadta = await this.bookingLinkService.getPublicBookingLinkMetadata(this.businessId);
      this.services = await this.bookingLinkService.getPublicBookingLinkServices(this.businessId);
      this.toastr.success('Services loaded successfully', 'Success');
    } catch (error) {
      console.error('Error loading booking data:', error);
      this.toastr.error('Failed to load booking services', 'Error');
    }
  }

  async loadPrivateBookingData() {
    try {
      this.bookingMetadta = await this.customerBooking.getPrivateBookingLinkMetadata();
      this.services = await this.customerBooking.getPrivateBookingLinkServices();
      this.toastr.success('Services loaded successfully', 'Success');
    } catch (error) {
      console.error('Error loading booking data:', error);
      this.toastr.error('Failed to load booking services', 'Error');
    }
  }
  /** Get selected service details */
  get selectedServiceDetails() {
    return this.services.find(s => s.id === this.selectedService);
  }
  // Get 'yyyy-mm-dd' from Date object
  getYMD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Convert 'yyyy-mm-dd' string to Date object (local)
  getDateFromYMD(ymd: string): Date {
    const [year, month, day] = ymd.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Human-readable label from 'yyyy-mm-dd'
  getReadableDateLabel(ymd: string): string {
    const date = this.getDateFromYMD(ymd);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  async loadTimeSlotsForSelectedDate() {
    if (!this.selectedService || !this.selectedDate) {
      console.error('Service or date not selected!', {
        service: this.selectedService,
        date: this.selectedDate
      });
      this.toastr.warning('Please select both service and date', 'Missing Information');
      return;
    }

    try {
      this.loadingSlots = true;
      // 1. Get all available slots
      const timeSlots = await this.availabilityService.getAvailableSlotsForCustomer(
        this.businessId,
        this.selectedService,
        this.selectedDate
      );
      const allSlots = timeSlots?.map(slot => `${slot.start} - ${slot.end}`) || [];

      // 2. Get booked slots
      const bookedSlots = await this.customerBooking.getBookedSlots(
        this.businessId,
        this.selectedService,
        this.selectedDate
      );

      // 3. Filter out booked slots
      this.timeSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

      if (this.timeSlots.length === 0) {
        this.toastr.info('No time slots available for the selected date', 'No Availability');
      } else {
        this.toastr.success('Time slots loaded successfully', 'Success');
      }
    } catch (err) {
      console.error("Failed to load slots:", err);
      this.timeSlots = [];
      this.toastr.error('Failed to load available time slots', 'Error');
    } finally {
      this.loadingSlots = false;
    }
  }

  /** Handle Service Selection */
  async selectService(serviceId: string, year: number, month: number) {
    try {
      this.selectedService = serviceId;
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);

      const startDate = this.today.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];

      const availabilities = await this.availabilityService.getAvailabilities(serviceId, startDate, endDate);
      this.availabilities = availabilities;
      this.toastr.success('Service selected successfully', 'Success');
    } catch (error) {
      console.error('Error loading availabilities:', error);
      this.toastr.error('Failed to load service availability', 'Error');
    }
  }
  /** Calendar Navigation */
  prevMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1);
    this.updateCalendarForService();
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1);
    this.updateCalendarForService();
  }

  private updateCalendarForService() {
    if (this.selectedService) {
      this.selectService(this.selectedService, this.currentMonth.getFullYear(), this.currentMonth.getMonth());
    } else {
      this.generateCalendar(this.currentMonth);
    }
  }

  /** Generate calendar with dummy values (before service selected) */
  generateCalendar(date: Date) {
    this.days = [];
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay();

    for (let i = 0; i < startDay; i++) {
      this.days.push({ date: null, booked: false, available: false });
    }

    for (let i = 1; i <= endOfMonth.getDate(); i++) {
      const day = new Date(date.getFullYear(), date.getMonth(), i);
      this.days.push({
        date: day,
        booked: Math.random() > 0.7,
        available: Math.random() > 0.5,
      });
    }
  }

  /** Time Slot Helpers */
  generateTimeSlots(): void {
    const intervals = [20, 30, 40];
    const startHour = 9;
    const endHour = 21;
    const slots: string[] = [];
    let currentTime = startHour * 60;

    while (currentTime < endHour * 60) {
      const hours = Math.floor(currentTime / 60);
      const minutes = currentTime % 60;
      slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
      currentTime += intervals[Math.floor(Math.random() * intervals.length)];
    }

    this.timeSlots = slots;
    this.selectedTimeSlot = null;
  }

  selectTimeSlot(slot: string): void {
    this.selectedTimeSlot = slot;
  }

  async selectDay(date: Date | null): Promise<void> {

    if (!date) {
      console.log("No date selected!");
      return;
    }
    this.selectedDate = this.getYMD(date);
    console.log("Selected Date:", this.selectedDate);

    const matchedAvailability = this.availabilities.find(a => a.date === this.selectedDate);
    this.timeSlots = matchedAvailability
      ? matchedAvailability.slots.map(slot => `${slot.start} - ${slot.end}`)
      : [];

    this.selectedTimeSlot = null;

    console.log("Matched Availability:", matchedAvailability);


    // Add this to ensure actual time slots from API are loaded
    await this.loadTimeSlotsForSelectedDate();
  }

  /** Utility: Check state of a day in calendar */
  isDateDisabled(day: number): boolean {
    const currentDate = new Date(this.currentYear, this.today.getMonth(), day);
    return currentDate < this.today;
  }

  isDateSelected(day: number): boolean {
    const selected = new Date(this.currentYear, this.today.getMonth(), day).toDateString();
    return this.selectedDate === selected;
  }

  /** Booking Logic */
  async customerFormsubmitted(data: Customers) {
    try {
      this.customerData = data;
      this.customerId = await this.customerService.addCustomer(data);
      this.toastr.success('Customer information saved', 'Success');
      this.nextStep();
    } catch (error) {
      console.error('Error saving customer:', error);
      this.toastr.error('Failed to save customer information', 'Error');
    }
  }

  async loadBookingForEdit(data: Booking) {
    this.businessId = data.businessId!;
    this.selectedService = data.serviceId!;
    this.selectedDate = data.date!;
    this.selectedTimeSlot = data.timeSlot!;
    this.customerId = data.customerId;

    try {
      //load booking metadata and services for the businessId
      this.bookingMetadta = await this.bookingLinkService.getPublicBookingLinkMetadata(this.businessId);
      this.services = await this.bookingLinkService.getPublicBookingLinkServices(this.businessId);

      //load availability for the selected service
      await this.selectService(this.selectedService, this.currentYear, this.currentMonth.getMonth());
      await this.selectDay(this.getDateFromYMD(this.selectedDate));
      await this.loadTimeSlotsForSelectedDate();

      //load customer data
      this.customerData = await this.customerService.getCustomerById(this.businessId, this.customerId);

    } catch (error) {
      console.error('Error loading booking data for edit:', error);
    }
  }

  async confirmBooking() {
    if (!this.selectedService || !this.selectedDate || !this.selectedTimeSlot || !this.customerId) {
      this.toastr.warning('Please fill in all required booking information', 'Missing Information');
      return;
    }
    const email = this.customerData?.email;
    this.isProcessingPayment = true;

    //Trigger stripe payment when user clicks "Place booking"
    const PaymentResult = await this.stripeComponent.triggerPayment(email);

    if (PaymentResult.success && PaymentResult.transactionId) {

      //when the payment ok then order will call
      this.placeBooking(PaymentResult.transactionId);
    } else {
      //payment failed
      this.toastr.error('Payment failed', PaymentResult.message)
    } this.isProcessingPayment = false;
  }

  async placeBooking(transactionId: string) {
    // Implementation of placeBooking method

    const bookingData: Booking = {
      customerId: this.customerId,
      businessId: this.businessId,
      serviceId: this.selectedService ?? '',  // Default to an empty string
      date: this.selectedDate ?? '',
      timeSlot: this.selectedTimeSlot ?? '',
      total_amount: this.selectedServiceDetails.fee ?? 0,
      payment: this.paymentForm.value ?? {},
      intent: this.paymentIntent ?? '',
      transactionId: transactionId ?? '',
      booking_Status: 'pending',
      payment_Status: 'pending',
      createdAt: Timestamp.now(),
    };

    console.log('Final booking data:', bookingData);

    await this.customerBooking.createBooking(this.businessId, bookingData);
    this.toastr.success('Booking confirmed successfully', 'Success');
  }

  private today: Date = new Date();

  // initiatePayment(amount: number, businessId: string) {
  //   this.paymentAmount = amount;
  //   this.businessId = businessId;
  //   this.showPayment = true;
  // }

  onPaymentSuccess(event: { transactionId: string }) {
    this.toastr.success('Payment processed successfully', event.transactionId);
  }

  async getPaymentIntent() {
    if (!this.businessId) {
        this.toastr.error('Business ID is missing', 'Error');
        return;
    }

    if (!this.selectedServiceDetails?.fee) {
        this.toastr.error('Service fee is missing', 'Error');
        return;
    }

    console.log('Creating payment intent with business ID:', this.businessId);

    const paymentIntentRequest: PaymentIntentRequest = {
        amount: this.selectedServiceDetails.fee,
        business_id: this.businessId,
        customer_email: this.customerData?.email,
        currency: 'usd',
        metadata: {
            serviceId: this.selectedService,
            serviceName: this.selectedServiceDetails.name,
            bookingDate: this.selectedDate,
            bookingTime: this.selectedTimeSlot
        }
    };

    console.log('Payment Intent Request:', paymentIntentRequest);

    this.stripeService.createPaymentIntent(paymentIntentRequest)
        .subscribe({
            next: (res) => {
                if (!res.clientSecret || !res.clientSecret.includes('_secret_')) {
                    this.toastr.error('Invalid client secret received', 'Payment Error');
                    return;
                }

                this.paymentIntent = res.paymentIntentId;
                this.key = res.clientSecret;

                console.log("Payment intent created successfully:", {
                    paymentIntentId: this.paymentIntent,
                    clientSecret: this.key
                });

                this.toastr.success('Payment initialized successfully', 'Success');
            },
            error: (error) => {
                console.error("Error creating payment intent:", error);
                if (error.status === 400) {
                    if (error.error?.error === 'Business not found or onboarding not complete') {
                        this.toastr.error('Business is not set up to accept payments yet', 'Payment Error');
                    } else if (error.error?.error === 'Missing required parameters: amount or business_id') {
                        this.toastr.error('Missing required payment information', 'Payment Error');
                    } else {
                        this.toastr.error(error.error?.error || 'Failed to initialize payment', 'Payment Error');
                    }
                } else {
                    this.toastr.error('Failed to initialize payment', 'Error');
                }
            }
        });
  }
  // Helper method to transform customer data
  getCustomerDetailsForStripe(): CustomerDetails | undefined {
    if (!this.customerData) return undefined;

    return {
      name: this.customerData.name,
      email: this.customerData.email
    };
  }
}


