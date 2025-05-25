import { Firestore } from '@angular/fire/firestore';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
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
  @Input() bookingLinkData: any = null;
  @Output() formSubmitted = new EventEmitter<void>();
  @Output() formClosed = new EventEmitter<void>();

  bookingLinkForm!: FormGroup;
  services: any[] = [];
  loading: boolean = false;
  buttonLabel: string = 'Create Link';
  submitted: boolean = false;
  isEditMode: boolean = false;

  auth = inject(Auth);
  Firestore = inject(Firestore);

  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private bookingLinkService: BookingLinkService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadServices();
    if (this.bookingLinkData) {
      this.isEditMode = true;
      this.buttonLabel = 'Update Link';
      this.prefillForm();
    }
  }

  private initializeForm() {
    this.bookingLinkForm = this.formBuilder.group({
      linkName: ['', Validators.required],
      description: ['', Validators.required],
      services: [[], Validators.required],
      note: [''],
    });
  }

  private prefillForm() {
    if (this.bookingLinkData) {
      this.bookingLinkForm.patchValue({
        linkName: this.bookingLinkData.name || '',
        description: this.bookingLinkData.description || '',
        services: this.bookingLinkData.services || [],
        note: this.bookingLinkData.note || ''
      });
    }
  }

  async loadServices() {
    try {
      this.services = await this.bookingLinkService.getBusinessOwnerService();
      console.log('Loaded services:', this.services);
    } catch (error) {
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
      createdAt: this.bookingLinkData?.createdAt || new Date().toISOString()
    };

    try {
      if (this.isEditMode) {
        await this.bookingLinkService.updateBookingLink(bookingData);
        this.toastr.success('Booking link updated successfully!', 'Success');
      } else {
        await this.bookingLinkService.createBookingLink(bookingData);
        this.toastr.success('Booking link created successfully!', 'Success');
      }
      this.formSubmitted.emit();
      this.resetForm();
    } catch (error: any) {
      console.error('Operation failed:', error);
      this.toastr.error(error.message || 'Something went wrong.', 'Error');
    }

    this.loading = false;
    this.submitted = false;
  }

  resetForm() {
    this.bookingLinkForm.reset();
    this.submitted = false;
    this.isEditMode = false;
    this.buttonLabel = 'Create Link';
    this.formClosed.emit();
  }

  cancel() {
    this.resetForm();
  }
}
