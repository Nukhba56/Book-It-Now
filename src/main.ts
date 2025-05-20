import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true,
})
  .catch(err => console.error(err));

// import { enableProdMode, importProvidersFrom } from '@angular/core';
// import { environment } from './enviornments/enviornment.prod';
// import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
// import { AppRoutingModule } from './app/app-routing.module';
// import { provideAnimations } from '@angular/platform-browser/animations';
// import { AppComponent } from './app/app.component';
// import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
// import { getAuth, provideAuth } from '@angular/fire/auth';
// import { getFirestore, provideFirestore } from '@angular/fire/firestore';
// import { FIREBASE_OPTIONS } from '@angular/fire/compat';
// import { CommonModule } from '@angular/common';

// if (environment.production) {
//   enableProdMode();
// }

// bootstrapApplication(AppComponent, {
//   providers: [
//     importProvidersFrom(BrowserModule , AppRoutingModule , CommonModule),
//     importProvidersFrom(AppRoutingModule),
//     importProvidersFrom(CommonModule),
//     provideAnimations(),
//     provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
//     provideAuth(() => getAuth()), provideFirestore(() => getFirestore()),
//     { provide: FIREBASE_OPTIONS, useValue: environment.firebaseConfig }
//   ]
// }).catch((err) => console.error(err));

