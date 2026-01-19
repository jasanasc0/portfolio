# 🏗️ CoffeeOS Architecture Blueprint
## A Reusable Template for Multi-Tenant SaaS Applications

**Author**: Jasiel S. Añasco  
**Last Updated**: January 2026  
**Stack**: React 19 + TypeScript + Firebase (Serverless)

---

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────┬─────────────────┬─────────────────┬──────────────────────┤
│   Customer App  │      KDS        │  Admin Dashboard│   Partner Portal     │
│   (React SPA)   │  (React SPA)    │   (React SPA)   │    (React SPA)       │
│                 │                 │                 │                      │
│  • QR Ordering  │  • Order Queue  │  • Menu CRUD    │  • Commission Track  │
│  • Status View  │  • Status Mgmt  │  • Analytics    │  • Payout Request    │
│  • Feedback     │  • Print Ticket │  • Config       │  • Referral Links    │
└────────┬────────┴────────┬────────┴────────┬────────┴──────────┬───────────┘
         │                 │                 │                   │
         └─────────────────┴────────┬────────┴───────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER (Frontend)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   OrderService.ts    SubscriptionService.ts    AuthService.ts               │
│   MenuService.ts     AnalyticsService.ts       PartnerService.ts            │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  • Abstracts ALL Firebase operations                                │   │
│   │  • Components NEVER import from 'firebase/...'                      │   │
│   │  • Enables backend swapping (Firebase → Supabase → PostgreSQL)      │   │
│   │  • Centralized error handling and retry logic                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────┬───────────────┘
                                                              │
                     ┌────────────────────────────────────────┴───────────────┐
                     │                                                        │
                     ▼                                                        ▼
┌─────────────────────────────────────┐        ┌──────────────────────────────┐
│         FIRESTORE (Database)        │        │    CLOUD FUNCTIONS (FaaS)    │
├─────────────────────────────────────┤        ├──────────────────────────────┤
│                                     │        │                              │
│  restaurants/                       │        │  Callable Functions:         │
│    └── {restaurantId}/              │        │    • placeordersecurely      │
│          ├── config, menu, etc.     │        │    • confirmpayment          │
│          └── public/status          │        │    • redeemreward            │
│                                     │        │    • requestpayout           │
│  coffee_orders/                     │        │                              │
│    └── {orderId}/                   │        │  Triggers:                   │
│          ├── items, status, total   │        │    • onOrderChange           │
│          └── tableNum, userId       │        │    • onSubscriptionChange    │
│                                     │        │    • syncTableOccupancy      │
│  admin_users/                       │        │                              │
│  partners/                          │        │  Scheduled:                  │
│  subscriptions/                     │        │    • dailyAnalytics          │
│                                     │        │    • monthlyBilling          │
└─────────────────────────────────────┘        └──────────────────────────────┘
         │                                                    │
         │                                                    │
         ▼                                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   firestore.rules (400+ lines)          Cloud Functions Validation          │
│   ┌─────────────────────────────┐       ┌─────────────────────────────┐     │
│   │ • Multi-tenant isolation    │       │ • Price validation          │     │
│   │ • Claims-based auth         │       │ • Rate limiting             │     │
│   │ • Status transition guards  │       │ • Subscription enforcement  │     │
│   │ • Field-level permissions   │       │ • Input sanitization        │     │
│   └─────────────────────────────┘       └─────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Patterns

