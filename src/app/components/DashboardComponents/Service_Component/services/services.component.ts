import { ServiceService } from './../../../../services/services.servicee';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-services',
  standalone: false,
  templateUrl: './services.component.html',
  styleUrl: './services.component.css'
})
export class ServicesComponent implements OnInit {

  isDropdownVisible: boolean = false;
  servicesFromFirestore: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 5;
  paginatedData: any[] = [];
  totalPages: number = 1;
  showServiceFormDialog: boolean = false;
  isUpdateMode: boolean = false;
  serviceFormData: any = null;
  selectedServiceId: string | null = null;
  pendingDeleteServiceId: string | null = null;

  constructor(
    private serviceService: ServiceService,
    private toastr: ToastrService
  ) { }

  async ngOnInit() {

    await this.loadServices();
  }

  async loadServices() {
    try {
     const data = await this.serviceService.getMyServices();
      this.servicesFromFirestore = data;
      //this.totalPages = Math.ceil(this.servicesFromFirestore.length / this.itemsPerPage)
      this.updatePagination();

    } catch (err) {
      console.error('Error loading services', err);
      alert('You must be logged in to view your services.');
    }
  }

  toggleActionDropdown(serviceId: string) {
    if (this.selectedServiceId === serviceId) {
      this.isDropdownVisible = !this.isDropdownVisible;
    } else {
      this.selectedServiceId = serviceId;
      this.isDropdownVisible = true;
    }
  }

  //open the service form dialog for editing
  openServiceForm(mode: 'create' | 'update' , service?:any){

    this.isUpdateMode = mode === 'update';
    this.serviceFormData = this.isUpdateMode ? {...service} : null;
    this.showServiceFormDialog = true;
  }
  onFormSubmitted(){
    this.loadServices();
    this.closeServiceFormDialog();
  }

  //close the service form dialog
  closeServiceFormDialog() {
    this.showServiceFormDialog = false;
    this.serviceFormData = null;
    this.isUpdateMode = false;
    this.loadServices();
  }

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedData = this.servicesFromFirestore.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(this.servicesFromFirestore.length / this.itemsPerPage);
  }

  nextPage(): void {

    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  async deleteService(serviceId: string): Promise<void> {
    this.pendingDeleteServiceId = serviceId;
    this.toastr.info(
      'Click here to confirm deletion.',
      'Are you sure you want to delete this service?',
      {
        disableTimeOut: true,
        tapToDismiss: false,
        closeButton: true,
        onActivateTick: true
      }
    ).onTap.subscribe(async () => {
      try {
        await this.serviceService.deleteService(serviceId);
        this.servicesFromFirestore = this.servicesFromFirestore.filter(service => service.id !== serviceId);
        this.totalPages = Math.max(1, Math.ceil(this.servicesFromFirestore.length / this.itemsPerPage));
        if (this.currentPage > this.totalPages) {
          this.currentPage = this.totalPages;
        }
        this.updatePagination();
        this.toastr.success('Service deleted successfully.');
      } catch (err) {
        console.error('Error deleting service:', err);
        this.toastr.error('Failed to delete service.');
      } finally {
        this.pendingDeleteServiceId = null;
      }
    });
  }

  @HostListener('document: click', ['$event'])
  handleOutsideClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.account-menu')) {
      this.isDropdownVisible = false;
      this.selectedServiceId = null;
    }

  }


}
