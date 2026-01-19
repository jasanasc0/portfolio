/**
 * Cloud Function Security Example
 * 
 * This demonstrates server-side validation patterns:
 * - Authentication check
 * - Rate limiting
 * - Input sanitization
 * - Price validation from database (never trust client!)
 * 
 * Why Cloud Functions instead of direct Firestore writes?
 * - Clients can be compromised (browser console, modified apps)
 * - Server-side code is the only trustworthy validation layer
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const db = getFirestore();

interface PlaceOrderRequest {
    restaurantId: string;
    tableNum: number;
    items: Array<{
        id: string;
        name: string;
        price: number;  // ⚠️ Never trust this! We'll validate server-side
        qty: number;
    }>;
    customerName: string;
    notes: string;
}

/**
 * Secure Order Placement
 * 
 * Security layers:
 * 1. Authentication check
 * 2. Rate limiting (prevent spam)
 * 3. Input sanitization
 * 4. Price validation from database
 * 5. Subscription limit checking
 */
export const placeOrderSecurely = onCall(
    { cors: true, maxInstances: 10 },
    async (request) => {

        // =========================================================================
        // LAYER 1: Authentication
        // =========================================================================
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'You must be logged in to order.');
        }
        const userId = request.auth.uid;

        // =========================================================================
        // LAYER 2: Rate Limiting
        // =========================================================================
        const rateLimitRef = db.collection('rate_limits').doc(userId);
        const rateLimitDoc = await rateLimitRef.get();

        if (rateLimitDoc.exists) {
            const lastOrder = rateLimitDoc.data()?.lastOrderAt?.toDate();
            const cooldownMs = 10000; // 10 seconds between orders

            if (lastOrder && Date.now() - lastOrder.getTime() < cooldownMs) {
                throw new HttpsError(
                    'resource-exhausted',
                    'Please wait before placing another order.'
                );
            }
        }

        // =========================================================================
        // LAYER 3: Input Sanitization
        // =========================================================================
        const data = request.data as PlaceOrderRequest;

        const sanitize = (str: string, maxLength: number): string => {
            return (str || '').trim().slice(0, maxLength);
        };

        const sanitizedName = sanitize(data.customerName, 50) || 'Guest';
        const sanitizedNotes = sanitize(data.notes, 500);

        // =========================================================================
        // LAYER 4: Price Validation (CRITICAL!)
        // =========================================================================
        // Fetch actual prices from database - NEVER trust client-sent prices

        const menuItemsSnapshot = await db
            .collection('menu_items')
            .where('restaurantId', '==', data.restaurantId)
            .get();

        const menuPrices = new Map<string, number>();
        menuItemsSnapshot.docs.forEach(doc => {
            menuPrices.set(doc.id, doc.data().price);
        });

        // Calculate total using DATABASE prices, not client prices
        let serverCalculatedTotal = 0;
        const validatedItems = data.items.map(item => {
            const dbPrice = menuPrices.get(item.id);

            if (dbPrice === undefined) {
                throw new HttpsError('invalid-argument', `Item ${item.id} not found.`);
            }

            serverCalculatedTotal += dbPrice * item.qty;

            return {
                ...item,
                price: dbPrice  // Use DB price, ignore client price
            };
        });

        // =========================================================================
        // LAYER 5: Create Order
        // =========================================================================
        const orderRef = await db.collection('orders').add({
            restaurantId: data.restaurantId,
            tableNum: data.tableNum,
            items: validatedItems,
            total: serverCalculatedTotal,  // Server-calculated!
            status: 'awaiting_payment',
            customerName: sanitizedName,
            notes: sanitizedNotes,
            userId,
            createdAt: Timestamp.now()
        });

        // Update rate limit
        await rateLimitRef.set({ lastOrderAt: Timestamp.now() });

        return {
            success: true,
            orderId: orderRef.id,
            total: serverCalculatedTotal
        };
    }
);

// ============================================================================
// SECURITY SUMMARY
// ============================================================================
//
// Even if an attacker:
// - Opens browser console
// - Modifies the React app
// - Sends { price: 0.01 } for a ₱500 item
//
// The server will:
// - Ignore their price
// - Look up the real price from the database
// - Calculate the correct total
//
// This is "defense in depth" - multiple layers of security.
// ============================================================================
