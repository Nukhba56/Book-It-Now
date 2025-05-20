import { inject, Injectable } from "@angular/core";

import { map, switchMap, take } from "rxjs/operators";
import { Observable, of } from "rxjs";
import { BusinessOwner } from "../interface/business-owner.interface";
import { user } from "@angular/fire/auth";
import { doc, docData, Firestore, setDoc, updateDoc, collection } from "@angular/fire/firestore";

@Injectable({
  providedIn: "root"
})

export class FirestoreService {

  private collectionName = 'Business_Owners';
  private firestore: Firestore = inject(Firestore);


  constructor() { }

  // Create a new business owner document in Firestore
  async addBusinessOwner(owner: BusinessOwner): Promise<void>{

    const ownerRef = doc(this.firestore, this.collectionName, owner.id);
    return setDoc(ownerRef , owner);

  }

  // Get the business owner document by ID'
  getBusinessOwner(id: string) : Observable<BusinessOwner | undefined> {
    // Check if the user is authenticated
    const ownerRef = doc(this.firestore, this.collectionName, id);
    return docData(ownerRef) as Observable<BusinessOwner | undefined>;


  }

  //update business owner document by ID
  async updateBusinessOwner(id: string, data: Partial<BusinessOwner>): Promise<void> {

    const ownerRef = doc(this.firestore, this.collectionName, id);
    return updateDoc(ownerRef, data);
  }

  //Listen for Authentication State & Store Owner Data
  // listenForAuthChages(): void {

  //   this.auth.authState.subscribe(async (user) => {
  //     if(user){
  //       const owner: BusinessOwner = {
  //         id: user.uid,
  //         email: user.email || '',
  //         name: user.displayName || '',
  //         business_name: '', // Add other properties as needed
  //         stripe_id: null,
  //         created_at: new Date().toISOString(),
  //       };

  //       // Check if the user already exists
  //       const doc = await this.firestore.collection(this.collectionName).doc(user.uid).get().toPromise();
  //       if(!doc?.exists){
  //         // If the user does not exist, create a new document
  //         await this.addBusinessOwner(owner);
  //       }

  //     }
  //   })
  // }






}
