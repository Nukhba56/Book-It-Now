import { Timestamp } from '@angular/fire/firestore';

export interface Booking {
  id?: string,
  customerId?: string;                // ID of the customer making the booking
  businessId?: string;                // ID of the business being booked
  serviceId?: string;                 // ID of the service being booked
  date?: string;                      // Selected date for the booking (ISO date string or custom format)
  timeSlot?: string;                  // Selected time slot for the booking
  total_amount?: number;              // Total amount for the booking (fee of the service)
  payment?: PaymentDetails;           // Payment form data (should be defined as a separate interface)
  intent?: string;                    // Payment Intent ID (from Stripe)
  transactionId?: string;             // Transaction ID (from Stripe)
  booking_Status?: 'pending' | 'confirmed' | 'completed' | 'canceled'; // Booking status
  payment_Status?: 'pending' | 'paid' | 'failed';   // Payment status
  createdAt?: Timestamp;              // Timestamp when the booking was created
}

export interface PaymentDetails {
  cardNumber: string;                // Card number used for payment (masked for security)
  expiryDate: string;                // Expiry date of the card (MM/YY)
  cvc: string;                      // CVC code (masked for security)
  cardholderName: string;            // Name of the cardholder
}
