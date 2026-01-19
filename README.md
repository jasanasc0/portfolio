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

A **multi-tenant SaaS Point-of-Sale platform** for restaurants with QR-based ordering and real-time kitchen display.

🔗 **Live Demo:** [ares-pos.vercel.app/fireside-cafe](https://ares-pos.vercel.app/fireside-cafe)

### Technical Highlights

| Feature | Implementation |
|---------|---------------|
| **Multi-tenancy** | Single codebase, isolated data per restaurant via `restaurantId` |
| **Real-time sync** | Firestore `onSnapshot` for instant order updates |
| **Security** | Cloud Functions for price validation, Firestore rules for RBAC |
| **Cost optimization** | 99% reduction in read costs via Status Broadcaster pattern |
| **Payment flow** | Pay-to-Release workflow preventing revenue leakage |

### Architecture

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

📖 **[View Full CoffeeOS Documentation →](./COFFEEOS_README.md)** — Complete technical deep-dive with business model, security implementation, and architecture details.

### 📚 Architecture Documentation

| Document | What It Shows |
|----------|--------------|
| **[Architecture Blueprint](./docs/ARCHITECTURE_BLUEPRINT.md)** | Complete SaaS architecture patterns — reusable template for any project |
| **[Table Occupancy Pattern](./docs/ARCHITECTURE_TABLE_OCCUPANCY.md)** | "Public Status Broadcaster" — how I reduced costs by 99% |
| **[3-Layer Architecture](./docs/ARCHITECTURE.md)** | Service layer pattern, testing strategy, security features |

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