### Pattern 1: Customer Places Order

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Customer   │      │  OrderService│      │   Cloud Fn   │      │  Firestore   │
│   (React)    │      │   (Client)   │      │ (placeorder) │      │  (Database)  │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │                     │
       │  1. Click "Order"   │                     │                     │
       │────────────────────>│                     │                     │
       │                     │                     │                     │
       │                     │  2. httpsCallable   │                     │
       │                     │────────────────────>│                     │
       │                     │                     │                     │
       │                     │                     │  3. Validate:       │
       │                     │                     │  - Auth             │
       │                     │                     │  - Rate Limit       │
       │                     │                     │  - Subscription     │
       │                     │                     │  - Price Match      │
       │                     │                     │                     │
       │                     │                     │  4. Write Order     │
       │                     │                     │────────────────────>│
       │                     │                     │                     │
       │                     │                     │  5. Trigger:        │
       │                     │                     │  onOrderCreate      │
       │                     │                     │<────────────────────│
       │                     │                     │                     │
       │                     │                     │  6. Update:         │
       │                     │                     │  public/status      │
       │                     │                     │────────────────────>│
       │                     │                     │                     │
       │                     │  7. Return orderId  │                     │
       │                     │<────────────────────│                     │
       │                     │                     │                     │
       │  8. Navigate to     │                     │                     │
       │     /status         │                     │                     │
       │<────────────────────│                     │                     │
       │                     │                     │                     │
```

### Pattern 2: Real-Time Updates (Pub/Sub via Firestore)

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│     KDS      │      │  Firestore   │      │   Customer   │
│   (React)    │      │  Listeners   │      │   (React)    │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       │  Subscribe to       │                     │
       │  coffee_orders      │                     │
       │  where restaurantId │                     │
       │────────────────────>│                     │
       │                     │                     │
       │                     │   Subscribe to      │
       │                     │   order by ID       │
       │                     │<────────────────────│
       │                     │                     │
       │                     │                     │
       │    ═══════════════ ORDER STATUS CHANGES ═══════════════
       │                     │                     │
       │  onSnapshot fires   │                     │
       │<────────────────────│                     │
       │                     │   onSnapshot fires  │
       │                     │────────────────────>│
       │                     │                     │
       │  Update UI          │                     │  Update UI
       │  (< 100ms)          │                     │  (< 100ms)
       │                     │                     │
```

### Pattern 3: Public Status Broadcaster (Cost Optimization)

```
WITHOUT OPTIMIZATION:                    WITH OPTIMIZATION:
                                        
  1000 Customers                          1000 Customers
       │                                       │
       │ Each subscribes to                    │ Each subscribes to
       │ coffee_orders collection              │ ONE document
       │                                       │
       ▼                                       ▼
  ┌─────────┐                            ┌─────────────────┐
  │ 1000    │                            │ public/status   │
  │ reads   │ × every status change      │ { tables: [...]}│
  │ per     │                            │                 │
  │ change  │                            │ 1 read per      │
  └─────────┘                            │ customer        │
                                         └─────────────────┘
  COST: $$$$$                            COST: $
                                         
  Cloud Function updates this ONE doc whenever orders change.
```

---

## 🏛️ Multi-Tenant Data Architecture

```
Firestore Database Structure:

restaurants/                          # One doc per tenant
  └── {restaurantId}/
        ├── name: "Fireside Cafe"
        ├── ownerId: "uid123"
        ├── subscription: { tier, ordersUsed, ordersLimit }
        ├── config: { currency, theme, features }
        │
        ├── menu/                     # Subcollection
        │     └── {itemId}/
        │           ├── name, price, variations
        │           └── modifiers[]
        │
        └── public/                   # Publicly readable
              └── status/
                    └── occupiedTables: [1, 3, 5]

coffee_orders/                        # Flat collection (for cross-restaurant queries)
  └── {orderId}/
        ├── restaurantId: "fireside-cafe"   ← Tenant isolation key
        ├── userId: "anon-uid"
        ├── tableNum: 5
        ├── status: "preparing"
        ├── items: [...]
        └── total: 250

admin_users/                          # Access control
  └── {uid}/
        ├── email: "owner@cafe.com"
        ├── restaurantId: "fireside-cafe"
        └── role: "owner" | "staff"

partners/                             # Distribution partners
  └── {partnerId}/
        ├── companyName, email
        ├── referralCode: "ABC2026"
        ├── commissionRate: 0.10
        └── balance: 2500
```

---

## 🔐 Security Architecture

### Layer 1: Firestore Rules (Client-Side Enforcement)

