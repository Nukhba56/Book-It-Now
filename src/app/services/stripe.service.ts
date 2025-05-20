import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Stripe, loadStripe } from '@stripe/stripe-js';
import { environment } from '../../enviornments/environment';

export interface StripeAccountResponse {
  url: string;
  account_id: string;
}

export interface StripeAccountRequest {
  business_id: string;
  business_name: string;
  email: string;
}

export interface PaymentIntentRequest {
  amount: number;
  business_id: string;
  customer_email?: string;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private readonly API_URL = 'http://localhost:3000';
  private stripePromise: Promise<Stripe | null>;

  constructor(private http: HttpClient) {
    this.stripePromise = loadStripe(environment.stripePublishableKey);
  }

  async getStripe(): Promise<Stripe | null> {
    return await this.stripePromise;
  }

  createAccountLink(businessInfo: StripeAccountRequest): Observable<StripeAccountResponse> {
    return this.http.post<StripeAccountResponse>(`${this.API_URL}/create-account-link`, businessInfo);
  }

  // Check the onboarding status
  checkAccountStatus(accountId: string): Observable<any> {
    return this.http.get(`${this.API_URL}/stripe/account-status/${accountId}`);
  }

  // Store the Stripe account ID for the business
  storeStripeAccountId(businessId: string, accountId: string): Observable<any> {
    return this.http.post(`${this.API_URL}/stripe/store-account`, {
      business_id: businessId,
      account_id: accountId
    });
  }

  // Create a payment intent
  createPaymentIntent(request: PaymentIntentRequest): Observable<PaymentIntentResponse> {
    return this.http.post<PaymentIntentResponse>(`${this.API_URL}/create-payment-intent`, request);
  }

  // Process the payment with card details
  async processPayment(
    clientSecret: string,
    cardElement: any,
    billingDetails: {
      name: string;
      email: string;
    }
  ): Promise<{ error?: any; paymentIntent?: any }> {
    try {
      const stripe = await this.getStripe();
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: billingDetails
        }
      });

      if (result.error) {
        throw result.error;
      }
      return { paymentIntent: result.paymentIntent };
    } catch (error) {
      return { error };
    }
  }
  // Get payment status
  getPaymentStatus(paymentIntentId: string): Observable<any> {
    return this.http.get(`${this.API_URL}/payment-status/${paymentIntentId}`);
  }
}
