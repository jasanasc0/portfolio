# Table Occupancy Architecture

**Last Updated:** 2026-01-12  
**Status:** Production  
**Security Level:** Hardened

---

## Overview

This document explains how CoffeeOS handles table occupancy tracking in a secure and scalable way. The system uses a **"Public Status Broadcaster"** pattern to separate sensitive order data from public table availability information.

**New Feature (2026-01-12):** The system now supports **Split Bills / Multi-Guest Ordering**. Multiple users can place independent orders at the same "Occupied" table simultaneously.

---

## The Problem We Solved

### Before (Insecure)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER'S BROWSER                           │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ "Give me ALL orders for this restaurant"
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         FIRESTORE                                    │
│  coffee_orders collection                                            │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Order 1: Table 5, John, Coffee + Croissant, ₱150.00             ││
│  │ Order 2: Table 2, Maria, Latte + Sandwich, ₱220.00              ││
│  │ Order 3: Table 7, Bob, Espresso, ₱50.00                         ││
│  │ ... ALL order details exposed!                                   ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘

⚠️ PROBLEMS:
1. Privacy violation — Customer A can see Customer B's order details
2. Data breach risk — Anyone with dev tools can dump all orders
3. Expensive — Downloading full order documents just to get table numbers
```

### After (Secure & Scalable)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER'S BROWSER                           │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ "What tables are busy?"
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         FIRESTORE                                    │
│  restaurants/{id}/public/status                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ {                                                                ││
│  │   occupiedTables: [2, 5, 7],    ← ONLY this!                    ││
│  │   _meta: { lastUpdated: ... }                                   ││
│  │ }                                                                ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘

✅ NO order details, NO names, NO prices exposed!
✅ Supports multiple guests at Table 2 (Split Bill)
```

---

## Split Bill / Multi-Guest Logic

As of Jan 12, 2026, the strict "One active order per table" constraint has been removed to support Split Bills.

### How it works:
1.  **Frontend (`useOrders.ts`):** 
    *   The client checks if *YOU* have an active order at the table.
    *   If yes, it appends items to your order.
    *   If no (even if someone else is eating there), it creates a **New Order** for you.
2.  **Backend (`placeordersecurely`):**
    *   The transactional collision check (`TABLE_OCCUPIED`) has been removed.
    *   The system allows multiple documents in `coffee_orders` with the same `tableNum` but different `userId`s.
3.  **Occupancy Status:**
    *   The table remains marked as "Occupied" in `public/status` as long as *at least one* active order exists.
    *   It only becomes "Free" when ALL orders on that table are completed/archived.

---

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                            CURRENT ARCHITECTURE                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────┐         ┌─────────────────┐         ┌─────────────────┐ │
│  │  Customer   │ ──────▶ │  public/status  │ ◀────── │ Cloud Functions │ │
│  │  Browser    │         │  {tables:[...]} │         │ (Sync Triggers) │ │
│  └─────────────┘         └─────────────────┘         └─────────────────┘ │
│        │                        ▲                           ▲             │
│        │                        │                           │             │
│        │ (own orders only)      │ (updates)                 │ (watches)   │
│        ▼                        │                           │             │
│  ┌─────────────┐         ┌─────────────────┐                │             │
│  │ Customer's  │         │ restaurant doc  │ ───────────────┤             │
│  │ Own Order   │         │ (manualOccup.)  │                │             │
│  └─────────────┘         └─────────────────┘                │             │
│                                                              │             │
│                          ┌─────────────────┐                │             │
│                          │  coffee_orders  │ ───────────────┘             │
│                          │  (ALL orders)   │                              │
│                          └─────────────────┘                              │
│                                 ▲                                          │
│                                 │                                          │
│                          ┌─────────────────┐                              │
│                          │  KDS / Admin    │ (full access)                │
│                          └─────────────────┘                              │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Cloud Functions Maintenance

### Ghost Order Prevention (Auto-Healing)
To prevent tables from getting stuck as "Busy" due to old, forgotten orders (Ghost Orders), the `syncTableOccupancy` helper function now includes a time filter:
*   It ONLY considers orders created within the **last 24 hours**.
*   Any order older than 24h is ignored for occupancy calculations.
*   This ensures the system "Self-Heals" daily.

---

## Troubleshooting

### Tables not showing as occupied?
1. Check if `public/status` document exists in Firestore
2. Verify Cloud Functions are deployed: `firebase deploy --only functions`

### Table stuck as "Busy" (Ghost Order)?
1. The system auto-heals after 24 hours.
2. To fix immediately: Use the KDS to find any `pending` orders.
3. If not visible in KDS (stale), check Firestore Console for orders > 24h old on that table.

### Permission denied errors? (Session Loss)
1. If a user closes their browser and re-opens, the ticket might vanish.
2. **Fix Implemented:** `AuthService` now enforces `browserLocalPersistence`. 
3. Verify the user is not in "Private/Incognito Mode" (which blocks persistence).

---

## Related Files
- `functions/src/index.ts` — Cloud Function logic (Collision check removed).
- `src/hooks/useOrders.ts` — Frontend split bill logic.
- `src/services/AuthService.ts` — Session persistence.
