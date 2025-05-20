import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { FirebaseAuthService } from './services/firebase-auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css',

})
export class AppComponent {
  title = 'bookItNow';
  constructor(private authService: FirebaseAuthService,
              private router: Router) {}

  async ngOnInit(): Promise<void>{


    await this.authService.waitForAuthReady();

    this.authService.currentUser$.subscribe(user => {

      const publicRoutes = [

        /^\/customer_booking\/[a-zA-Z0-9]+$/,
        '/login',
        '/register'
      ];

      const currentPath = this.router.url.split('?')[0];
      const isPublic = publicRoutes.some( route =>

        typeof route === 'string'
        ? currentPath === route
        : route instanceof RegExp
        ? route.test(currentPath)
        :false
      );
      if(!user && !isPublic){
        this.router.navigate(['/login']);
      }
    });
  }


}
