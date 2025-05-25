import { map } from 'rxjs/operators';
import { Customers } from './../../../../interface/customer.interface';
import { Component, HostListener, inject } from '@angular/core';
import { CustomerService } from '../../../../services/customer.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-customer',
  standalone: false,
  templateUrl: './customer.component.html',
  styleUrl: './customer.component.css'
})
export class CustomerComponent {

  //customer crud
  customerId: string | null = null;
  customers: any[] = [];
  serchQuery: string = '';
  lastVisible: any = null;
  showCustomerFormDialog: boolean = false;
  showCustomerDeleteDialog: boolean = false;
  isUpdateMode: boolean = false;
  customerFormData: any = null;
  selectedCustomerId: string | null = null;

  isDropdownVisible = false;
  customersOfFirebase : any[] = [];
  current = 1;
  currentPage: number = 1;
  itemsPerPage: number = 5;
  paginatedData: any[] = [];
  totalPages: number = 1;
  pendingDeleteCustomerId: string | null = null;

  constructor(
    private customerService : CustomerService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {

    this.updatePagination();
    this.fetchCustomers();
    //create customer form
  }

  nextStep() {
    if (this.current < 2) {
      this.current++;
    }
  }

  // addCustomer() {
  //   this.showAddCustomerForm = !this.showAddCustomerForm;
  // }

  fetchCustomers() {
    this.customerService.getCustomersByBusiness().subscribe((res: any[]) => {
      this.customers = res;
      this.updateCustomerList();
    });
  }

  updateCustomerList(){
    this.customersOfFirebase = this.customers.map(customer =>( {
        id: customer.id,
        name: customer.customerName,
        email: customer.email,
        phone: customer.phone,
        booking_made: customer.hasBooked ? '1' : '0',
    }));
    this.updatePagination();
  }

  searchCustomers() {
    const query = this.serchQuery.toLowerCase();
    const filtered = this.customers.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.phone.includes(query)
    );

    this.customersOfFirebase = filtered.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      booking_made: customer.hasBooked ? '1' : '0',
    }));

    this.currentPage = 1;
    this.updatePagination();
  }

  // onCustomerFormSubmitted(){
  //   console.log("Customer detail saved:");
  // }

  //open the service form dialog for editing
  openCustomerForm(mode: 'create' | 'update' , customerId?:any){
    this.isUpdateMode = mode === 'update';
    if (this.isUpdateMode && customerId) {
      // Find the original customer data from the customers array
      const originalCustomer = this.customers.find(c => c.id === customerId);
      if (originalCustomer) {
        this.customerFormData = originalCustomer;
      }
    } else {
      this.customerFormData = null;
    }
    this.showCustomerFormDialog = true;
  }
  onFormSubmitted(updateCustomer: any){
    if(this.isUpdateMode){
      //update the existing customer in the list
      const index = this.customers.findIndex( c => c.id === updateCustomer.id);
      if(index !== -1){
        this.customers[index] = updateCustomer;
      }
    }else{
        // Add the new customer to the list
      this.customers.push(updateCustomer);
    }

    this.updateCustomerList();
    this.closeCustomerFormDialog();
  }

  //close the customer form dialog
  closeCustomerFormDialog() {
    this.showCustomerFormDialog = false;
    this.customerFormData = null;
    this.isUpdateMode = false;
  }

    toggleActionDropdown(customerId: string) {
    if (this.selectedCustomerId === customerId) {
      this.isDropdownVisible = !this.isDropdownVisible;
    } else {
      this.selectedCustomerId = customerId;
      this.isDropdownVisible = true;
    }
  }

  // back() {
  //   this.showCustomerFormDialog = !this.showCustomerFormDialog
  // }
//#@_-&201pPQqRr#Rr@_-&*?*

  // isModalOpen = false;

  // openModal() {
  //   this.isModalOpen = true;
  // }

  // closeModal() {
  //   this.isModalOpen = false;
  // }

  // Handle browser back button to close the modal
  // @HostListener('window:popstate', ['$event'])
  // onPopState() {
  //   this.isModalOpen = false;
  // }
  updatePagination(): void {

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedData = this.customersOfFirebase.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(this.customersOfFirebase.length / this.itemsPerPage);

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
    //close the customer form dialog
    closeCustomerDeleteDialog() {
      this.showCustomerDeleteDialog = false;
      this.pendingDeleteCustomerId = null;

    }


    openCustomerDeleteDialog(customerId: string){
      this.showCustomerDeleteDialog = true;
      this.pendingDeleteCustomerId = customerId;
    }

    async deleteCustomer(): Promise<void> {
      if(!this.pendingDeleteCustomerId) return;
      try {
        await this.customerService.deleteCustomer(this.pendingDeleteCustomerId);
        this.customers = this.customers.filter((customer: any) => customer.id !== this.pendingDeleteCustomerId);
        this.updateCustomerList();
        this.toastr.success('Customer deleted successfully.');
      } catch (err) {
        console.error('Error deleting Customer :', err);
        this.toastr.error('Failed to delete customer.');
      } finally {
        this.pendingDeleteCustomerId = null;
      }

  }

  @HostListener('document: click', ['$event'])
  handleOutsideClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.account-menu')) {
      this.isDropdownVisible = false;
      this.selectedCustomerId = null;
    }

  }
}
