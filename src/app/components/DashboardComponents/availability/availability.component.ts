import { Availability } from './../../../interface/availability.model';
import { AvailabilityService } from './../../../services/availability.service';
import { Component, inject, OnInit } from '@angular/core';
import { TimeSlot } from '../../../interface/availability.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceService } from '../../../services/services.servicee';
import { combineLatest, filter, switchMap } from 'rxjs';

@Component({
  selector: 'app-availability',
  standalone: false,
  templateUrl: './availability.component.html',
  styleUrl: './availability.component.css'
})
export class AvailabilityComponent implements OnInit {
  currentMonth: Date = new Date();
  days: any[] = [];
  weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  selectedDate: Date | null = null;
  showModal = false;
  showDropdown: boolean = true;
  timeSlots: TimeSlot[] = [];


  services: any[] = [];
  selectedServiceId: string = '';
  selectedService: any;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private availabilityService = inject(AvailabilityService);
  private serviceService = inject(ServiceService);

 async  ngOnInit() {

    document.addEventListener('click', this.closeAllDropdowns.bind(this));

    // Get the services from the service service
    this.services = await this.serviceService.getMyServices();

    //Now handle route Params
    this.handleRouteParamChanges();

  }

  async handleRouteParamChanges(){
    combineLatest([
      this.route.paramMap,
    ]).pipe(
      filter(([params]) => !!this.services.length), // Ensure services are loaded
      switchMap(([params]) => {
        const paramServiceId = params.get('serviceId');
        if(paramServiceId){
          this.selectedServiceId = paramServiceId;
          console.log('Service ID from param:', this.selectedServiceId);

      } else {
        //fallback if no param
        this.selectedServiceId = this.services[this.services.length - 1].id;
        console.log('No service ID in param, using last service:', this.selectedServiceId);
        this.router.navigate([`/dashboard/availability/${this.selectedServiceId}`]);
      }
      this.selectedService = this.services.find(s => s.id === this.selectedServiceId);
      console.log('Selected Service:', this.selectedService);
      this.generateCalendar();
      return this.loadAvailabilitiesForMonth(); // returns Promise<void> so we await it
      })
    ).subscribe();


  }

  onServiceChange(){
    if(this.selectedServiceId !== this.route.snapshot.paramMap.get('serviceId')){
      this.router.navigate([`/dashboard/availability/${this.selectedServiceId}`]);
      console.log('Service ID changed:', this.selectedServiceId);
    }
  }
  generateCalendar(): void {
    const start = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    const end = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);
    const days: any[] = [];

    const firstDayIndex = start.getDay();
    const lastDayIndex = end.getDay();
    const prevDays = firstDayIndex;
    const nextDays = 6 - lastDayIndex;

    for (let i = 0; i < prevDays; i++) {
      days.push({ date: null });
    }

    for (let d = 1; d <= end.getDate(); d++) {
      const date = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      days.push({ date, isPast: date < today });
    }

    for (let i = 0; i < nextDays; i++) {
      days.push({ date: null });
    }

