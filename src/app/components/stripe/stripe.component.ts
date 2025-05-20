import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { StripeService } from '../../services/stripe.service';
import { environment } from '../../../enviornments/environment';
import { loadStripe, Stripe } from '@stripe/stripe-js';

interface CustomerDetails {
  name: string;
  email: string;
}

@Component({
  selector: 'app-stripe',
  standalone: false,
  templateUrl: './stripe.component.html',
  styleUrl: './stripe.component.css'
})
export class StripeComponent implements OnInit {

  // @Input() amount!: number;
  // @Input() businessId!: string;
  // @Input() customerData?: CustomerDetails;
  // @Output() paymentFailure = new EventEmitter<any>();

  @Output() paymentSuccess = new EventEmitter<{ transactionId: string }>();

  isPaymentProcessing: boolean = false;
  stripe: Stripe | null = null;
  cardElement: any;
  expiryElement: any;
  cvcElement: any;
  @Input() clientSecret: string = '';
  @Input() intent: string = '';

  constructor(private stripeService: StripeService) {}

  async ngOnInit() {
    try {
      // Get Stripe instance from the service
      this.stripe = await this.stripeService.getStripe();

      if (this.stripe) {
        const elements = this.stripe.elements();
        this.cardElement = elements.create('cardNumber');
        this.expiryElement = elements.create('cardExpiry');
        this.cvcElement = elements.create('cardCvc');
        this.cardElement.mount('#card-element');
        this.expiryElement.mount('#expiry-element');
        this.cvcElement.mount('#cvc-element');
      } else {
        console.error('Failed to initialize Stripe');
      }
    } catch (error) {
      console.error('Error initializing Stripe:', error);
    }
  }

  async triggerPayment(name: any): Promise<{ success: boolean; message?: string; transactionId?: string }> {
    this.isPaymentProcessing = true;
    console.log('Client Secret:', this.clientSecret);

    if (!this.clientSecret || !this.clientSecret.includes('_secret_') || !this.stripe) {
        console.error('Client secret is missing or invalid');
        this.isPaymentProcessing = false;
        return { success: false, message: 'Invalid client secret' };
    }

    try {
        const result = await this.stripe?.confirmCardPayment(this.clientSecret, {
            payment_method: {
                card: this.cardElement,
                billing_details: name,
            },
        });

        console.log("Payment result:", result);

        this.isPaymentProcessing = false;
        if (result?.error) {
            console.error('Payment failed:', result?.error);
            return { success: false, message: result?.error.message };
        }
        if (result?.paymentIntent) {
            console.log('Payment successful:', result.paymentIntent);
            this.paymentSuccess.emit({ transactionId: result.paymentIntent.id });
            return { success: true, transactionId: result.paymentIntent.id };
        }
        return { success: false, message: 'Payment not completed.' };
    } catch (error) {
        console.error('Payment error:', error);
        this.isPaymentProcessing = false;
        return { success: false, message: 'An error occurred during payment processing.' };
    }
  }
}
