import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent
{

  // isSidebarHidden  = false;
  // isDropdownVisible = false;

  // toggleAccountDropdown(){

  //   this.isDropdownVisible = !this.isDropdownVisible;
  //   console.log("toogle" , this.isDropdownVisible)
  // }

  // toggleSidebar(){

  //   this.isSidebarHidden = !this.isSidebarHidden;
  //   console.log("toogle" , this.isSidebarHidden);

  // }
  constructor( private router: Router){}

  createBooking(){
this.router.navigate(['/create-booking'])
  }

  createNewCustomer(){

  }

  createNewService(){

  }
  menuOpen: boolean = false;

  toggleMenu(event: Event) {
    event.stopPropagation(); // Prevent parent handlers from interfering
    this.menuOpen = !this.menuOpen;
    console.log("menu toggle" , this.menuOpen)
  }



  copyLink() {
    console.log('Copy BookItNow Link');
    this.menuOpen = false;
  }

 
  editLink() {
    console.log('Edit BookItNow Link');
    this.menuOpen = false;
  }

  searchQuery = '';
  currentPage = 1;
  data = [
    // Example data
    { id: 1, date: '2024-11-28', service: 'Haircut', staff: 'John', serviceStatus: 'Completed', paymentStatus: 'Paid', selected: false },
  ];

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    this.currentPage++;
  }

}
