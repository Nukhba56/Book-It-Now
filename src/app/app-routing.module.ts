import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/authentication/login/login.component';
import { RegisterComponent } from './components/authentication/register/register.component';
import { DashboardComponent } from './components/DashboardComponents/dashboard/dashboard.component';
import { authGuard } from './guard/auth.guard';
import { BusinessSetupComponent } from './components/business-setup/business-setup.component';
import { HomeComponent } from './components/DashboardComponents/home/home.component';
import { CustomerComponent } from './components/DashboardComponents/Customer_Component/customer/customer.component';
import { BookingLinkComponent } from './components/DashboardComponents/Booking_Link_Component/booking-link/booking-link.component';
import { ServicesComponent } from './components/DashboardComponents/Service_Component/services/services.component';
import { AvailabilityComponent } from './components/DashboardComponents/availability/availability.component';
import { BookingComponent } from './components/DashboardComponents/Booking_Component/booking/booking.component';
import { BusinessComponent } from './components/business/business.component';
import { CreateBookingComponent } from './components/DashboardComponents/Booking_Component/create-booking/create-booking.component';
import { ServiceFormComponent } from './components/DashboardComponents/Service_Component/service-form/service-form.component';
import { ProfileComponent } from './components/profile/profile.component';

const routes: Routes = [
  {
    path: 'login', component: LoginComponent
  },
  {
    path : '', redirectTo: '/register', pathMatch: 'full'
  },
  {
    path  : 'register', component: RegisterComponent
  },
  {
    path: 'setup', component:BusinessSetupComponent  , canActivate:[authGuard],
  },
  {
    path: 'business', component: BusinessComponent ,
  },
  {
    path:'dashboard' , component: DashboardComponent  , canActivate: [authGuard],
    children:[
      {
        path:'home' , component:HomeComponent
      },
      { path: 'customer' , component:CustomerComponent
      },
      {
        path: 'booking-link' , component:BookingLinkComponent
      },
      {
        path:"service" , component: ServicesComponent
      },
      {
        path:"service-form" , component:ServiceFormComponent,
        children:[
          {
            path:":id" , component: ServicesComponent
          }
        ]
      },
      {
        path:"availability" , component:AvailabilityComponent ,
        children:[
          { path:'' , component:AvailabilityComponent},
          { path:":serviceId" , component:AvailabilityComponent}
        ]
      },
      {
        path:"booking" , component: BookingComponent ,
      },
      {
        path:"createBooking_fromDashboard" , component: CreateBookingComponent ,
      },
      {
        path:"profile" , component: ProfileComponent
      }
    ]
  },
  {
    path:"customer_booking/:businessId" , component: CreateBookingComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
