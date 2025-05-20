import { BookingLink } from './../interface/bookinglink.interface';
import { Injectable, inject } from '@angular/core';
import { Firestore, setDoc} from '@angular/fire/firestore';
import { addDoc, collection, collectionData, deleteDoc, doc, docData, DocumentReference, getDoc, getDocs, query, updateDoc } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { FirebaseAuthService } from './firebase-auth.service';


@Injectable({
  providedIn: 'root',
})
export class BookingLinkService {
  private firestore: Firestore = inject(Firestore);
  private authService = inject(FirebaseAuthService)
  private auth: Auth = inject(Auth);
  bookingData: BookingLink | undefined;



  constructor() { }

    async getValidUser(): Promise<User>{
     return await this.authService.getAuthenticatedUser();
    }

  // Add a new booking link (only if not already exists)
  async createBookingLink(bookingData: any ):Promise<void>{

   const user = await this.getValidUser();
    const bookingLinkDocRef = doc(this.firestore, `Business_Owners/${user.uid}/Booking_Links/bookingLinkData`);
    const existingDoc = await getDoc(bookingLinkDocRef);
    if(existingDoc.exists()){
      throw new Error('Booking link already exists. Please update it instead.');
    }
    await setDoc(bookingLinkDocRef, bookingData);

  }

  //update booking link
  async updateBookingLink(bookingData: any):Promise<void>{

    const user = await this.getValidUser();
    const bookingLinkDocRef = doc(this.firestore, `Business_Owners/${user.uid}/Booking_Links/bookingLinkData`);
    const existingDoc = await getDoc(bookingLinkDocRef);
    if(!existingDoc.exists()){
      throw new Error('Booking link does not exist. Please create it first.');
    }
    await updateDoc(bookingLinkDocRef, bookingData);
  }

  // method to get booking link by business owner ID(for social media)
  async getBookingLinkByBusinessOwnerId(): Promise<any> {

    const user = await this.getValidUser();
    const bookingLinkRef = doc(this.firestore, `Business_Owners/${user.uid}/Booking_Links/bookingLinkData`);
    const snapshot = await getDoc(bookingLinkRef);
    return snapshot.exists() ? snapshot.data() : null;

  }

  // fetch services libked to booking link
  async getBookingLinkServices(): Promise<any[]> {

    const user = await this.getValidUser();
    const bookingLinkRef = collection(this.firestore, `Business_Owners/${user.uid}/Booking_Link/bookingLinkData/Services`);
    const snapshot = await getDocs(bookingLinkRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  };

  //get services of this business
  async getBusinessOwnerService(): Promise<any[]>{
    const user = await this.getValidUser();
    const serviceRef = collection(this.firestore , `Business_Owners/${user.uid}/Services`);
    const snapshot = await getDocs(serviceRef);
    return snapshot.docs.map(doc => ({
      id: doc.id, ...doc.data()}));
  }

  async addServiceIdToBookingLinkMetadata(serviceId: string) : Promise<void>{
    const user = await this.getValidUser();
    const bookingLinkRef = doc(this.firestore, `Business_Owners/${user.uid}/Booking_Links/bookingLinkData`);
    const metadataSnapshot = await getDoc(bookingLinkRef);
    if(!metadataSnapshot.exists()){
      throw new Error('No booking link found. Please create it first');

    }
    const exitingMetadata = metadataSnapshot.data();
    const currentServices: string[] = exitingMetadata['services'] || [];

    if(!currentServices.includes(serviceId)){
      const updatedServices = [...currentServices , serviceId];
      await updateDoc(bookingLinkRef , {
        services : updatedServices,
      });
      console.log(`Service ID ${serviceId} added to booking link metadata`);
    }
    else {
      console.log(`Service ID ${serviceId} already exists in booking link`);
    }
  }

  async removeServiceIdFromBookingLinkMetadata(serviceId: string): Promise<void> {
    const user = this.auth.currentUser?.uid;
    if (!user) {
      throw new Error('User not authenticated');
    }



    const bookingLinkRef = doc(this.firestore, `Business_Owners/${user}/Booking_Links/bookingLinkData`);
    const metadataSnapshot = await getDoc(bookingLinkRef);

    if (!metadataSnapshot.exists()) return;

    const metadata = metadataSnapshot.data();
    const currentServices: string[] = metadata['services'] || [];

    const updatedServices = currentServices.filter(id => id !== serviceId);

    await updateDoc(bookingLinkRef, { services: updatedServices });
  }

  //get public metadat
  async getPublicBookingLinkMetadata(businessId: string): Promise<any>{

    const bookingLinkRef = doc(this.firestore, `Business_Owners/${businessId}/Booking_Links/bookingLinkData`);
    const snapshot = await getDoc(bookingLinkRef);
    return snapshot.exists() ? snapshot.data() : null;

  }

  // Get public services
async getPublicBookingLinkServices(businessId: string): Promise<any[]> {
  const servicesRef = collection(this.firestore, `Business_Owners/${businessId}/Services`);
  const snapshot = await getDocs(servicesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

}