    this.days = days;
  }


  async loadAvailabilitiesForMonth(): Promise<void> {
    if (!this.selectedServiceId) return;

    const start = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    const end = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);

    const availabilities = await this.availabilityService.getAvailabilities(
      this.selectedServiceId,
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    );

    this.days = this.days.map(day => {
      if (!day.date) return day;
      const formatted = this.getLocalDateString(day.date);
      return { ...day, hasAvailability: availabilities.some(a => a.date === formatted) };
    });
  }



  generateDefaultTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const now = new Date();

    const isToday = this.selectedDate?.toDateString() === now.toDateString();
    const startHour = isToday ? now.getHours() + 1 : 9;

    for (let hour = startHour; hour < 17; hour++) {
      const start = this.formatTime(hour, 0);
      const end = this.formatTime(hour + 1, 0);
      slots.push({ start, end });
    }
    return slots;
  }

  formatTime(h: number, m: number): string {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  async selectDay(day: any): Promise<void> {
    if (day.isPast || !day.date) return;

    this.selectedDate = new Date(day.date);

    const formattedDate = this.getLocalDateString(this.selectedDate!);
    const availability = await this.availabilityService.getAvailability(this.selectedServiceId!, formattedDate);

    this.timeSlots = availability && availability.slots?.length
      ? availability.slots
      : this.generateDefaultTimeSlots();
    this.showModal = true;
    console.log('Selected Date:', this.selectedDate);
    console.log('Loaded Time Slots:', this.timeSlots);

  }

  async saveSlots(): Promise<void> {

    if (!this.selectedDate || this.timeSlots.length === 0) return;

    const now = new Date();
    const isToday = this.selectedDate.toDateString() === now.toDateString();

    // Validate each time slot
    const invalidSlots = this.timeSlots.filter(slot => {

      if (!slot.start || !slot.end) return true;

      const [startHour, startMin] = slot.start.split(':').map(Number);
      const [endHour, endMin] = slot.end.split(':').map(Number);

      const slotStart = new Date(this.selectedDate!);
      slotStart.setHours(startHour, startMin, 0, 0);

      const slotEnd = new Date(this.selectedDate!);
      slotEnd.setHours(endHour, endMin, 0, 0);

      // Condition: End should be after start
      if (slotEnd <= slotStart) return true;

      // If today: slot start should be at least 30 mins from now
      if (isToday && (slotStart.getTime() - now.getTime()) < 30 * 60 * 1000) return true;

      return false;

    });

    if (invalidSlots.length > 0) {
      alert("Some slots are invalid: either in the past, less than 30 minutes from now, or have incorrect time ranges.");
      return;
    }

    const availability: Availability = {
      date: this.getLocalDateString(this.selectedDate!),
      slots: this.timeSlots,
    };

    try {
      await this.availabilityService.saveAvailability(this.selectedServiceId!, availability);
      this.showModal = false;
      await this.loadAvailabilitiesForMonth();
    } catch (error) {
      console.error('Error saving availability:', error);
    }

  }

  addSlot(): void {
    this.timeSlots.push({ start: '', end: '' });
  }

  removeSlot(index: number): void {
    this.timeSlots.splice(index, 1);
  }

  prevMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
    this.loadAvailabilitiesForMonth();
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendar();
    this.loadAvailabilitiesForMonth();
  }

  closeModal(): void {
    this.showModal = false;
  }

  getLocalDateString(date: Date): string{
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async loadTimeSlotsForDate(date: Date): Promise<void> {
    const formattedDate = this.getLocalDateString(date);
    const availability = await this.availabilityService.getAvailability(this.selectedServiceId!, formattedDate);

    this.timeSlots = availability && availability.slots?.length
      ? availability.slots
      : this.generateDefaultTimeSlots();
  }

  resetToDefault(day: any, event: MouseEvent) {

    event.stopPropagation();
    const defaultSlots = this.generateDefaultTimeSlots();
    const formattedDate = this.getLocalDateString(new Date(day.date!));

    this.availabilityService.saveAvailability(this.selectedServiceId!,{
      date: formattedDate,
      slots: defaultSlots
    }).then(() => {
      day.hasAvailability = true;
      day.showDropdown = false;
      alert("Reset to default (9AM to 5PM)"); // Optional
    });

    day.showDropdown = false;

  }

  toggleDropdown(day: any, event: MouseEvent): void {
    //close all others
    event.stopPropagation(); // prevent modal from opening
    this.days.forEach(d => d.showDropdown = false); // close all other dropdowns);
    day.showDropdown = !day.showDropdown;
  }

  async editDate(day: any, event: MouseEvent): Promise<void> {

    event.stopPropagation(); // prevent modal from opening
    this.selectedDate = new Date(day.date);
    this.loadTimeSlotsForDate(day.date); // load time slots

    this.showModal = true;
    day.showDropdown = false; // close dropdown

  }
  closeAllDropdowns(): void {
    this.days.forEach(day => day.showDropdown = false);
  }


}
