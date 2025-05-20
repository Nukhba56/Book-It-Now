import { Component, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { faEnvelope , faEye , faEyeSlash , faLock , faUser } from '@fortawesome/free-solid-svg-icons';
import { BusinessOwner } from '../../../interface/business-owner.interface';
import { FirestoreService } from '../../../services/firestore.service';
import { FirebaseAuthService } from '../../../services/firebase-auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  password : string = ''
  email : string = ''
  name : string = ''

  faEnvelope = faEnvelope
  faEye = faEye
  faEyeSlash = faEyeSlash
  faLock = faLock
  faUser = faUser
  isShowPassword: boolean = false


  auth: Auth = inject(Auth);
  constructor(
    private router: Router,
    private firestoreService : FirestoreService,
    private authService : FirebaseAuthService,
    private toastr: ToastrService
  ){}


  async createUser (){
    if (!this.email || !this.password || !this.name) {
      this.toastr.error('Please fill in all required fields');
      return;
    }

    try{
      const userCredentials =  await this.authService.register(this.email, this.password);
      const owner : BusinessOwner = {
         id: userCredentials.uid,
         name: this.name,
         email: this.email,
         business_name: '',
         stripe_id: null,
         created_at: new Date().toISOString()
       };
       console.log(owner);
       // Save the owner data to Firestore
        await this.firestoreService.addBusinessOwner(owner);

       this.toastr.success('Registration successful!', 'Welcome!');
        this.router.navigate(['/login']);
    }catch(err: any){
      console.log("Error creating user: ", err);
      this.toastr.error(err.message || 'Error creating user', 'Registration Failed');
    }
  }

  goLogin(){
     this.router.navigate(['/login']);
     console.log(this.password , this.email)
  }

  showPassword(){
    this.isShowPassword = !this.isShowPassword;
  }
}
