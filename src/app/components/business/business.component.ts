import { FirestoreService } from './../../services/firestore.service';
import { BusinessService } from './../../services/business.service';
import { Component, EventEmitter, inject, input, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {ToastrService} from 'ngx-toastr';
import { Storage , getDownloadURL, ref , uploadBytes, uploadBytesResumable } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';
import { BusinessOwner } from '../../interface/business-owner.interface';
import { mapForFormValues } from '../../services/mapAllFormValues';

@Component({
  selector: 'app-business',
  standalone: false,
  templateUrl: './business.component.html',
  styleUrl: './business.component.css',
})
export class BusinessComponent implements OnInit{

  @Output() formSubmitted = new EventEmitter<BusinessOwner>();
  @Output() formClosed = new EventEmitter<string>();
  @Input() businessData: BusinessOwner | null = null;

  loading: boolean = false;
  submitted: boolean = false;
  logoFile: File | null = null;
  buttonLabel: string = 'Create';
  businessId: string | null = null;
  businessDetailForm!: FormGroup;
  auth = inject(Auth);
  showUpdateForm = false;

  constructor(
    private formBuilder: FormBuilder,
    private toastrService: ToastrService,
    private firestoreService: FirestoreService,
    private storage : Storage,
  ) { }

  ngOnInit(): void {
    this.businessDetailForm = this.formBuilder.group({
      businessName: ['' , Validators.required],
      detail:[''],
      address: [''],
      state: [''],
      city: [''],
      code: [''],
      contactNumber: ['' , [Validators.required,]],
      primaryEmail: ['', [Validators.required, Validators.email]],
      image: [''],
    });

    if (this.businessData) {
      console.log("Editing business:", this.businessData.id);
      this.businessId = this.businessData.id;
      this.buttonLabel = 'Update';
      this.prefillForm(this.businessData);
    }
  }

  private prefillForm(businessData: BusinessOwner) {
    mapForFormValues(this.businessDetailForm, businessData, {
      businessName: (formData) => formData.business_name || '',
      detail: (formData) => formData.detail || '',
      address: (formData) => formData.address || '',
      state: (formData) => formData.state || '',
      city: (formData) => formData.city || '',
      code: (formData) => formData.code || '',
      contactNumber: (formData) => formData.contactNumber || '',
      primaryEmail: (formData) => formData.primaryEmail || '',
      image: (formData) => formData.logoFileInput || '',
    });
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastrService.error('Image size should be less than 5MB', 'Upload Failed');
        return;
      }
      // Check file type
      if (!file.type.match(/image\/(png|jpeg|jpg|gif)$/)) {
        this.toastrService.error('Only PNG, JPEG, JPG and GIF files are allowed', 'Invalid File Type');
        return;
      }
      this.logoFile = file;
      this.toastrService.success('Image selected successfully', 'Success');
      console.log('Selected logo file:', this.logoFile);
    }
  }

  openUpdateForm() {
    this.showUpdateForm = true;
    if (this.businessData) {
      this.businessDetailForm.patchValue({
        businessName: this.businessData.business_name || '',
        detail: this.businessData.detail || '',
        address: this.businessData.address || '',
        state: this.businessData.state || '',
        city: this.businessData.city || '',
        code: this.businessData.code || '',
        contactNumber: this.businessData.contactNumber || '',
        primaryEmail: this.businessData.primaryEmail || ''
      });
    }
  }

  cancelUpdate() {
    this.showUpdateForm = false;
    this.businessDetailForm.reset();
    if (this.businessData) {
      this.businessDetailForm.patchValue({
        businessName: this.businessData.business_name || '',
        detail: this.businessData.detail || '',
        address: this.businessData.address || '',
        state: this.businessData.state || '',
        city: this.businessData.city || '',
        code: this.businessData.code || '',
        contactNumber: this.businessData.contactNumber || '',
        primaryEmail: this.businessData.primaryEmail || ''
      });
    }
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;

    if(this.businessDetailForm.invalid) {
      const controls = this.businessDetailForm.controls;
      for (const name in controls) {
        if (controls[name].invalid) {
          let errorMessage = `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
          if (controls[name].errors?.['email']) {
            errorMessage = 'Please enter a valid email address';
          }
          this.toastrService.error(errorMessage, 'Validation Error');
        }
      }
      return;
    }

    this.loading = true;
    console.log(this.businessDetailForm.value);
    const user = await this.auth.currentUser;

    if (!user) {
      this.toastrService.error('User not authenticated', 'Authentication Error');
      this.loading = false;
      return;
    }

    const formValues = this.businessDetailForm.value;
    const businessOwner: BusinessOwner = {
      id: this.businessId || user.uid,
      name: user.displayName || '',
      email: user.email || '',
      business_name: formValues.businessName,
      address: formValues.address,
      state: formValues.state,
      city: formValues.city,
      code: formValues.code,
      contactNumber: formValues.contactNumber,
      detail: formValues.detail,
      primaryEmail: formValues.primaryEmail,
      logoFileInput: null,
      stripe_id: this.businessData?.stripe_id || null,
      created_at: this.businessData?.created_at || new Date().toISOString(),
    };

    try {
      if (this.businessId) {
        // Update existing business
        await this.firestoreService.updateBusinessOwner(this.businessId, businessOwner);
        this.toastrService.success('Business details updated successfully', 'Success');
      } else {
        // Create new business
        await this.firestoreService.addBusinessOwner(businessOwner);
        this.toastrService.success('Business details saved successfully', 'Success');
      }

      this.loading = false;
      this.submitted = false;
      this.formSubmitted.emit(businessOwner);
      this.formClosed.emit('refresh');

      if (!this.businessId) {
        this.businessDetailForm.reset();
      }
    } catch(error: any) {
      console.error('Error saving business owner:', error);
      this.toastrService.error(error.message || 'Failed to save business details', 'Error');
      this.loading = false;
      this.submitted = false;
    }
  }
}
