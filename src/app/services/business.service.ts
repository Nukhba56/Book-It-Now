import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { addDoc, collection, collectionData, deleteDoc, doc, docData, DocumentReference, Firestore, query, where, orderBy, limit, startAfter, getDocs, updateDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})

export class BusinessService {

  firestore = inject(Firestore);
  itemCollection = collection(this.firestore, 'Business_Owners');
  constructor(private http: HttpClient) { }

  // Add a new business to Firestore
  addBusiness(business: any): Promise<any> {

    return addDoc(this.itemCollection, business);
  }

  // Get all businesses from Firestore
  getAllBusinesses(): Observable<any[]> {
    return collectionData(this.itemCollection , { idField: 'id' });
  }
  // Get business by ID
  getBusinessById(businessId: string): Observable<any> {
    const businessRef : DocumentReference = doc(this.firestore, `${this.itemCollection}/${businessId}`);
    return docData(businessRef);
  }
  // Update business by ID
  updateBusiness(businessId: string, business: any): Promise<any> {
    const businessRef : DocumentReference = doc(this.firestore, `${this.itemCollection}/${businessId}`);
    return updateDoc(businessRef, business);
  }
  // Delete business by ID
  deleteBusiness(businessId: string): Promise<any> {
    const businessRef : DocumentReference = doc(this.firestore, `${this.itemCollection}/${businessId}`);
    return deleteDoc(businessRef);
  }


}
