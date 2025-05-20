import { inject, Injectable } from '@angular/core';
import { Auth ,  onAuthStateChanged, signInWithEmailAndPassword, signOut, User, createUserWithEmailAndPassword, setPersistence} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { browserLocalPersistence} from 'firebase/auth'

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // auth = inject(Auth);
  private authReady! : Promise<void>;

  constructor(
              private router: Router,
              private auth : Auth){
                this.authReady = this.init(); // run the init method
              }

  private async init(): Promise<void>{

    try {
      await this.authReady;
      await setPersistence(this.auth, browserLocalPersistence);
      await this.initAuthStateListener();
      console.log("Firebase Auth initialized with persistence");
    } catch (error) {
      console.error("Error setting auth persistence:", error);

    }
  }

  private async initAuthStateListener(): Promise<void>{

    return new Promise((resolve) => {
      onAuthStateChanged(this.auth , (user) => {

          this.currentUserSubject.next(user);
          resolve() ; //resove with ready
      });
    });
  }

  async waitForAuthReady(): Promise<void>{
       await this.authReady;
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }


  async waitForCurrentUser(): Promise<User | null>{
    await this.waitForAuthReady(); // Ensure ready
    return this.auth.currentUser; // Should now be populated if user is logged in
  }

  async getAuthenticatedUser(): Promise<User>{

   await this.waitForAuthReady(); // Ensure firebase has loaded
   const user = this.auth.currentUser;
   if(!user){
    throw new Error("User not authenticated");
   }
   return user;
  }

  async login(email: string, password: string): Promise<void>{
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    this.currentUserSubject.next(result.user);
  }
  async register(email: string, password: string): Promise<User> {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    this.currentUserSubject.next(result.user);
    return result.user;
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }


  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }


}
