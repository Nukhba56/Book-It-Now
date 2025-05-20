import { BookingLinkService } from './../../../../services/bookinglink.service';
import { Service } from './../../../../interface/service.interface';
import { ServiceService } from './../../../../services/services.servicee';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Form, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { mapForFormValues } from '../../../../services/mapAllFormValues';


@Component({
  selector: 'app-service-form',
  standalone: false,
  templateUrl: './service-form.component.html',
  styleUrl: './service-form.component.css'
})
export class ServiceFormComponent implements OnInit {

  @Output() formSubmitted = new EventEmitter<void>();
  @Output() formClosed = new EventEmitter<string>();
  @Input() serviceFormData: Service | any = null;

  serviceForm!: FormGroup;
  bookingLinks: any[] = [];
  serviceId:  string = '';
  loading: boolean = false;
  buttonLabel: string = 'Create';
  submitted: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private ServiceService: ServiceService,
    private bookingLinkService : BookingLinkService,
    private route : ActivatedRoute,
    private toastr: ToastrService) {}

  ngOnInit(): void {
    this.serviceForm = this.formBuilder.group({
      serviceName: ['' , Validators.required],
      description: [''],
      fee: [0 , [Validators.required , Validators.min(1)]],
      lengthValue: [1 , Validators.required ],
      lengthUnit: ['minute(s)', Validators.required],
      bufferTimeValue: [1 , Validators.required ],
      bufferTimeUnit: ['minute(s)', Validators.required],
      location: [''],
      noOfServices: [1 , Validators.required],
      status: ['Deactive'],
    });

      if (this.serviceFormData) {
      // Only if you're editing existing services
        console.log(" Editing service:", this.serviceFormData.id);
        this.serviceId = this.serviceFormData.id;
        this.buttonLabel = 'Update';
        this.prefillForm(this.serviceFormData)// Pre-fill the form with existing service data
      }
   }

   private prefillForm(serviceFormData: any){
    mapForFormValues(this.serviceForm , serviceFormData, {
      //custom Mapping
      serviceName:(formData) => formData.name || '',
      description: (formData) => formData.description || '',
      fee:(formData) => formData.fee,
      lengthValue: (formData) => this.extractNumericValue(formData.length),
      lengthUnit:(formData) => this.extractTextValue(formData.length) || 'minute(s)',
      bufferTimeValue: (formData) => this.extractNumericValue(formData.bufferTime),
      bufferTimeUnit:(formData) => this.extractTextValue(formData.bufferTime) || 'minute(s)',
      location:(formData) => formData.location || '',
      noOfServices:(formData) => formData.noOfServices || '' ,
      status:(formData) => formData.status || '' ,

    } )
   }

   //helper function for extracting values
   private extractNumericValue(value: string| undefined): number{

    if(!value) return 1;
    const match = value.match(/(\d+)/);
    return match ? parseInt(match[1]): 1;
   }

   private extractTextValue(value: string | undefined): string{

    if(!value) return '';
    const match = value.match(/\d+\s*(.+)/);
    return match ? match[1].trim() : '';
   }

  onSubmit() {
    this.submitted = true;
    console.log('Form submitted:', this.serviceForm.value);

    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      this.toastr.warning('Please fill all required fields correctly.', 'Validation Error');
      return;
    }

    this.loading = true;
    this.submitServiceForm();
  }

  private submitServiceForm() {
    const formValue = this.serviceForm.value;

    const serviceData = {
      name: formValue.serviceName,
      description: formValue.description,
      fee: formValue.fee,
      location: formValue.location,
      length: `${formValue.lengthValue} ${formValue.lengthUnit}`,
      bufferTime: `${formValue.bufferTimeValue} ${formValue.bufferTimeUnit}`,
      noOfServices: formValue.noOfServices,
      status: formValue.status,
      createdAt: new Date().toISOString(),
    }

    if(this.serviceId){
      console.log("update the service:", this.serviceId)
        this.ServiceService.updateService(this.serviceId, serviceData).then(response => {
        this.toastr.success('Service updated successfully!');
        console.log('Service updated successfully:', response);
        this.loading = false;
        this.submitted = false;
        this.formSubmitted.emit();
        this.formClosed.emit('refresh');

      }).catch(error => {
        this.toastr.error('Error updating service:', error.message);
        console.error('Error updating service:', error);
        this.loading = false;
        this.submitted = false;
      }
      );
    } else {
      // Add a new service
      console.log("create new service:");
      this.ServiceService.addService(serviceData).then(  (response) => {
        const newServiceID = response.id;
        console.log("newServiceId" , newServiceID);
        if(formValue.status === 'Active'){

          this.bookingLinkService.addServiceIdToBookingLinkMetadata(newServiceID);
        }
        this.toastr.success('Service added successfully!');
        console.log('Service added successfully:', response);
        this.loading = false;
        this.submitted = false;
        this.formSubmitted.emit();
        // call this when the form is submitted
        this.formClosed.emit('refresh'); // or whatever you want
        this.serviceForm.reset({status: 'Deactive'});
      }).catch(error => {
        this.toastr.error('Error adding service:', error.message);
        console.error('Error adding service:', error);
        this.loading = false;
        this.submitted = false;
      }
      );
    }
  }
  getServiceControl(ServiceName: string) {
    return this.serviceForm.get(ServiceName);
  }

}
