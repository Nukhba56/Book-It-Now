import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import {faUsers , faUserCircle,  faAngleDown, faCalendarCheck , faLink ,  faHouseChimney , faClock , faGears}  from '@fortawesome/free-solid-svg-icons'

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

    constructor(public router: Router){
      this.checkScreenSize();
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

  }