```javascript
// Tenant Isolation - Order Read Access
match /coffee_orders/{orderId} {
    allow read: if 
        isSuperAdmin() ||
        // Admin can read restaurant's orders
        isRestaurantAdmin(resource.data.restaurantId) ||
        // Kitchen staff can read orders for their restaurant
        hasKitchenAccess(resource.data.restaurantId) ||
        // Partners can read orders for commission analytics
        isPartnerOf(resource.data.restaurantId) ||
        // Customer can read their own orders
        (isAuthenticated() && resource.data.userId == request.auth.uid);
    
    allow create: if false;  // Only Cloud Functions can create
    
    allow update: if 
        isRestaurantAdmin(resource.data.restaurantId) &&
        onlyAllowedFieldsChanged(['status', 'items']);
}

// Claims-Based Fast Path (uses TWO separate claims)
function isRestaurantAdminFast(restaurantId) {
    return request.auth.token.restaurantAdmin == true &&
           request.auth.token.restaurantId == restaurantId;
}

// Kitchen Access (single string, NOT array)
function hasKitchenAccess(rid) {
    return isAuthenticated() && request.auth.token.kitchenAccess == rid;
}
```

### Layer 2: Cloud Functions (Server-Side Enforcement)

```typescript
// Every sensitive operation validates:
export const placeordersecurely = onCall(async (request) => {
    // 1. Authentication
    if (!request.auth) throw new HttpsError('unauthenticated', '...');
    
    // 2. Rate Limiting
    const lastOrder = await checkRateLimit(request.auth.uid);
    if (tooFast) throw new HttpsError('resource-exhausted', '...');
    
    // 3. Subscription Limit
    const sub = await getSubscription(restaurantId);
    if (sub.ordersUsed >= sub.ordersLimit) throw new HttpsError('failed-precondition', '...');
    
    // 4. Price Validation
    const serverPrice = await calculatePrice(items, menuItems);
    if (serverPrice !== clientPrice) throw new HttpsError('invalid-argument', '...');
    
    // 5. Write with Admin SDK (bypasses rules)
    await db.collection('coffee_orders').add({ ... });
});
```

### Layer 3: Custom Claims (Zero-Read Auth)

```typescript
// Set on user during onboarding:
await auth.setCustomUserClaims(uid, {
    // Admin claims (TWO separate fields)
    restaurantAdmin: true,
    restaurantId: 'fireside-cafe',
    // Kitchen access (STRING, not array)
    kitchenAccess: 'fireside-cafe',
    // Partner claims (array for multi-restaurant)
    partnerRestaurants: ['fireside-cafe', 'other-cafe'],
    superAdmin: false
});

// Check in rules (0 Firestore reads):
// Admin: request.auth.token.restaurantAdmin == true && request.auth.token.restaurantId == rid
// Kitchen: request.auth.token.kitchenAccess == rid
// Partner: rid in request.auth.token.partnerRestaurants
```

---

## 📁 Project Structure Blueprint

```
src/
├── components/                  # UI Components
│   ├── CustomerApp/            # Customer-facing screens
│   ├── KitchenDisplay/         # KDS components
│   ├── AdminDashboard/         # Admin screens
│   └── ui/                     # Shared UI primitives
│
├── services/                   # ← CRITICAL LAYER
│   ├── OrderService.ts         # All order operations
│   ├── MenuService.ts          # Menu CRUD
│   ├── AuthService.ts          # Authentication
│   ├── SubscriptionService.ts  # Billing logic
│   └── AnalyticsService.ts     # Reporting
│
├── hooks/                      # State management
│   ├── useOrders.ts            # Order state + subscription
│   ├── useAuth.ts              # Auth state
│   └── useCart.ts              # Cart state
│
├── context/                    # Global state
│   └── RestaurantContext.tsx   # Main context provider
│
├── types/                      # TypeScript definitions
│   ├── schema.ts               # Data models
│   └── config.ts               # Configuration types
│
└── lib/                        # Utilities
    ├── firebase-config.ts      # Firebase init
    ├── formatters.ts           # Price, date formatting
    └── sounds.ts               # Audio utilities

functions/
└── src/
    └── index.ts                # All Cloud Functions (3300+ lines)
                                # - Callable functions
                                # - Firestore triggers
                                # - Scheduled jobs
```

