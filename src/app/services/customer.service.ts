
import { inject, Injectable } from '@angular/core';
import { FirebaseAuthService } from '../services/firebase-auth.service';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { addDoc, collection, deleteDoc, doc, Firestore, getDoc, getDocs, query, updateDoc, where } from '@angular/fire/firestore';
import { Customers } from '../interface/customer.interface';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  private afs = inject(Firestore);
  private authService = inject(FirebaseAuthService);
  constructor() { }


  private async getValidUser(): Promise<any> {
    return await this.authService.getAuthenticatedUser();
  }

  // //1. Add Customer (Check if Exists First)
  async addCustomer(data: Customers , businessId?: string): Promise<string | null> {

    const user = businessId ? {uid: businessId} : await this.getValidUser();
    if(!data.phone || !data.email){
      console.log("Missing phone or email", data);
      throw new Error("Missing phone or email");
    }
    const customerRef = collection(this.afs, `Business_Owners/${user.uid}/Customers`);
    const q = query(customerRef, where('phone', '==', data.phone), where('email', '==', data.email));
    const snapshot = await getDocs(q);

    if(!snapshot.empty){
      console.log('Customer already exists');
      return snapshot.docs[0].id;
    }
    const newDoc = await addDoc(customerRef, {
      ...data,
      createdAt: new Date(),
      hasBooked: false
    });
    return newDoc.id;
  }

  async addCustomerPublic(businnessId: string , data : Customers): Promise<string | null> {

    if (!data.phone || !data.email) {
      console.warn("Missing phone or email in addCustomerPublic:", data);
      throw new Error("Phone and email are required to create customer.");
    }
    const customerRef = collection(this.afs, `Business_Owners/${businnessId}/Customers`);

    //optional: check if customer already exists
    const q = query(customerRef, where('phone', '==', data.phone), where('email', '==', data.email));
    const snapshot = await getDocs(q);

    if(!snapshot.empty){
      console.log('Customer already exists');
      return snapshot.docs[0].id;
    }
    const newDoc = await addDoc(customerRef, {
      ...data,
      createdAt: new Date(),
      hasBooked: false
    });
    return newDoc.id;
  }

  async getCustomerById(businessId: string, customerId: Customers): Promise<Customers | null> {

    const customerDocRef = doc(this.afs, `Business_Owners/${businessId}/Customers/${customerId}`);
    const docSnap = await getDoc(customerDocRef);
    if(docSnap.exists()){
      console.log('Customer already exists');
      return {id: docSnap.id, ...docSnap.data()} as Customers;
    }
    return null;
  }

  // ✅  Get All Customers for Logged-in Business
  getCustomersByBusiness(): Observable<Customers[]> {
    return from(this.getValidUser()).pipe(
      switchMap(async user => {
        const customerRef = collection(this.afs, `Business_Owners/${user.uid}/Customers`);
        const snapshot = await getDocs(customerRef);
        return snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as Customers));
      })
    );
  }

  // ✅ 3. Get Customer by Email or Phone
  getCustomerByPhoneOrEmail(phone: string, email: string): Observable<Customers[]> {
    return from(this.getValidUser()).pipe(
      switchMap(async user => {
        const customerRef = collection(this.afs, `Business_Owners/${user.uid}/Customers`);
        const q = query(customerRef, where('email', '==', email));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as Customers));
      })
    );
  }

  // ✅ 4. Update Customer
  async updateCustomer(customerId: string, updatedData: Partial<Customers>): Promise<void> {
    const user = await this.getValidUser();
    const customerDocRef = doc(this.afs, `Business_Owners/${user.uid}/Customers/${customerId}`);
    await updateDoc(customerDocRef, updatedData);
  }

  // ✅ 5. Delete Customer
  async deleteCustomer(customerId: string): Promise<void> {
    const user = await this.getValidUser();
    const customerDocRef = doc(this.afs, `Business_Owners/${user.uid}/Customers/${customerId}`);
    await deleteDoc(customerDocRef);
  }

  // ✅ 6. Mark Customer as Booked
  async markCustomerHasBooked(customerId: string): Promise<void> {
    const user = await this.getValidUser();
    const customerDocRef = doc(this.afs, `Business_Owners/${user.uid}/Customers/${customerId}`);
    await updateDoc(customerDocRef, { hasBooked: true });
  }

  // ✅ 7. Get Booked Customers
  getCustomersWithBookings(): Observable<Customers[]> {
    return from(this.getValidUser()).pipe(
      switchMap(async user => {
        const customerRef = collection(this.afs, `Business_Owners/${user.uid}/Customers`);
        const q = query(customerRef, where('hasBooked', '==', true));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as Customers));
      })
    );
  }

  // ✅ 8. Get Non-Booked Customers
  getCustomersWithoutBookings(): Observable<Customers[]> {
    return from(this.getValidUser()).pipe(
      switchMap(async user => {
        const customerRef = collection(this.afs, `Business_Owners/${user.uid}/Customers`);
        const q = query(customerRef, where('hasBooked', '==', false));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as Customers));
      })
    );
  }

}
