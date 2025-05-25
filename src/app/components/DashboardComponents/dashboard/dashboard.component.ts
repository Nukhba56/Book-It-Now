import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import {faUsers , faUserCircle,  faAngleDown, faCalendarCheck , faLink ,  faHouseChimney , faClock , faGears}  from '@fortawesome/free-solid-svg-icons'
import { FirebaseAuthService } from '../../../services/firebase-auth.service';
import { BusinessOwner } from '../../../interface/business-owner.interface';
import { FirestoreService } from '../../../services/firestore.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

    isSidebarHidden  = false;
    isDropdownVisible = false;
    isResponsiveView = false;
    faUserCircle = faUserCircle;
    faAngleDown = faAngleDown;
    businessData: BusinessOwner | null = null;
    isBusinessFormVisible = false;

    constructor(
      public router: Router,
      private firebaseAuthService: FirebaseAuthService,
      private firestoreService: FirestoreService
    ){
      this.checkScreenSize();
      this.loadBusinessData();
    }

    private async loadBusinessData() {
      const user = await this.firebaseAuthService.getCurrentUser();
      if (user) {
        this.firestoreService.getBusinessOwner(user.uid).subscribe(data => {
          this.businessData = data || null;
        });
      }
    }

    onBusinessFormSubmitted(business: BusinessOwner) {
      this.businessData = business;
      this.isBusinessFormVisible = false;
    }

    onBusinessFormClosed(event: string) {
      if (event === 'refresh') {
        this.loadBusinessData();
      }
      this.isBusinessFormVisible = false;
    }

    toggleAccountDropdown(){
      this.isDropdownVisible = !this.isDropdownVisible;
      console.log("toogle" , this.isDropdownVisible)
    }

    toggleSidebar(){
      this.isSidebarHidden = !this.isSidebarHidden;
      console.log("toogle" , this.isSidebarHidden);
    }

    links = [
      { label: 'Home', path: '/dashboard/home' , icon: faHouseChimney},
      { label: 'Bookings', path: '/dashboard/booking'  , icon: faCalendarCheck },
      { label: 'Customers', path: '/dashboard/customer', icon: faUsers },
      { label: 'Services', path: '/dashboard/service', icon: faGears},
      { label: 'Availability', path: '/dashboard/availability',  icon: faClock},
      { label: 'BookItNow Link', path: '/dashboard/booking-link' , icon: faLink},
    ];

    showBusinessForm() {
      this.isBusinessFormVisible = true;
      this.isDropdownVisible = false;
    }

    ngOnInit() {
      this.checkScreenSize();
    }

    @HostListener('window:resize')
    onResize() {
      this.checkScreenSize();
    }

    checkScreenSize() {
      this.isResponsiveView = window.innerWidth <= 1024;
      if (!this.isResponsiveView) {
        this.isSidebarHidden = false;
      }
    }

    onResponsiveLinkClick() {
      if (this.isResponsiveView) {
        this.isSidebarHidden = true;
      }
    }

    logout(){
      this.firebaseAuthService.logout();
    }

    onModalBackdropClick(event: MouseEvent) {
      // Close modal only if clicking the backdrop (not the modal content)
      if (event.target === event.currentTarget) {
        this.onBusinessFormClosed('close');
      }
    }

    navigateToProfile() {
      this.router.navigate(['/dashboard/profile']);
      this.isDropdownVisible = false; // Close the dropdown after navigation
    }

  }
