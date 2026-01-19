/**
 * Service Layer Pattern Example
 * 
 * This pattern abstracts infrastructure (Firebase) from UI components.
 * Benefits:
 * - Testability: Can mock services in tests
 * - Maintainability: If we switch to Supabase, only change this file
 * - Separation of concerns: Components don't know about Firestore
 * 
 * Usage in components:
 *   const orders = await OrderService.getByRestaurant(restaurantId);
 */

import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    Timestamp,
    Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase-config';

// Types
interface Order {
    id: string;
    restaurantId: string;
    tableNum: number;
    items: OrderItem[];
    status: 'awaiting_payment' | 'pending' | 'preparing' | 'ready' | 'completed';
    total: number;
    createdAt: Date;
}

interface OrderItem {
    id: string;
    name: string;
    price: number;
    qty: number;
}

/**
 * OrderService - Centralized order operations
 * 
 * All Firestore operations for orders go through here.
 * Components never import Firestore directly.
 */
export const OrderService = {

    /**
     * Subscribe to real-time order updates for a restaurant
     * 
     * @param restaurantId - The tenant ID to scope the query
     * @param onUpdate - Callback when orders change
     * @returns Unsubscribe function for cleanup
     */
    subscribe(
        restaurantId: string,
        onUpdate: (orders: Order[]) => void,
        onError?: (error: Error) => void
    ): Unsubscribe {

        // Build query scoped to this restaurant (multi-tenant!)
        const q = query(
            collection(db, 'orders'),
            where('restaurantId', '==', restaurantId),
            where('status', 'in', ['pending', 'preparing', 'ready']),
            orderBy('createdAt', 'asc')
        );

        // Real-time listener
        return onSnapshot(
            q,
            (snapshot) => {
                const orders = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date()
                })) as Order[];

                onUpdate(orders);
            },
            (error) => {
                console.error('[OrderService] Subscription error:', error);
                onError?.(error);
            }
        );
    },

    /**
     * Update order status
     * 
     * @param orderId - The order to update
     * @param status - New status
     */
    async updateStatus(orderId: string, status: Order['status']): Promise<void> {
        const orderRef = doc(db, 'orders', orderId);

        await updateDoc(orderRef, {
            status,
            updatedAt: Timestamp.now(),
            ...(status === 'completed' && { completedAt: Timestamp.now() })
        });
    },

    /**
     * Archive an order (soft delete)
     */
    async archive(orderId: string): Promise<void> {
        const orderRef = doc(db, 'orders', orderId);

        await updateDoc(orderRef, {
            status: 'archived',
            archivedAt: Timestamp.now()
        });
    }
};

// ============================================================================
// WHY THIS PATTERN MATTERS
// ============================================================================
//
// Without Service Layer (BAD):
//   Component directly imports Firestore, mixes UI and data logic
//   Hard to test, hard to change database later
//
// With Service Layer (GOOD):
//   Component calls OrderService.subscribe()
//   Service handles all Firestore details
//   Easy to mock in tests, easy to swap databases
//
// ============================================================================
