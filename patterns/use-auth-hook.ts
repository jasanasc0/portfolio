/**
 * Real-Time Subscription Pattern with useAuth Hook
 * 
 * This hook demonstrates:
 * - Firebase Auth state management
 * - Anonymous authentication for frictionless customer experience
 * - Proper cleanup of subscriptions
 * - Conditional logic based on app context (customer vs admin)
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase-config';
import { AuthService } from '../services/AuthService';

interface UseAuthResult {
    user: User | null;
    adminUser: User | null;
    isLoading: boolean;
    isAnonymous: boolean;
}

/**
 * useAuth Hook
 * 
 * Manages authentication state for the application.
 * Automatically signs in anonymously for customer-facing pages.
 * 
 * @param slug - Restaurant slug from URL (if present, we're in customer mode)
 */
export function useAuth(slug: string | undefined): UseAuthResult {
    const [user, setUser] = useState<User | null>(null);
    const [adminUser, setAdminUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {

            if (firebaseUser) {
                // User is logged in
                if (firebaseUser.isAnonymous) {
                    // Anonymous user (customer)
                    setUser(firebaseUser);
                    setAdminUser(null);
                } else {
                    // Regular user - check if they're an admin
                    const authResult = await AuthService.checkAdminAuthorization(
                        firebaseUser,
                        slug
                    );

                    if (authResult.authorized) {
                        setAdminUser(firebaseUser);
                    }
                    setUser(firebaseUser);
                }
            } else {
                // No user logged in
                if (slug) {
                    // We're on a restaurant page - sign in anonymously
                    // This allows customers to order without creating an account
                    try {
                        await AuthService.signInAnonymously();
                        // The auth state change will fire again with the new user
                    } catch (error) {
                        console.error('Anonymous sign-in failed:', error);
                    }
                } else {
                    // We're on SaaS/dashboard - stay logged out
                    setUser(null);
                    setAdminUser(null);
                }
            }

            setIsLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();

    }, [slug]);

    return {
        user,
        adminUser,
        isLoading,
        isAnonymous: user?.isAnonymous ?? false
    };
}

// ============================================================================
// WHY ANONYMOUS AUTH?
// ============================================================================
//
// Problem: Customers don't want to create accounts just to order coffee
// Solution: Firebase Anonymous Auth
//
// Benefits:
// - Zero friction: Scan QR → Order immediately
// - Session tracking: We still get a UID to track their orders
// - Security: Firestore rules can still check request.auth
// - Persistence: Session survives browser refresh
//
// The anonymous UID is stored in the order document, allowing:
// - Customer to see their own order status
// - Recovery if they refresh the page
//
// ============================================================================

// ============================================================================
// REAL-TIME SUBSCRIPTION PATTERN
// ============================================================================
//
// useEffect(() => {
//   const unsubscribe = onSomething(...);  // Start listening
//   return () => unsubscribe();            // Cleanup when component unmounts
// }, [dependencies]);
//
// This pattern is CRITICAL for:
// - Preventing memory leaks
// - Avoiding "updates on unmounted component" warnings
// - Proper resource cleanup
//
// ============================================================================
