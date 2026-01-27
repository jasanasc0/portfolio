# 🚀 Jasiel Añasco — Portfolio Code Samples

> **Full-Stack Engineer** specializing in TypeScript, React, and Real-Time SaaS Architecture

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

---

## 👋 About Me

I'm a full-stack developer from the Philippines with experience building production-grade SaaS applications. I focus on:

- **Real-time systems** — Firestore subscriptions, WebSockets
- **Clean architecture** — Service layers, separation of concerns
- **Security-first design** — Server-side validation, RBAC, defense in depth
- **Cost optimization** — Efficient database patterns that scale

---

## 🏆 Featured Project: CoffeeOS

**A high-scale, multi-tenant Point of Sale (POS) & Ordering System built for performance, security, and elastic horizontal scalability.**

![Tech Stack](https://img.shields.io/badge/Stack-React_19_%7C_TypeScript_%7C_Firebase-blue?style=flat-square)
![Architecture](https://img.shields.io/badge/Architecture-Serverless_Event_Driven-purple?style=flat-square)
![Status](https://img.shields.io/badge/Status-Production_Ready-green?style=flat-square)

🔗 **Live Demo:** [ares-pos.vercel.app](https://ares-pos.vercel.app) • 📹 **Video Demo:** [Watch Preview](./docs/CoffeeOS.mp4)

CoffeeOS is not just an ordering app; it is a **comprehensive SaaS infrastructure** designed to serve thousands of concurrent restaurant tenants. It solves the critical challenge of high-frequency real-time updates (orders, status changes) while keeping cloud infrastructure costs predictably low.

---

## 🏗️ Technical Architecture & Scalability

This project demonstrates **optimizations** regarding cost, read/write ratios, and security:

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React + TypeScript)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Customer App │  │ Kitchen KDS  │  │ Admin Panel  │  │ SaaS Dashboard│   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                         ┌────────────┴────────────┐
                         │    Service Layer        │
                         │ (AuthService, OrderService, etc.)
                         └────────────┬────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│ Firebase Auth │           │ Cloud Functions│           │   Firestore   │
│ (Anonymous +  │           │ (Secure order  │           │  (Real-time   │
│  Admin login) │           │  placement)    │           │   database)   │
└───────────────┘           └───────────────┘           └───────────────┘
```

### 1. The "Public Status Broadcaster" Pattern

- **Problem**: Broadcasting real-time table availability to 1,000+ concurrent customers usually generates 1,000+ Firestore reads *per status change*, leading to massive bills.
- **Solution**: Architected a background trigger that aggregates table status into a single public document. Clients listen to this *single* lightweight document instead of querying the entire orders collection.
- **Result**: Reduced Firebase read costs by **~99%** at scale.

### 2. Infrastructure Abstraction Layer

- **Services Pattern**: All business logic (Orders, Subscriptions, Auth) is decoupled from UI components via the `services/` layer (e.g., `OrderService.ts`, `SubscriptionService.ts`).
- **Benefit**: Keeps React components pure and allows for easy swapping of backend providers (e.g., migrating to Supabase or PostgreSQL) without refactoring UI code.

```typescript
// Components never touch Firebase directly
await OrderService.place({ restaurantId, items, tableNum });
await OrderService.updateStatus(orderId, 'preparing');
await OrderService.confirmPayment(orderId);
```

### 3. Multi-Tenant Security (RBAC)

- **Data Isolation**: Strict Firestore Security Rules (`firestore.rules`) ensure tenants (Restaurants) cannot access each other's data.
- **Role-Based Access**: Granular permissions for:
    - **Level 0**: Anonymous Customer (Public Read/Write Own)
    - **Level 1**: Kitchen Staff (Order Management)
    - **Level 2**: Restaurant Admin (Menu & Analytics)
    - **Level 3**: Super Admin (Platform Oversight)

### 4. Claims-Based Authorization

- **Fast Path**: Custom claims checked first (0 Firestore reads)
- **Fallback**: Database lookup for legacy users (1 read)
- **Result**: Optimal performance while maintaining backwards compatibility

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

## 🔥 Key Features

### 💰 Pay-to-Release Workflow

**Problem**: Customers order, food takes time to prepare, they walk out without paying.

**Solution**: Orders stay in "Awaiting Payment" until staff confirms payment at the counter. Only then does the kitchen start preparing.

```
Customer Orders → Shows "Go to Counter" → Staff Clicks "Confirm Paid" → Kitchen Starts
```

### 🧾 Smart Split Bills

Multiple people at the same table can order independently. Each gets their own ticket, their own payment, no confusion.

```
┌────────────────────────────────────────────────────────────────┐
│ TABLE 5 — 3 orders • Total: ₱370 • 1 unpaid                   │
├────────────────────────────────────────────────────────────────┤
│ #137 Latte ₱150   │ #138 Croissant ₱120 │ #139 ₱100           │
│ [PAID ✓]          │ [PAID ✓]            │ [UNPAID]            │
└────────────────────────────────────────────────────────────────┘
```

### 🔄 Session Persistence

Customer closes browser? No problem. When they return, their order is still there. Add more items to an existing order seamlessly.

### 📊 Real-Time Everything

- Orders appear on KDS in <100ms
- Table availability updates instantly
- Status changes push to all devices
- No polling, no refresh needed

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

## 💰 Subscription Tiers & Business Model

### Pricing Structure

| Tier | Monthly Price | Order Limit | Trial | Features |
| :--- | :--- | :--- | :--- | :--- |
| ☕ **Barista** | ₱499 | 500/month | 14-day free | QR Ordering, KDS, Basic Analytics |
| 🔥 **Roaster** | ₱999 | 3,000/month | None | + Loyalty Program, Priority Support |
| 👑 **Tycoon** | ₱2000 | Unlimited | None | + Multi-Location, Custom Branding |

### Unit Economics

| Tier | Infrastructure Cost | Gross Margin |
| :--- | :--- | :--- |
| **Barista** | ~₱12.50/month | **97.5%** |
| **Roaster** | ~₱30.00/month | **97.0%** |
| **Tycoon** | ~₱100.00/month | **95.0%** |

*Infrastructure costs include Firestore reads/writes, Cloud Functions invocations, and hosting.*

### Revenue Projections (at Scale)

| Scale | Paying Restaurants | MRR | Annual Run Rate | Net Margin |
| :--- | :--- | :--- | :--- | :--- |
| **Seed** | 100 | ₱75,000 | ₱900K | 94% |
| **Growth** | 1,000 | ₱800,000 | ₱9.6M | 94% |
| **Scale** | 5,000 | ₱4,250,000 | ₱51M | 92% |
| **Unicorn** | 10,000 | ₱9,000,000 (~$161k USD) | ₱108M (~$1.9M USD) | 91% |

---

## 🤝 Distribution Partner Program

A comprehensive affiliate/reseller system enabling third parties to sell CoffeeOS subscriptions and earn recurring commissions.

### Multi-Dashboard Architecture

| Dashboard | User | Purpose |
| :--- | :--- | :--- |
| **Customer App** | End Customers | QR ordering, order status, feedback |
| **KDS** | Kitchen Staff | Real-time order management |
| **Admin Dashboard** | Restaurant Owners | Menu, analytics, configuration |
| **Partner Portal** | Distribution Partners | Commission tracking, payouts, referral management |
| **Super Admin** | Platform Owner | All restaurants, subscriptions, partner management |

### Partner Portal Features

Distribution Partners get their own dedicated dashboard with:

- **Referral Tracking**: Unique referral codes/links for each partner
- **Restaurant Directory**: List of all restaurants they've onboarded
- **Commission Dashboard**: Real-time earnings from active subscriptions
- **Payout Requests**: Request withdrawal when balance reaches minimum (₱500)
- **Performance Analytics**: Conversion rates, churn tracking, growth trends

### Commission Structure

| Event | Commission | Duration |
| :--- | :--- | :--- |
| **New Subscription** | 20% of first month | One-time |
| **Recurring Revenue** | 10% of monthly subscription | Lifetime (while restaurant active) |

*Example: Partner refers a Roaster tier restaurant (₱999/month)*
- Month 1: ₱200 (20%)
- Months 2+: ₱100/month (10%) recurring

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

- **Firestore Rules**: 400+ lines of production-hardened security rules
- **Rate Limiting**: Order spam prevention (10-second cooldown per user)
- **Price Validation**: Server-side price verification prevents manipulation
- **Status Transition Guards**: Only valid order status changes allowed
- **IP-based Throttling**: 30 orders/hour per IP address

---

## 📁 Code Samples

This repository contains **sanitized excerpts** demonstrating my coding patterns:

### `/patterns`

| File | What It Demonstrates |
|------|---------------------|
| `service-layer-pattern.ts` | Abstraction layer between UI and infrastructure |
| `real-time-subscription.ts` | Firestore real-time listeners with cleanup |
| `cloud-function-security.ts` | Server-side validation and rate limiting |
| `multi-tenant-context.tsx` | React Context for tenant-scoped state |
| `firestore-rules-example.rules` | RBAC security rules |

### `/components`

| File | What It Demonstrates |
|------|---------------------|
| `StatusScreen.tsx` | Real-time order status with sound/vibration |
| `useAuth.ts` | Custom hook for authentication flow |

---

## 📚 Architecture Documentation

| Document | What It Shows |
|----------|--------------|
| **[Architecture Blueprint](./docs/ARCHITECTURE_BLUEPRINT.md)** | Complete SaaS architecture patterns — reusable template for any project |
| **[Table Occupancy Pattern](./docs/ARCHITECTURE_TABLE_OCCUPANCY.md)** | "Public Status Broadcaster" — how I reduced costs by 99% |
| **[3-Layer Architecture](./docs/ARCHITECTURE.md)** | Service layer pattern, testing strategy, security features |

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

## 🔧 Technical Skills

```
Languages:        TypeScript, JavaScript, Python, C/C++
Frontend:         React, Next.js, TailwindCSS
Backend:          Node.js, Firebase Cloud Functions, REST APIs
Database:         Firestore (NoSQL), Real-time subscriptions
Cloud:            Firebase, Vercel, Git, CI/CD
Architecture:     Multi-tenant SaaS, Service Layer, RBAC
```

---

## 📫 Contact

- **Email:** [anascojas@gmail.com](mailto:anascojas@gmail.com)
- **LinkedIn:** [Jasiel Emro Anasco](https://www.linkedin.com/in/jasiel-emro-anasco-047a31357/)
- **GitHub:** [@jasanasc0](https://github.com/jasanasc0)

---

## 📄 License

These code samples are provided for educational and portfolio purposes. The full CoffeeOS application is proprietary.
