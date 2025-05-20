import { Firestore } from '@angular/fire/firestore';
import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Auth } from '@angular/fire/auth';
import { BookingLinkService } from '../../../../services/bookinglink.service';

@Component({
  selector: 'app-booking-link-form',
  standalone: false,
  templateUrl: './booking-link-form.component.html',
  styleUrl: './booking-link-form.component.css'
})
export class BookingLinkFormComponent implements OnInit {

  bookingLinkForm! : FormGroup;
  services: any[] = [];
  loading: boolean = false;
  buttonLabel: string = 'Create Link';
  submitted: boolean = false;
  @Output() formSubmitted = new EventEmitter<void>();

  auth = inject(Auth);
  Firestore = inject(Firestore);

  constructor(private formBuilder: FormBuilder,
              private toastr: ToastrService,
              private bookingLinkService : BookingLinkService) { }

  ngOnInit(): void {
    this.bookingLinkForm = this.formBuilder.group({
      linkName: ['' , Validators.required],
      description: ['' , Validators.required],
      services: [[] ,Validators.required],
      note: [''],
    });
    this.loadServices();
  }

  async loadServices() {
  try {
    this.services = await this.bookingLinkService.getBusinessOwnerService();
    console.log('Loaded services:', this.services);
  }catch (error) {
    console.error('Error loading services:', error);
    this.toastr.error('Failed to load services. Please try again later.');

  }
}

async onSubmit() {
  this.submitted = true;
  if (this.bookingLinkForm.invalid) {
    this.toastr.warning('Please fill all required fields.', 'Validation Error');
    return;
  }

  this.loading = true;
  const formData = this.bookingLinkForm.value;

  const bookingData = {
    name: formData.linkName,
    description: formData.description,
    services: formData.services,
    note: formData.note,
    createdAt: new Date().toISOString()
  };

  try {
    await this.bookingLinkService.createBookingLink(bookingData);
    this.toastr.success('Booking link created successfully!', 'Success');
    this.formSubmitted.emit();
  } catch (error: any) {
    console.error('Creation failed:', error);
    this.toastr.error('Booking link already exists or something went wrong.', 'Error');
  }

  this.loading = false;
  this.submitted = false;
}





}
