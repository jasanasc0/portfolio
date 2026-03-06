<p align="center">
  <img src="public/COFFEE_OS.png" alt="CoffeeOS Logo" width="160" />
</p>

<h1 align="center">CoffeeOS</h1>

<p align="center">
  <strong>Ordering Infrastructure for Restaurants, Coffee Shops, and Food Stalls.</strong><br/>
  CoffeeOS is the customer-to-kitchen layer for QR ordering, real-time kitchen displays, and live operational visibility. Not a POS replacement. It works alongside existing POS systems by handling the ordering flow they usually do not cover well.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Firebase-DD2C00?style=for-the-badge&logo=firebase&logoColor=white" alt="Firebase"/>
  <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS"/>
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Architecture-Serverless_Event_Driven-8B5CF6?style=flat-square" alt="Architecture"/>
  <img src="https://img.shields.io/badge/Codebase-33,000+_Lines-22C55E?style=flat-square" alt="Codebase Size"/>
  <img src="https://img.shields.io/badge/Cloud_Functions-3,500+_Lines-F59E0B?style=flat-square" alt="Cloud Functions"/>
  <img src="https://img.shields.io/badge/Security_Rules-470+_Lines-EF4444?style=flat-square" alt="Security Rules"/>
  <img src="https://img.shields.io/badge/Status-Production_Ready-22C55E?style=flat-square" alt="Status"/>
</p>

---

## The Vision

> "Walk into a restaurant, coffee shop, or food stall. Scan a code. Order with less friction. The kitchen receives it instantly. The venue runs faster, the customer waits less, and the owner sees everything in real time."

CoffeeOS is not a POS. It is not just a QR menu. It is customer-facing ordering infrastructure: the operational layer between the customer's phone and the kitchen's screen.

Existing POS systems handle receipts, taxes, compliance, cash drawers, and back-office reporting. CoffeeOS handles the front-of-house ordering flow:

- scan
- browse
- order
- pay or confirm payment
- route demand to kitchen
- track fulfillment in real time

Built for the Philippine F&B market first, across restaurants, coffee shops, and food stalls, with a strong wedge in queue-heavy environments such as food courts, food parks, and fast-casual venues.

---

## What It Is

CoffeeOS is a multi-tenant ordering infrastructure platform that works alongside existing POS systems.

| For the Customer | For the Kitchen | For the Owner | For the Platform |
|:---|:---|:---|:---|
| Zero-download QR ordering | Real-time Kitchen Display System | Menu management and analytics | Multi-tenant oversight |
| Session persistence | Audio alerts for new orders | White-label branding | Subscription and billing engine |
| Split bill support | Smart order queuing | Revenue dashboards | Partner and reseller program |
| Table-aware ordering | Thermal ticket printing | Staff access control | Commission tracking |

CoffeeOS is useful across restaurants, coffee shops, and food stalls, and especially strong where:

- customers are physically lining up to order
- venues use shared seating or pickup-heavy service
- operators want throughput gains without replacing their existing POS
- owners want a direct customer-to-kitchen ordering flow
- malls, food parks, or venue operators can drive multi-tenant adoption at scale

---

## Core Pillars

### 1. Serverless First
Zero servers to manage. Firebase Cloud Functions scale to zero when idle and scale up under load.

### 2. Real-Time Native
Firestore listeners push order updates to the kitchen without polling or custom WebSocket infrastructure.

### 3. Beautifully Boring
React, TypeScript, Firebase, Tailwind. Stability over novelty.

### 4. Zero Trust Security
Client checks are for UX. Server checks are for security. Prices are validated server-side. Rules, auth claims, and rate limits enforce tenant boundaries.

### 5. Operationally Lean
The architecture is optimized for low idle cost and efficient high-volume reads, including the public status broadcaster pattern.

---

## Key Features

### Pay-to-Release Workflow
Customers order, staff verifies payment, then the kitchen starts cooking. This is especially useful in pickup-heavy workflows where walkouts, payment ambiguity, or queue congestion are real operational problems.

### Smart Split Bills
Multiple people at the same table can order independently without forcing one shared cart or one payer.

### Session Persistence
Customers can leave and return to the ordering flow without losing their in-progress order context.

### White-Label Storefront
Each restaurant or stall can expose its own brand, theme, and public-facing experience.

### Loyalty and Rewards
Built-in rewards and redemption flows for repeat customers.

### Concierge Onboarding
A guided setup path for venue owners who want menu digitization, QR generation, and launch support handled for them.

### Real-Time Analytics
Revenue, volume, peak-hour patterns, and top-selling items from live operational data.

### Distribution Partner Program
Partner and reseller support for multi-tenant rollout, attribution, commissions, and payout workflows.

### Multi-Tenant Security
Four-tier access control across customer, kitchen, admin, and super admin roles.

### ROI Calculator
A built-in sales tool for showing labor and throughput impact to prospective customers.

---

## Architecture

```
Client apps
  - Customer ordering
  - Kitchen display
  - Admin dashboard
  - Partner portal

Frontend service layer
  - OrderService
  - MenuService
  - AuthService
  - RestaurantService
  - SubscriptionService
  - PartnerService
  - LoyaltyService
  - PaymentService
  - SuperAdminService

Backend
  - Firestore
  - Cloud Functions
  - Security rules
  - Storage rules
```

Key backend domains:

- Orders: `functions/src/orders`
- Payments: `functions/src/payments`
- Restaurants and occupancy: `functions/src/restaurants`
- Auth and claims: `functions/src/auth`
- Shared security and operational utilities: `functions/src/shared`

Core data collections include:

- `restaurants`
- `coffee_orders`
- `menu_items`
- `admin_users`
- `partners`
- `partner_commissions`
- `partner_payouts`
- `subscriptions`
- `audit_logs`
- `payment_idempotency`

