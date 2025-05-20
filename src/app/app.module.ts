import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/authentication/login/login.component';
import { RegisterComponent } from './components/authentication/register/register.component';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { environment } from '../enviornments/environment';
import { HomeComponent } from './components/DashboardComponents/home/home.component';
import { BookingComponent } from './components/DashboardComponents/Booking_Component/booking/booking.component';
import { ServicesComponent } from './components/DashboardComponents/Service_Component/services/services.component';
import { AvailabilityComponent } from './components/DashboardComponents/availability/availability.component';
import { BookingLinkComponent } from './components/DashboardComponents/Booking_Link_Component/booking-link/booking-link.component';
import { CustomerComponent } from './components/DashboardComponents/Customer_Component/customer/customer.component';
import { BusinessSetupComponent } from './components/business-setup/business-setup.component';
import { StripeComponent } from './components/stripe/stripe.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule , Location } from '@angular/common';
import { DashboardComponent } from './components/DashboardComponents/dashboard/dashboard.component';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { BusinessComponent } from './components/business/business.component';
import { ServiceFormComponent } from './components/DashboardComponents/Service_Component/service-form/service-form.component';
import { ServiceViewComponent } from './components/DashboardComponents/Service_Component/service-view/service-view.component';
import { CustomerFormComponent } from './components/DashboardComponents/Customer_Component/customer-form/customer-form.component';
import { CustomerViewComponent } from './components/DashboardComponents/Customer_Component/customer-view/customer-view.component';
import { BookingLinkFormComponent } from './components/DashboardComponents/Booking_Link_Component/booking-link-form/booking-link-form.component';
import { BookingLinkViewComponent } from './components/DashboardComponents/Booking_Link_Component/booking-link-view/booking-link-view.component';
import { BookingViewComponent } from './components/DashboardComponents/Booking_Component/booking-view/booking-view.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { CreateBookingComponent } from './components/DashboardComponents/Booking_Component/create-booking/create-booking.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    HomeComponent,
    DashboardComponent,
    BookingComponent,
    ServicesComponent,
    AvailabilityComponent,
    BookingLinkComponent,
    CustomerComponent,
    BusinessSetupComponent,
    StripeComponent,
    BusinessComponent,
    ServiceFormComponent,
    ServiceViewComponent,
    CustomerFormComponent,
    CustomerViewComponent,
    BookingLinkFormComponent,
    BookingLinkViewComponent,
    BookingViewComponent,
    CreateBookingComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    FontAwesomeModule,
    CommonModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(
    {
      positionClass: 'toast-top-right', // or top-right
      timeOut: 3000,
      progressBar: true
    }),
  ],
  providers: [
    //provideClientHydration(),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(()=> getFirestore()),
    provideStorage(() => getStorage()),
    Location
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
