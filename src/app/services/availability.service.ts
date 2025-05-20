import { addDoc, collection, doc, Firestore, getDocs, query, setDoc, where, writeBatch } from '@angular/fire/firestore';
import { inject, Injectable } from "@angular/core";
import { Availability, TimeSlot } from '../interface/availability.model';
import { FirebaseAuthService } from './firebase-auth.service';
import { User } from '@angular/fire/auth';
import { getDoc } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })

export class AvailabilityService {

  firestore = inject(Firestore);
  private authService = inject(FirebaseAuthService);

  constructor() { }

  async getValidUser(): Promise<User> {
    return await this.authService.getAuthenticatedUser();
  }

  // Save or update availability

  async saveAvailability(serviceId: string, availability: Availability): Promise<void> {
    const user = await this.getValidUser();
    const docRef = doc(this.firestore, `Business_Owners/${user.uid}/Services/${serviceId}/Availabilities/${availability.date}`);
    await setDoc(docRef, availability, { merge: true });

    // Save time slots in a subcollection
    const timeSlotsCollection = collection(docRef, 'TimeSlots');
    const batch = writeBatch(this.firestore);

    //

    availability.slots.forEach(slot => {
      const slotRef = doc(timeSlotsCollection); // Auto-generated ID
      batch.set(slotRef, slot);
    });

    return batch.commit();
  }


  //fetch availability for a specific date
  async getAvailability( serviceId: string, date: string): Promise<Availability | null> {

    const businessId = await this.getValidUser();
    const path = `Business_Owners/${businessId.uid}/Services/${serviceId}/Availabilities`;
    const q = query(collection(this.firestore, path), where('date', '==', date));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as Availability;
    }
    return null;
  }

  //Fetch all availability within a date range


  async getAvailabilities(serviceId: string, startDate: string, endDate: string): Promise<Availability[]> {
    const user = await this.getValidUser();
    const availabilitiesRef = collection(this.firestore, `Business_Owners/${user.uid}/Services/${serviceId}/Availabilities`);
    const q = query(availabilitiesRef, where('date', '>=', startDate), where('date', '<=', endDate));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Availability);
  }

 async addAvailabilitySlot(serviceId: string, date: string, slots: TimeSlot[]) {

    const businessId = await this.getValidUser();
    const availabilityRef = doc(
      this.firestore,
      `Business_Owners/${businessId.uid}/Services/${serviceId}/Availabilities/${date}`
    );

    // Add the availability document (just the date metadata)
    return setDoc(availabilityRef, { date }, { merge: true }).then(() => {
      const timeSlotsCollection = collection(availabilityRef, 'TimeSlots');
      const batch = writeBatch(this.firestore);

      slots.forEach((slot) => {
        const slotRef = doc(timeSlotsCollection);
        batch.set(slotRef, slot);
      });

      return batch.commit();
    });
  }

  async getAvailableSlots(serviceId: string, date: string) {

    const businessId = await this.getValidUser();
    const timeSlotsCollection = collection(
      this.firestore,
      `Business_Owners/${businessId.uid}/Services/${serviceId}/Availabilities/${date}/TimeSlots`
    );
    const snapshot = await getDocs(timeSlotsCollection);
    return snapshot.docs.map(doc => doc.data() as TimeSlot);
  }

  async getAvailableSlotsForCustomer(businessId: string, serviceId: string, date: string): Promise<TimeSlot[]> {
    const timeSlotsCollection = collection( this.firestore,
      `Business_Owners/${businessId}/Services/${serviceId}/Availabilities/${date}/TimeSlots`
    );

    const snapshot = await getDocs(timeSlotsCollection);
    return  snapshot.docs.map(doc => doc.data() as TimeSlot);

  }

  async getAvailabilitiesForCustomer(businessId: string, serviceId: string, startDate: string, endDate: string) {
    const availabilitiesRef = collection(this.firestore, `Business_Owners/${businessId}/Services/${serviceId}/Availabilities`);
    const q = query(availabilitiesRef, where('date', '>=', startDate), where('date', '<=', endDate));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Availability);
  }
}
