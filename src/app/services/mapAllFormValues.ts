import { FormGroup } from '@angular/forms';

//reusable code for all forms mapping the values
export function mapForFormValues(form: FormGroup, formData: any , customMappings? : Record<string , (value: any) => any>){

  Object.keys(form.controls).forEach(controlName => {
    if(customMappings && customMappings[controlName]){
      //apply custom mapping if provided
      form.get(controlName)?.setValue(customMappings[controlName](formData));
    }else if(formData.hasOwnerProperty(controlName)){
      //direct mapping if field exists in data
      form.get(controlName)?.setValue(formData[controlName]);
    }
  });
}
