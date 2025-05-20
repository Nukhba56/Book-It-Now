import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StripeService } from '../../services/stripe.service';
import { BusinessOwner } from '../../interface/business-owner.interface';
import { FirestoreService } from '../../services/firestore.service';
import { FirebaseAuthService } from '../../services/firebase-auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-business-setup',
  standalone: false,
  templateUrl: './business-setup.component.html',
  styleUrl: './business-setup.component.css'
})
export class BusinessSetupComponent implements OnInit {
  progress = 0; // Progress percentage
  currentStep = 1;
  businessOwner: BusinessOwner = {
    id: '',
    name: '',
    email: '',
    business_name: '',
    created_at: '',
    stripe_id: null
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private stripeService: StripeService,
    private firestoreService: FirestoreService,
    private authService: FirebaseAuthService,
    private toastr: ToastrService
  ) { }

  async ngOnInit() {
    try {
      // Get the current authenticated user
      const user = await this.authService.getAuthenticatedUser();
      if (user) {
        this.businessOwner.id = user.uid;
        this.businessOwner.email = user.email || '';
        this.businessOwner.name = user.displayName || '';

        // Get the full business owner data from Firestore
        this.firestoreService.getBusinessOwner(user.uid).subscribe(owner => {
          if (owner) {
            this.businessOwner = { ...owner };
          }
        });
      }

      this.route.queryParams.subscribe(params => {
        const step = +params['step'] || 1;
        this.currentStep = step;

        const success = params['success'];
        const accountId = params['account_id'];

        console.log("stripe account and step:", accountId, step);

        if (success === 'true' && accountId && !this.businessOwner.stripe_id) {
          console.log("call the handle stripe redirect:");
          this.handleStripeRedirect(accountId);
          // Show success message when returning from Stripe
          this.toastr.success('Stripe account setup completed successfully!', 'Setup Complete');
        }
      });
    } catch (error) {
      console.error('Error in ngOnInit:', error);
      this.toastr.error('Failed to initialize business setup', 'Error');
    }
  }

  handleStripeRedirect(accountId: string) {
    if (!this.businessOwner.id) {
      console.error('No business owner ID available');
      this.toastr.error('Business owner information not found', 'Error');
      return;
    }

    this.stripeService.checkAccountStatus(accountId).subscribe({
      next: async (status) => {
        if (status.details_submitted) {
          try {
            // Update the Stripe ID in Firestore
            await this.firestoreService.updateBusinessOwner(this.businessOwner.id, {
              stripe_id: accountId
            });

            // Update local businessOwner object
            this.businessOwner.stripe_id = accountId;
            console.log('Stripe account ID saved successfully:', accountId);
            this.toastr.success('Payment system is now ready to use', 'Stripe Setup Complete');

            // Force navigation to step 3
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { step: 3 },
              queryParamsHandling: 'merge'
            });
          } catch (error) {
            console.error('Error saving Stripe account ID:', error);
            this.toastr.error('Failed to save Stripe account information', 'Error');
          }
        } else {
          console.log('Stripe onboarding not completed');
          this.toastr.warning('Stripe account setup is incomplete', 'Setup Incomplete');
        }
      },
      error: (error) => {
        console.error('Error checking account status:', error);
        this.toastr.error('Failed to verify Stripe account status', 'Error');
      }
    });
  }

  nextStep() {
    if (this.currentStep < 4) {
      this.currentStep++;
      this.progress = (this.currentStep / 4) * 100;
      // Update URL with new step
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { step: this.currentStep },
        queryParamsHandling: 'merge'
      });
    } else if (this.currentStep === 4) {
      // Allow proceeding to dashboard if business name exists
      this.router.navigate(['/dashboard/home']);

    } else {
      console.error('Cannot proceed to dashboard: Business setup incomplete');
    }
  }

  onBusinessFormSubmitted(businessOwner: BusinessOwner) {
    console.log('Business details saved:');
    this.businessOwner = {
      ...this.businessOwner,
      ...businessOwner,
      stripe_id: this.businessOwner.stripe_id // Preserve stripe_id
    };
    console.log(this.businessOwner);
    this.nextStep();
  }

  onServiceFormSubmitted() {
    console.log('Service details saved:');
    this.nextStep();
  }

  skip() {
    this.nextStep();
  }

  onBookingLinkFormSubmitted() {
    console.log('Booking link details saved:');
    this.nextStep();
  }

  startOnboarding() {
    console.log(this.businessOwner);
    if (!this.businessOwner.id || !this.businessOwner.business_name || !this.businessOwner.email) {
      console.error('Missing required business information');
      return;
    }

    const requestData = {
      business_id: this.businessOwner.id,
      business_name: this.businessOwner.business_name,
      email: this.businessOwner.email
    };

    this.stripeService.createAccountLink(requestData).subscribe({
      next: (response) => {
        localStorage.setItem('stripe_account_id', response.account_id);
        window.location.href = response.url;
      },
      error: (error) => {
        console.error('Error creating Stripe account:', error);
      }
    });
  }

  back() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.progress = (this.currentStep / 4) * 100;
      // Update URL with new step
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { step: this.currentStep },
        queryParamsHandling: 'merge'
      });
    }
  }
}
