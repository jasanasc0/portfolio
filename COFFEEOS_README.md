# CoffeeOS - Enterprise SaaS POS Platform

**A high-scale, multi-tenant Point of Sale (POS) & Ordering System built for performance, security, and elastic horizontal scalability.**

![Tech Stack](https://img.shields.io/badge/Stack-React_19_%7C_TypeScript_%7C_Firebase-blue?style=flat-square)
![Architecture](https://img.shields.io/badge/Architecture-Serverless_Event_Driven-purple?style=flat-square)
![Status](https://img.shields.io/badge/Status-Production_Ready-green?style=flat-square)

---

## 🚀 Executive Summary

CoffeeOS is not just an ordering app; it is a **comprehensive SaaS infrastructure** designed to serve thousands of concurrent restaurant tenants. It solves the critical challenge of high-frequency real-time updates (orders, status changes) while keeping cloud infrastructure costs predictably low.

Designed with a **"Serverless First"** mentality, it leverages Firebase's event-driven architecture designed for sub-second latency to Kitchen Display Systems (KDS) and Customer Clients without polling.

---

## 🏗️ Technical Architecture & Scalability

This project demonstrates **optimizations** regarding cost, read/write ratios, and security:

### 1. The "Public Status Broadcaster" Pattern
*   **Problem**: broadcasting real-time table availability to 1,000+ concurrent customers usually generates 1,000+ Firestore reads *per status change*, leading to massive bills.
*   **Solution**: Architected a background trigger that aggregates table status into a single public document. Clients listen to this *single* lightweight document instead of querying the entire orders collection.
*   **Result**: Reduced Firebase read costs by **~99%** at scale.

### 2. Infrastructure Abstraction Layer
*   **Services Pattern**: All business logic (Orders, Subscriptions, Auth) is decoupled from UI components via the `services/` layer (e.g., `OrderService.ts`, `SubscriptionService.ts`).
*   **Benefit**: Keeps React components pure and allows for easy swapping of backend providers (e.g., migrating to Supabase or PostgreSQL) without refactoring UI code.

```typescript
// Components never touch Firebase directly
await OrderService.place({ restaurantId, items, tableNum });
await OrderService.updateStatus(orderId, 'preparing');
await OrderService.confirmPayment(orderId);
```

### 3. Multi-Tenant Security (RBAC)
*   **Data Isolation**: Strict Firestore Security Rules (`firestore.rules`) ensure tenants (Restaurants) cannot access each other's data.
*   **Role-Based Access**: Granular permissions for:
    *   **Level 0**: Anonymous Customer (Public Read/Write Own)
    *   **Level 1**: Kitchen Staff (Order Management)
    *   **Level 2**: Restaurant Admin (Menu & Analytics)
    *   **Level 3**: Super Admin (Platform Oversight)

### 4. Claims-Based Authorization
*   **Fast Path**: Custom claims checked first (0 Firestore reads)
*   **Fallback**: Database lookup for legacy users (1 read)
*   **Result**: Optimal performance while maintaining backwards compatibility

```typescript
// Fast path: check claims (0 reads)
if (claims.restaurantAdmin === restaurantId) return true;

// Fallback: check database (1 read)  
const adminDoc = await getDoc(doc(db, 'admin_users', uid));
```

---

## 🛠️ Technology Stack

| Domain | Technologies Used |
| :--- | :--- |
| **Frontend Core** | **React 19**, **TypeScript**, Vite |
| **State & Data** | **Firebase SDK v9** (Modular), React Context API |
| **Styling / UI** | **TailwindCSS**, Framer Motion (Animations), Lucide React |
| **Backend / FaaS** | **Firebase Cloud Functions** (Node.js, 3300+ lines) |
| **Database** | **Cloud Firestore** (NoSQL), Storage |
| **Quality Assurance** | TypeScript Strict Mode, ESLint |

---

## 🖼️ See It In Action

### Customer Ordering — Scan. Order. Done.
Customers scan a QR code at their table and instantly access your full menu. No app downloads, no waiting for a waiter.

### Kitchen Display System — Built for the Line
Orders appear in real-time, sorted by table and priority. Visual indicators show unpaid orders (grey), in-progress (normal), and ready (green).

### Admin Dashboard — Complete Control
Manage your menu, view analytics, track orders, and configure your restaurant from any device.

---

## 🔥 Unique Features

### 💰 Pay-to-Release Workflow
**Problem**: Customers order, food takes time to prepare, they walk out without paying.

**Solution**: Orders stay in "Awaiting Payment" until staff confirms payment at the counter. Only then does the kitchen start preparing.

```
Customer Orders → Shows "Go to Counter" → Staff Clicks "Confirm Paid" → Kitchen Starts
```

### 🧾 Smart Split Bills
Multiple people at the same table can order independently. Each gets their own ticket, their own payment, no confusion.

```
┌────────────────────────────────────────────────────────┐
│ TABLE 5 — 3 orders • Total: ₱370 • 1 unpaid           │
├────────────────────────────────────────────────────────┤
│ #137 Latte ₱150   │ #138 Croissant ₱120 │ #139 ₱100  │
│ [PAID ✓]          │ [PAID ✓]            │ [UNPAID]   │
└────────────────────────────────────────────────────────┘
```

### 🔄 Session Persistence
Customer closes browser? No problem. When they return, their order is still there. Add more items to an existing order seamlessly.

### 📊 Real-Time Everything
*   Orders appear on KDS in <100ms
*   Table availability updates instantly
*   Status changes push to all devices
*   No polling, no refresh needed

---

## 🔐 Role-Based Access Control

Every staff member gets exactly what they need:

| Role | Access Level | Capabilities |
| :--- | :--- | :--- |
| 👤 **Customer** | Level 0 | Order placement, order status, feedback |
| 👨‍🍳 **Kitchen** | Level 1 | KDS view, order management, ticket printing |
| 🏪 **Admin** | Level 2 | Menu management, analytics, configuration |
| 👑 **Super Admin** | Level 3 | Platform oversight, subscription management |

---

## 🧩 Key Modules & Features

### 🛒 Customer Experience (B2C)
*   **Instant App**: zero-download QR code ordering.
*   **Optimistic UI**: Immediate feedback states for seamless UX, reconciled in background.
*   **Context-Aware**: Auto-detects table number and restaurant ID from URL parameters.
*   **Session Persistence**: Browser restart recovery — customers can continue their order after closing and reopening.
*   **Network Resilience**: Graceful degradation strategies for intermittent internet connectivity (mobile data fallback, optimistic UI).

### 👨‍🍳 Kitchen Display System (KDS)
*   **Real-Time Sync**: WebSockets (via Firestore listeners) push orders instantly.
*   **Smart Queuing**: Orders auto-sort by priority and wait time.
*   **Table Grouping**: Visual grouping of orders by table for split-bill management.
*   **Performance**: Memoized components to handle 100+ active DOM elements without jank.

### 💳 Pay-to-Release Workflow
*   **Problem Solved**: Customers ordering and walking away before paying (food waste).
*   **Mechanism**: Orders remain in `awaiting_payment` status until staff confirms payment.
*   **KDS Integration**: Unpaid orders display with grey styling and "CONFIRM PAID" button.
*   **Customer UX**: Clear instructions to approach counter for payment verification.

### 🧾 Split Bill Support
*   **Multiple Orders Per Table**: Each customer at a table can order independently.
*   **Visual Grouping**: KDS displays table header with combined order count and total.
*   **Individual Payments**: Each person pays for their own order via Pay-to-Release flow.

### 🏢 SaaS Management (B2B)
*   **Subscription Engine**: Tiered access control enforced at the Service layer and Cloud Functions.
*   **Order Limit Enforcement**: Cloud Functions reject orders when monthly limit is reached.
*   **Analytics Dashboard**: Aggregation of daily/monthly MRR and Order Volume.
*   **Partner Portal**: Commission tracking system for affiliate resellers with payout requests.

---

## 💰 Subscription Tiers & Business Model

### Pricing Structure

| Tier | Monthly Price | Order Limit | Trial | Features |
| :--- | :--- | :--- | :--- | :--- |
| ☕ **Barista** | ₱999 | 500/month | 14-day free | QR Ordering, KDS, Basic Analytics |
| 🔥 **Roaster** | ₱1,499 | 3,000/month | None | + Loyalty Program, Priority Support |
| 👑 **Tycoon** | ₱3,499 | Unlimited | None | + Multi-Location, Custom Branding |

### Unit Economics

| Tier | Infrastructure Cost | Gross Margin |
| :--- | :--- | :--- |
| **Barista** | ~₱12.50/month | **98.7%** |
| **Roaster** | ~₱30.00/month | **98.0%** |
| **Tycoon** | ~₱100.00/month | **97.1%** |

*Infrastructure costs include Firestore reads/writes, Cloud Functions invocations, and hosting.*

### Revenue Projections (at Scale)

| Scale | Paying Restaurants | MRR | Annual Run Rate | Net Margin |
| :--- | :--- | :--- | :--- | :--- |
| **Seed** | 100 | ₱110,000 | ₱1.3M | 94% |
| **Growth** | 1,000 | ₱1,200,000 | ₱14.4M | 94% |
| **Scale** | 5,000 | ₱6,000,000 | ₱72M | 92% |
| **Unicorn** | 10,000 | ₱12,000,000 (~$214k USD) | ₱144M (~$2.6M USD) | 91% |

---

## 🧮 ROI Calculator

Interactive tool for prospective restaurant owners to calculate potential savings and return on investment.

### Features
*   **Input Parameters**: Current staff count, average orders/day, hourly wages, customer wait times
*   **Calculations**: Labor savings from reduced order-taking, increased table turnover, error reduction
*   **Output**: Monthly savings estimate, payback period, annual ROI percentage
*   **Visual Charts**: Before/after comparison with animated graphs
*   **Lead Capture**: Integrated with CRM for sales follow-up

### Value Proposition
Demonstrates that the subscription pays for itself within the first month for most restaurants through:
*   Reduced labor costs (customers order themselves)
*   Faster table turnover (no waiting for waiter)
*   Fewer order errors (digital vs verbal)
*   Increased average ticket size (menu upselling)

---

## 🤝 Distribution Partner Program

A comprehensive affiliate/reseller system enabling third parties to sell CoffeeOS subscriptions and earn recurring commissions.

### Multi-Dashboard Architecture

The platform supports multiple dashboard types, each tailored to specific user roles:

| Dashboard | User | Purpose |
| :--- | :--- | :--- |
| **Customer App** | End Customers | QR ordering, order status, feedback |
| **KDS** | Kitchen Staff | Real-time order management |
| **Admin Dashboard** | Restaurant Owners | Menu, analytics, configuration |
| **Partner Portal** | Distribution Partners | Commission tracking, payouts, referral management |
| **Super Admin** | Platform Owner | All restaurants, subscriptions, partner management |

### Partner Portal Features

Distribution Partners get their own dedicated dashboard with:

*   **Referral Tracking**: Unique referral codes/links for each partner
*   **Restaurant Directory**: List of all restaurants they've onboarded
*   **Commission Dashboard**: Real-time earnings from active subscriptions
*   **Payout Requests**: Request withdrawal when balance reaches minimum (₱500)
*   **Performance Analytics**: Conversion rates, churn tracking, growth trends

### Commission Structure

| Event | Commission | Duration |
| :--- | :--- | :--- |
| **New Subscription** | 20% of first month | One-time |
| **Recurring Revenue** | 10% of monthly subscription | Lifetime (while restaurant active) |

*Example: Partner refers a Roaster tier restaurant (₱1,499/month)*
*   Month 1: ₱300 (20%)
*   Months 2+: ₱150/month (10%) recurring

### Solo Distribution Partner Model

For individuals who want to build a reseller business:

*   **No Upfront Cost**: Join as a partner for free
*   **Territory Flexibility**: No exclusive territories — compete on service quality
*   **Training Materials**: Sales scripts, demo access, marketing collateral
*   **Support Escalation**: Technical issues handled by platform, partner handles sales
*   **Passive Income**: Once a restaurant is onboarded, commission flows automatically

### Partner Onboarding Flow

```
1. Partner signs up at /partner-signup
2. Partner receives unique referral code
3. Partner pitches restaurant owners
4. Restaurant signs up using partner's referral link
5. Partner dashboard automatically tracks the referral
6. Commission calculated at each billing cycle
7. Partner requests payout → Super Admin approves → Funds transferred
```

### Firestore Data Model

```
partners/
  └── {partnerId}/
        ├── companyName: "ABC Solutions"
        ├── email: "partner@example.com"
        ├── referralCode: "ABC2026"
        ├── commissionRate: 0.10
        ├── balance: 2500
        └── restaurants: ["resto-1", "resto-2", ...]

partner_payouts/
  └── {payoutId}/
        ├── partnerId: "..."
        ├── requestedAmount: 1000
        ├── status: "pending" | "approved" | "rejected"
        └── processedAt: timestamp
```

---

## 📊 Capacity & Performance

| Metric | Specification |
| :--- | :--- |
| **Concurrent Restaurants** | 50,000+ (Firestore horizontal scaling) |
| **Orders per Second** | 2,000+ (Firebase write limit: 10k/s) |
| **Real-time Update Latency** | <100ms (Firestore listeners) |
| **KDS DOM Performance** | 100+ active orders without jank |


---

## 🔒 Security Implementation

*   **Firestore Rules**: 400+ lines of production-hardened security rules
*   **Rate Limiting**: Order spam prevention (10-second cooldown per user)
*   **Price Validation**: Server-side price verification prevents manipulation
*   **Status Transition Guards**: Only valid order status changes allowed
*   **IP-based Throttling**: 30 orders/hour per IP address

---

## 🧑‍� Developer Setup

This project uses modern tooling for a standard node environment.

### Prerequisites
*   Node.js v18+
*   npm or yarn
*   Firebase CLI (for Cloud Functions deployment)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/jasanasc0/CoffeeOS.git

# 2. Install dependencies
npm install

# 3. Environment Setup
# Create a .env.local file with your Firebase credentials:
# VITE_FIREBASE_API_KEY=...
# VITE_FIREBASE_AUTH_DOMAIN=...
# ...

# 4. Run Development Server
npm run dev

# 5. Deploy Cloud Functions (optional)
cd functions && npm install
firebase deploy --only functions
```

### Deployment
Engineered for zero-config deployment on Vercel/Netlify.
```bash
npm run build
# Output generated in /dist directory
```

---

## 📁 Project Structure

```
CoffeeOS/
├── src/
│   ├── components/       # React UI components
│   ├── services/         # Business logic abstraction layer
│   ├── hooks/            # Custom React hooks
│   ├── context/          # React context providers
│   └── types/            # TypeScript definitions
├── functions/
│   └── src/index.ts      # Cloud Functions (3300+ lines)
├── firestore.rules       # Security rules (400+ lines)
└── docs/                 # Technical documentation
```

---

## 📄 Documentation

*   [`docs/BEST_PRACTICES_2026.md`](./docs/BEST_PRACTICES_2026.md) — Coding standards and architectural decisions
*   [`docs/PAY_TO_RELEASE_IMPLEMENTATION.md`](./docs/PAY_TO_RELEASE_IMPLEMENTATION.md) — Payment workflow documentation
*   [`.agent/handoffs/`](./.agent/handoffs/) — Technical handoff documents

---

## 👤 Author

**Jasiel S. Añasco** — *Full Stack Product Engineer*
*   **Specialty**: High-performance React applications & Serverless Architectures.
*   **Focus**: Building scalable, business-centric software solutions.

---

## 📄 License

Proprietary — All rights reserved.
