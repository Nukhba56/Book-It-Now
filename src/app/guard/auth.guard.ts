import { FirestoreService } from './../services/firestore.service';
import { inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BusinessOwner } from '../interface/business-owner.interface';
import { FirebaseAuthService } from '../services/firebase-auth.service';

export const authGuard: CanActivateFn = async (route, state) => {

  const router = inject(Router);
  const firestoreService = inject(FirestoreService);
  const authService = inject(FirebaseAuthService);

  try {

    console.log("Checking authentication...");
    await authService.waitForAuthReady();
    console.log("Auth is ready");
    const user = await authService.getAuthenticatedUser(); // Wait until Firebase loads user
    console.log("Authenticated user:", user.uid);

    if (!user) {
      console.log("User not authenticated");
      router.navigate(['/login']);
      return false;
    }

    console.log("Authenticated user:", user.uid);
    // Check if the user exist in Firestore
    const existingUser = await firstValueFrom(firestoreService.getBusinessOwner(user.uid || ''));
    const isBusinessSetup = existingUser?.business_name?.trim() !== '' && existingUser?.stripe_id !== null;

    if (!existingUser) {
      console.log("User does not exist in Firestore, redirecting to business setup...");
      const owner: BusinessOwner = {
        id: user.uid || '',
        name: user.displayName || '',
        email: user.email || '',
        business_name: '',
        stripe_id: null,
        created_at: new Date().toISOString(),
      };

      await firestoreService.addBusinessOwner(owner);
      router.navigate(['/setup'], { queryParams: { step: 1 } });
      return false;
    }

    // If on login or setup and business is fully set up, go to dashboard
    if ((state.url.includes('/login') || state.url.includes('/setup')) && isBusinessSetup) {
      router.navigate(["/dashboard/home"]);
      return false;
    }

    // If user is accessing other pages but business is not fully set up yet
    if (!isBusinessSetup && !state.url.includes('/setup')) {
      console.log("Business setup incomplete, redirecting to appropriate setup step");
      // Determine which step to redirect to based on what's missing
      let step = 1;
      if (existingUser.business_name?.trim() !== '' && !existingUser.stripe_id) {
        step = 2; // If business name is set but no Stripe, go to Stripe setup
      }
      router.navigate(['/setup'], { queryParams: { step } });
      return false;
    }

    return true;

  } catch (err) {
    console.error("Auth guard error:", err);
    router.navigate(['/login']);
    return false;
  }




}
