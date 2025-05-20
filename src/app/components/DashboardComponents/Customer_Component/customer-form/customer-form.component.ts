import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from '../../../../services/customer.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { tick } from '@angular/core/testing';
import { Customers } from '../../../../interface/customer.interface';

@Component({
  selector: 'app-customer-form',
  standalone: false,
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.css'
})
export class CustomerFormComponent {

  @Input() publicBooking: boolean = false; // For public booking
  @Input() CustomerId!: string;
  @Input() customerData!: Customers | null;
  //from the customer component in side the dashboard
  @Output() formSubmitted = new EventEmitter<any>();
  @Output() formClosed = new EventEmitter<string>();
  @Input() customerFormData: Customers | any = null;
  isUpdateMode = false;

  createCustomerForm!: FormGroup;
  submitted: boolean = false;
  buttonlabel: string = 'Create';
  loading: boolean = false;
  customerId: string | null = null;

  constructor(
    private customerService: CustomerService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    //create customer form
    this.createCustomerForm = this.fb.group({
      customerName: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: [''],
      state: [''],
      country: [''],
      zipCode: [''],
      city: [''],
      customerNote: ['']
    });
    if (this.customerFormData && this.customerFormData.id) {
      console.log("Edit the customer from the customer dashboard by this id:", this.customerFormData.id)
      this.CustomerId = this.customerFormData.id;
      this.buttonlabel = 'Update';
      this.createCustomerForm.patchValue(this.customerFormData); // Pre-fill the form with existing customer data
    } else {
      this.route.paramMap.subscribe(params => {
        this.customerId = params.get('id'); // Only if you're editing existing customers from the booking
        console.log("Edit customer from the update booking by this id with the help of active route:", this.CustomerId);
        if (this.customerData) {
          this.buttonlabel = 'Update';
          this.createCustomerForm.patchValue(this.customerData); // Pre-fill the form with existing customer data
        }
      });
    }

  }

  onSubmit() {

    if (this.createCustomerForm.invalid) {
      this.toastr.error('Please fix the form errors before submitting');
      this.createCustomerForm.markAllAsTouched();
      return;
    }

    if (this.submitted) return;

    this.loading = true;
    this.submitted = true;

    const formData = this.createCustomerForm.value;

    //Emit form data to parent in publicBooking mode
    if (this.publicBooking) {
      this.formSubmitted.emit(formData);
      this.resetSubmissionState();
      return
    }
    this.submitForm(); //Admin only internal creation
  }

  private submitForm(): void {
    const formData = this.createCustomerForm.value;

    if (this.customerId) {
      // Update existing customer
      console.log("update the customer by this id :", this.customerId)
      this.customerService.updateCustomer(this.customerId, formData)
        .then(res => {
          this.toastr.success('Customer updated successfully');
          this.formSubmitted.emit(formData);
          this.formClosed.emit('refresh');
          this.resetSubmissionState();
          console.log('Customer updated:', res);
        }).catch(error => {
          this.toastr.error('Failed to update customer');
          this.resetSubmissionState();
          console.error(error);
        });
    } else {
      // Create new customer
      // Check if customer already exists before adding
      console.log("create new customer:");
      this.customerService.addCustomer(formData)
        .then(id => {
          if (id && id.length > 0) {
            this.toastr.success('Customer created successfully');
            this.formSubmitted.emit({ ...formData, id });
            this.formClosed.emit('refresh');
            this.createCustomerForm.reset();
          } else {
            this.toastr.warning('Customer already exists');
          }
          this.resetSubmissionState();
        }).catch(error => {
          this.toastr.error('Failed to create the customer');
          this.resetSubmissionState();
          console.error(error);
        });
    }
  }

  private resetSubmissionState(): void {
    this.loading = false;
    this.submitted = false;
  }

  getFormControl(name: string) {
    return this.createCustomerForm.get(name);
  }
}
















