
import { Injectable, inject } from '@angular/core';
import { User } from '@angular/fire/auth';
import { addDoc, collection, collectionData, deleteDoc, doc, docData, DocumentReference, Firestore, getDoc, getDocs, query, setDoc, updateDoc, where } from '@angular/fire/firestore';
import { Observable, throwError } from 'rxjs';
import { Service } from '../interface/service.interface';
import { BookingLink } from '../interface/bookinglink.interface';
import { FirebaseAuthService } from './firebase-auth.service';

@Injectable({
  providedIn: 'root',
})
export class ServiceService {

  private firestore = inject(Firestore);
  private authService = inject(FirebaseAuthService);
  bookingLinkData: BookingLink | undefined;
  serviceData: Service | undefined;


  constructor() { }

  private async getValidUser(): Promise<User> {
    return await this.authService.getAuthenticatedUser();
  }

  // Add a new service to Firestore
  async addService(serviceData: any): Promise<any> {
    const user = await this.getValidUser();
    const serviceRef = collection(this.firestore, `Business_Owners/${user.uid}/Services`);
    const docRef = await addDoc(serviceRef, serviceData);;
    return docRef;  // return the reference or ID
  }

  // Get all services from Firestore
  async getMyServices(): Promise<any[]> {

    const user = await this.getValidUser();
    const serviceRef = collection(this.firestore, `Business_Owners/${user.uid}/Services`);
    const snapshot = await getDocs(serviceRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Get service by Business-Owner ID
  getServiceByBusinessOwnerId(businessOwnerId: string): Observable<any[]> {
    const serviceRef = collection(this.firestore, 'Services');
    const q = query(serviceRef, where('business_owner_id', '==', businessOwnerId));
    return collectionData(q, { idField: 'id' });
  }

  // Get service by ID
  // getServiceById(serviceId : string): Observable<any>{
  //   const serviceRef : DocumentReference = doc(this.firestore, `${this.serviceCollection}/${serviceId}`);
  //   return docData(serviceRef , { idField: 'id' });
  // }

  // Get service by ID
  async getMyServicesById(serviceId: string): Promise<any> {

    const user = await this.getValidUser();
    const serviceRef = doc(this.firestore, `Business_Owners/${user.uid}/Services/${serviceId}`);
    const snapshot = await getDoc(serviceRef);
    return snapshot.exists() ? snapshot.data() : null;
  }

  // Update service by ID
  async updateService(serviceId: string, service: any): Promise<any> {

    try {
      const user = await this.getValidUser();
      const serviceRef = doc(this.firestore, `Business_Owners/${user.uid}/Services/${serviceId}`);
      await updateDoc(serviceRef, service);
      console.log("Service updated in Firestore"); // ✅ Add this log
      return { success: true };
    } catch (error) {
      console.error("Error updating service in Firestore", error); // ✅ Add this
      throw error;
    }
  }

  // Delete service by ID
  async deleteService(serviceId: string): Promise<any> {

    const user = await this.getValidUser();
    const serviceRef = doc(this.firestore, `Business_Owners/${user.uid}/Services/${serviceId}`);
    return await deleteDoc(serviceRef);

  }

  private async generateDefaultAvailability(userId: string, serviceId: string) {
    const now = new Date();
    const defaultStartTime = "0.9:00";
    const defaultEndTime = "17:00";

    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + 1);
      const day = date.getDate(); // 0=sun , 6=sat

      //only add for Month (1) to daturday (6)
      if (day !== 0) {
        const formattedDate = date.toISOString().split('T')[0]; // "YYYY-MM-DD"
        const availabilityRef = doc(
          this.firestore, `Business_Owners/${userId}/Services/${serviceId}/Availabilities/${formattedDate}`
        );
        await setDoc(availabilityRef, {
          startTime: defaultStartTime,
          endTime: defaultEndTime,
          slots: [] // You can later generate slots based on length if needed
        })
      }
    }
  }





}