---

## 🔄 State Management Pattern

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          RestaurantContext                                  │
│                    (Single Source of Truth)                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                │
│   │  useAuth()   │    │  useOrders() │    │  useCart()   │                │
│   │              │    │              │    │              │                │
│   │ • user       │    │ • orders     │    │ • cart       │                │
│   │ • adminUser  │    │ • placeOrder │    │ • addToCart  │                │
│   │ • login      │    │ • updateStatus│   │ • clearCart  │                │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                │
│          │                   │                   │                         │
│          └───────────────────┼───────────────────┘                         │
│                              │                                             │
│                              ▼                                             │
│                    Context Value Object                                    │
│                    { session, operations, commerce, menu, ui }             │
│                                                                            │
└────────────────────────────────────────────┬───────────────────────────────┘
                                             │
                                             ▼
                                    Components consume via
                                    const { operations } = useRestaurant();
```

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRODUCTION                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────┐         ┌─────────────────────┐                  │
│   │       Vercel        │         │      Firebase       │                  │
│   │   (Frontend Host)   │         │   (Backend + DB)    │                  │
│   ├─────────────────────┤         ├─────────────────────┤                  │
│   │                     │         │                     │                  │
│   │  • React SPA        │         │  • Cloud Firestore  │                  │
│   │  • Edge CDN         │         │  • Cloud Functions  │                  │
│   │  • Auto SSL         │         │  • Authentication   │                  │
│   │  • Preview Deploys  │         │  • Cloud Storage    │                  │
│   │                     │         │                     │                  │
│   │  Cost: Free tier    │         │  Cost: Pay-as-you-go│                  │
│   │        sufficient   │         │        ~₱0.005/order│                  │
│   │                     │         │                     │                  │
│   └──────────┬──────────┘         └──────────┬──────────┘                  │
│              │                               │                              │
│              │         HTTPS Calls           │                              │
│              └───────────────────────────────┘                              │
│                                                                             │
│   Domain: ares-pos.vercel.app                                               │
│   Routes: /{restaurantId}/* → Tenant-specific experience                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 SaaS Blueprint Checklist

Use this for your next SaaS app:

### 1. Multi-Tenancy
- [ ] Tenant ID on every document
- [ ] Security rules enforce tenant isolation
- [ ] Claims-based fast path for auth
- [ ] Separate admin/customer experiences

### 2. Service Layer
- [ ] Components never import Firebase directly
- [ ] All operations through `*Service.ts` files
- [ ] Centralized error handling
- [ ] Easy to swap backends later

### 3. Real-Time
- [ ] Firestore listeners for live updates
- [ ] Optimistic UI for responsiveness
- [ ] Public broadcaster for scale optimization

### 4. Security
- [ ] Firestore rules (client enforcement)
- [ ] Cloud Functions (server enforcement)
- [ ] Custom claims (zero-read auth)
- [ ] Rate limiting (abuse prevention)
- [ ] Price validation (fraud prevention)

### 5. Billing
- [ ] Subscription tiers with feature gates
- [ ] Usage tracking (orders used/limit)
- [ ] Enforcement at Cloud Function level
- [ ] Trial period handling

### 6. Analytics
- [ ] Event-driven aggregation
- [ ] Scheduled rollups (daily/monthly)
- [ ] Real-time dashboards
- [ ] Export capabilities

---

## 🎯 Key Learnings

1. **Service Layer is Non-Negotiable**
   - Future you will thank present you
   - Backend migrations become possible

2. **Claims > Database Lookups**
   - Set claims on user creation/role change
   - Check claims first, database as fallback

3. **Public Broadcaster Pattern**
   - Aggregated public data in one document
   - 99% cost reduction at scale

4. **Cloud Functions for Sensitive Operations**
   - Never trust the client for pricing
   - Rate limit everything

5. **Flat Collections with Tenant IDs**
   - Enables cross-tenant admin queries
   - Simpler than deeply nested subcollections

---

**This blueprint is your recipe. Use it well.** 🚀
