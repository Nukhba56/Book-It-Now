import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, doc, getDocs, updateDoc, query, where, Timestamp, deleteDoc, getDoc } from '@angular/fire/firestore';
import { FirebaseAuthService } from './firebase-auth.service';
import { Booking } from '../interface/CustomerBooking.interface'; // Make sure this interface exists
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TimeSlot } from '../interface/availability.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerBookingService {
  private afs = inject(Firestore);
  private authService = inject(FirebaseAuthService);

  constructor() { }

  private async getValidUser(): Promise<any> {
    return await this.authService.getAuthenticatedUser();
  }

  // ✅ 1. Create a Booking
  async createBooking(businessId: string, data: Booking): Promise<string> {
    const bookingRef = collection(this.afs, `Business_Owners/${businessId}/Customer_Bookings`);
    const newDoc = await addDoc(bookingRef, {
      ...data,
      businessId: businessId,
      createdAt: Timestamp.now(),
    });

    // Increment booking_made for the customer
    if (data.customerId) {
      const customerDocRef = doc(this.afs, `Business_Owners/${businessId}/Customers/${data.customerId}`);
      const customerSnap = await getDoc(customerDocRef);
      if (customerSnap.exists()) {
        const currentCount = customerSnap.data()['booking_made'] || 0;
        await updateDoc(customerDocRef, { booking_made: currentCount + 1, hasBooked: true });
      }
    }

    return newDoc.id;
  }

  // ✅ 2. Get All Bookings for Logged-in Business Owner
  getBookingsByBusiness(): Observable<Booking[]> {
    return from(this.getValidUser()).pipe(
      switchMap(async user => {
        const bookingRef = collection(this.afs, `Business_Owners/${user.uid}/Customer_Bookings`);
        const snapshot = await getDocs(bookingRef);

        return snapshot.docs.map(doc => {
          const data = doc.data() as Partial<Booking>; // Partial to avoid strict type checking
          return {
            id: doc.id,                      // Add the ID manually
            customerId: data.customerId || '',
            businessId: data.businessId || '',
            serviceId: data.serviceId || '',
            date: data.date || '',
            timeSlot: data.timeSlot || '',
            total_amount: data.total_amount || 0,
            payment: data.payment || {        // Ensure payment has a default structure
              cardNumber: '',
              expiryDate: '',
              cvc: '',
              cardholderName: ''
            },
            intent: data.intent || '',
            transactionId: data.transactionId || '',
            booking_Status: data.booking_Status || 'pending',
            payment_Status: data.payment_Status || 'pending',
            createdAt: data.createdAt || Timestamp.now(),
          } as Booking;
        });
      })
    );
  }

  // ✅ 3. Get Bookings by Customer ID
  getBookingsByCustomer(customerId: string): Observable<Booking[]> {
    return from(this.getValidUser()).pipe(
      switchMap(async user => {
        const bookingRef = collection(this.afs, `Business_Owners/${user.uid}/Customer_Bookings`);
        const q = query(bookingRef, where('customerId', '==', customerId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
          const data = doc.data() as Partial<Booking>; // Partial to avoid strict type checking
          return {
            id: doc.id,                      // Add the ID manually
            customerId: data.customerId || '',
            businessId: data.businessId || '',
            serviceId: data.serviceId || '',
            date: data.date || '',
            timeSlot: data.timeSlot || '',
            total_amount: data.total_amount || 0,
            payment: data.payment || {        // Ensure payment has a default structure
              cardNumber: '',
              expiryDate: '',
              cvc: '',
              cardholderName: ''
            },
            intent: data.intent || '',
            transactionId: data.transactionId || '',
            booking_Status: data.booking_Status || 'pending',
            payment_Status: data.payment_Status || 'pending',
            createdAt: data.createdAt || Timestamp.now(),
          } as Booking;
        });
      })
    );
  }
  // ✅ 4. Update Booking Status or Details
  async updateBooking(bookingId: string, updatedData: Partial<Booking>): Promise<void> {
    const user = await this.getValidUser();
    const bookingDoc = doc(this.afs, `Business_Owners/${user.uid}/Customer_Bookings/${bookingId}`);
    await updateDoc(bookingDoc, updatedData);
  }

  // ✅ 5. Delete Booking
  async deleteBooking(bookingId: string): Promise<void> {
    const user = await this.getValidUser();
    const bookingDoc = doc(this.afs, `Business_Owners/${user.uid}/Customer_Bookings/${bookingId}`);
    await deleteDoc(bookingDoc);
  }

  async getServiceAndCustomerNameMaps(): Promise<{
    serviceMap: Record<string, string>,
    customerMap: Record<string, string>
  }> {
    const user = await this.getValidUser();
    const businessId = user.uid;

    const [serviceSnapshort, customerSnapshot] = await Promise.all([
      getDocs(collection(this.afs, `Business_Owners/${businessId}/Services`)),
      getDocs(collection(this.afs, `Business_Owners/${businessId}/Customers`))
    ]);

    const serviceMap: Record<string, string> = {};
    const customerMap: Record<string, string> = {};

    serviceSnapshort.forEach(doc => {

      serviceMap[doc.id] = doc.data()['name'] as string;

    });

    customerSnapshot.forEach(doc => {

      customerMap[doc.id] = doc.data()['customerName'] as string;

    });

    return {
      serviceMap,
      customerMap
    };
  }
  // ✅ Get Booking Metadata for Private Route (Business Dashboard)
  async getPrivateBookingLinkMetadata(): Promise<any> {
    const user = await this.getValidUser();
    const businessId = user.uid;

    const metadataRef = doc(this.afs, `Business_Owners/${businessId}/Customer_Bookings`);
    const metadataSnap = await getDoc(metadataRef);

    if (metadataSnap.exists()) {
      return metadataSnap.data();
    } else {
      return null;
    }
  }

  // ✅ Get Services for Private Booking Link (Dashboard)
  async getPrivateBookingLinkServices(): Promise<any[]> {
    const user = await this.getValidUser();
    const businessId = user.uid;

    const servicesRef = collection(this.afs, `Business_Owners/${businessId}/Services`);
    const snapshot = await getDocs(servicesRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  // Get booked slots for a specific business, service, and date
  async getBookedSlots(businessId: string, serviceId: string, date: string): Promise<string[]> {
    const bookingRef = collection(this.afs, `Business_Owners/${businessId}/Customer_Bookings`);
    const q = query(bookingRef, where('serviceId', '==', serviceId), where('date', '==', date));
    const snapshot = await getDocs(q);
    // Return an array of timeSlot strings that are already booked
    return snapshot.docs.map(doc => (doc.data() as any).timeSlot);
  }

}
