import { Component, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { signInWithEmailAndPassword } from '@firebase/auth';
import { faEnvelope , faEye , faEyeSlash , faLock } from '@fortawesome/free-solid-svg-icons';
import { FirebaseAuthService } from '../../../services/firebase-auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email: string = ""
  password: string = ''
  router : Router = inject(Router)
  auth = inject(Auth)
  error: any = {
    email: "",
    password: "",
    isError: false
  }

  isShowPassword: boolean = false
  faEnvelope = faEnvelope
  faEye = faEye
  faEyeSlash = faEyeSlash
  faLock = faLock

  constructor(
    private authService: FirebaseAuthService,
    private toastr: ToastrService
  ) { }

  ValidateInput(event: Event , type: string){
    const target = event.target as HTMLInputElement;
    this.error[type] = target.value.length === 0 ? `${type} is required` : ""
    this.error.isError = target.value.length === 0;
    if (target.value.length === 0) {
      this.toastr.warning(`${type} is required`, 'Validation');
    }
  }

  async signIn() {
    console.log("Sign in clicked");
    console.log( "values",this.email, this.password);
    console.log(this.error)

    if (!this.email || !this.password) {
      this.toastr.error('Please enter both email and password', 'Login Failed');
      return;
    }

    if(!this.error.isError){
      try{
        await this.authService.login(this.email , this.password);
        this.toastr.success('Login successful!', 'Welcome Back!');
        this.router.navigate(['/setup'], { queryParams: { step: 1 } });
      }catch(err: any){
        console.log("Invalid username or password : ", err);
        this.toastr.error('Invalid email or password', 'Login Failed');
      }
    }
  }

  togglePassword(){
    this.isShowPassword = !this.isShowPassword
  }
}
