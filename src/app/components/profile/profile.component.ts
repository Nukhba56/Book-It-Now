import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FirebaseAuthService } from '../../services/firebase-auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { BusinessOwner } from '../../interface/business-owner.interface';
import { ToastrService } from 'ngx-toastr';
import { updatePassword } from '@angular/fire/auth';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  businessOwner: BusinessOwner | undefined;
  showUpdateForm = false;
  updateForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: FirebaseAuthService,
    private firestoreService: FirestoreService,
    private toastr: ToastrService
  ) {
    this.updateForm = this.fb.group({
      name: ['', Validators.required],
      password: ['', [Validators.minLength(6)]],
      confirmPassword: ['']
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.loadProfileData();
  }

  async loadProfileData() {
    try {
      const user = await this.authService.getAuthenticatedUser();
      if (user) {
        this.firestoreService.getBusinessOwner(user.uid).subscribe(
          (owner) => {
            if (owner) {
              this.businessOwner = owner;
              // Pre-fill the form with current name
              this.updateForm.patchValue({
                name: owner.name || ''
              });
            }
          },
          (error) => {
            console.error('Error loading profile:', error);
            this.toastr.error('Failed to load profile data');
          }
        );
      }
    } catch (error) {
      this.toastr.error('Failed to load profile data');
      console.error('Error loading profile:', error);
    }
  }

  openUpdateForm() {
    this.showUpdateForm = true;
    if (this.businessOwner) {
      this.updateForm.patchValue({
        name: this.businessOwner.name || '',
        password: '',
        confirmPassword: ''
      });
    }
  }

  cancelUpdate() {
    this.showUpdateForm = false;
    this.updateForm.reset();
    if (this.businessOwner) {
      this.updateForm.patchValue({
        name: this.businessOwner.name || ''
      });
    }
  }

  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password');
    const confirmPassword = g.get('confirmPassword');

    if (password?.value && confirmPassword?.value) {
      return password.value === confirmPassword.value ? null : { 'passwordMismatch': true };
    }
    return null;
  }

  async onSubmit() {
    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    try {
      const user = await this.authService.getAuthenticatedUser();
      if (!user || !this.businessOwner) {
        throw new Error('User not authenticated');
      }

      const updates: Partial<BusinessOwner> = {};

      // Update name if changed
      const newName = this.updateForm.get('name')?.value;
      if (newName && newName !== this.businessOwner.name) {
        updates.name = newName;
      }

      // Update name in Firestore if changed
      if (Object.keys(updates).length > 0) {
        await this.firestoreService.updateBusinessOwner(user.uid, updates);
      }

      // Update password if provided
      const newPassword = this.updateForm.get('password')?.value;
      if (newPassword) {
        await updatePassword(user, newPassword);
      }

      this.toastr.success('Profile updated successfully');
      this.showUpdateForm = false;
      await this.loadProfileData(); // Reload the profile data
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.code === 'auth/requires-recent-login') {
        this.toastr.error('Please log out and log in again to update your password');
      } else {
        this.toastr.error('Failed to update profile');
      }
    } finally {
      this.isSubmitting = false;
    }
  }
}