---

## Tech Stack

| Domain | Technologies |
|:---|:---|
| Frontend Core | React 19, TypeScript, Vite |
| Routing | React Router DOM v7 |
| State Management | React Context plus custom hooks |
| Styling | TailwindCSS, CVA, clsx, tailwind-merge |
| Animation | Framer Motion |
| UI Primitives | Radix UI |
| Charts | Recharts |
| Database | Cloud Firestore |
| Authentication | Firebase Auth |
| Backend | Firebase Cloud Functions v2 |
| Payments | PayMongo |
| Validation | Zod |
| Testing | Vitest, Testing Library, jsdom |
| Hosting | Vercel plus Firebase |

---

## Business Model

### Subscription Tiers

| Tier | Monthly | Order Limit | Highlights |
|:---|:---|:---|:---|
| Barista | PHP 499 | 500 per month | QR ordering, KDS, basic analytics |
| Roaster | PHP 999 | 3,000 per month | Automated payments, priority support |
| Tycoon | PHP 2,000 | Unlimited | White-label branding, multi-location |

### Unit Economics

| Tier | Estimated Infrastructure Cost per Month | Gross Margin |
|:---|:---|:---|
| Barista | ~PHP 12.50 | 97.5% |
| Roaster | ~PHP 30.00 | 97.0% |
| Tycoon | ~PHP 100.00 | 95.0% |

---

## What CoffeeOS Is Not

CoffeeOS is not a Point of Sale system.

It does not aim to be the primary system for:

- BIR-accredited receipts
- tax computation
- cash drawer workflows
- raw inventory tracking
- shift-end readings
- broad back-office accounting

Those are already handled by established POS vendors.

CoffeeOS handles the ordering layer those systems usually do not own well:

- QR ordering from the customer's phone
- real-time kitchen routing
- customer order tracking
- pay-to-release workflows
- customer-initiated split bills
- white-label storefronts
- queue-aware ordering flows

A venue running CoffeeOS alongside its existing POS gets both compliance and customer experience. CoffeeOS handles how customers order. The POS handles the transaction record.

---

## Strategic Vision

CoffeeOS is designed to scale through distribution, not only one restaurant at a time.

At the product level, CoffeeOS starts with restaurants, coffee shops, and food stalls that want a better front-of-house ordering flow without replacing their existing POS.

At the distribution level, its white-label architecture, multi-tenant isolation, and partner commission system support venue-level rollout where mall operators, food park operators, or other venue managers can deploy CoffeeOS across multiple tenants under a unified brand.

The thesis is simple:

- existing POS systems remain the back-office system of record
- CoffeeOS becomes the front-of-house ordering layer
- individual merchants use CoffeeOS to modernize ordering without changing their system of record
- venue operators use CoffeeOS to reduce queues, modernize ordering, and improve throughput across multiple stalls or branches

The initial expansion wedge is the Philippine food court and food park environment, where shared seating, visible queues, and pickup-heavy workflows make digital ordering infrastructure especially valuable.

---

## Project Structure

```text
CoffeeOS/
|-- src/            Frontend application
|-- functions/      Firebase Cloud Functions
|-- docs/           Architecture, strategy, and operational documents
|-- Opus/           Semantic code graph tooling
|-- public/         Static assets
|-- firestore.rules Firestore security rules
|-- storage.rules   Cloud Storage security rules
```

---

## Security Implementation

| Protection | Implementation |
|:---|:---|
| Firestore Rules | Deny-by-default, multi-tenant policy enforcement |
| Custom Claims | Role-aware access control |
| Rate Limiting | Per-user and per-IP controls |
| Price Validation | Server-side price recalculation |
| Status Guards | Order state transition validation |
| Payload Validation | Request size and schema enforcement |
| Payment Security | Webhook verification and idempotency controls |
| Audit Logging | Critical action tracking |

---

## Performance and Capacity

| Metric | Specification |
|:---|:---|
| Real-time Latency | Sub-second Firestore listener updates |
| Orders per Second | Designed for high-throughput serverless writes |
| Cost Profile | Low idle cost, pay-per-use backend |
| Frontend Build | Vite-based local development and optimized production build |

---

## Documentation

This project includes extensive technical and strategic documentation, including:

- [docs/ARCHITECTURE_BLUEPRINT.md](./docs/ARCHITECTURE_BLUEPRINT.md)
- [docs/CODEBASE_MANIFESTO.md](./docs/CODEBASE_MANIFESTO.md)
- [docs/SECURITY_ARCHITECTURE.md](./docs/SECURITY_ARCHITECTURE.md)
- [docs/TECH_STACK_DEEP_DIVE.md](./docs/TECH_STACK_DEEP_DIVE.md)
- [docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md)
- [docs/MALL_FOODCOURT_STRATEGY.md](./docs/MALL_FOODCOURT_STRATEGY.md)
- [docs/PAYMENT_CUSTOMER_AUTOMATED.md](./docs/PAYMENT_CUSTOMER_AUTOMATED.md)
- [docs/CONCIERGE_ARCHITECTURE.md](./docs/CONCIERGE_ARCHITECTURE.md)
- [docs/CODE_GRAPH_ARCHITECTURE.md](./docs/CODE_GRAPH_ARCHITECTURE.md)
- [docs/GROWTH_PLAYBOOK.md](./docs/GROWTH_PLAYBOOK.md)

---

## Custom Tooling: Code Graph

CoffeeOS includes Opus, a semantic code graph for mapping relationships across components, services, Cloud Functions, and Firestore collection usage.

---

## Author

**Jasiel S. Anasco** - Full Stack Product Engineer

CoffeeOS represents a solo-built codebase spanning frontend, backend, security, payments, and business tooling.

---

## License

Proprietary - All rights reserved.
