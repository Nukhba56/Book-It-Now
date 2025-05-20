import { Timestamp } from "firebase/firestore";

export interface Customers{

    id: string,
    businessId: string,
    name: string,
    phone: string,
    email: string,
    address: string,
    country: string,
    state: string,
    zipCode: string,
    city: string,
    customerNote: string,
    createdAt: Timestamp,
    hasBooked: boolean // Optional: default false, turns true if they book
  }


