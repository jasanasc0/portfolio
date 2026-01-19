# CoffeeOS Architecture Guide

## Overview

CoffeeOS follows a **3-Layer Architecture** that separates concerns between UI, state management, and infrastructure operations.

---

## The 3-Layer Pattern

```
┌─────────────────────────────────────────────────────────────┐
│  REACT COMPONENTS (UI Layer)                                │
│  src/components/                                            │
│  Purpose: Render UI, handle user interactions               │
└─────────────────────────────────────────────────────────────┘
                          ▼ uses
┌─────────────────────────────────────────────────────────────┐
│  HOOKS (React Integration Layer)                            │
│  src/hooks/                                                 │
│  Purpose: Connect Services to React state (useState/Effect) │
└─────────────────────────────────────────────────────────────┘
                          ▼ calls
┌─────────────────────────────────────────────────────────────┐
│  SERVICES (Infrastructure Layer)                            │
│  src/services/                                              │
│  Purpose: All Firebase/external API operations              │
└─────────────────────────────────────────────────────────────┘
                          ▼ talks to
┌─────────────────────────────────────────────────────────────┐
│  FIREBASE (External Infrastructure)                         │
│  Firestore, Auth, Storage, Cloud Functions                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### 1. Services (`src/services/`) - Infrastructure Layer

Services are **plain TypeScript objects** that wrap all Firebase SDK operations. They don't know anything about React.

| Service                  | Purpose                                                                     |
| ------------------------ | --------------------------------------------------------------------------- |
| `AuthService.ts`         | User authentication, sign-in/out, admin verification, kitchen access claims |
| `RestaurantService.ts`   | Restaurant config CRUD, logo/background uploads, slug availability checks   |
| `MenuService.ts`         | Menu items, categories, reviews, item photo uploads                         |
| `OrderService.ts`        | Create/update/cancel orders, real-time subscriptions, KDS history           |
| `SubscriptionService.ts` | Usage tracking, tier management                                             |
| `LoyaltyService.ts`      | Points balance, earning/redemption operations                               |
| `SuperAdminService.ts`   | Platform-level admin operations (tenant management)                         |

**Example Service Method:**

```typescript
// OrderService.ts
export const OrderService = {
  async createOrder(restaurantId, orderData) {
    const orderRef = doc(collection(db, "restaurants", restaurantId, "orders"));
    await setDoc(orderRef, { ...orderData, createdAt: serverTimestamp() });
    return orderRef.id;
  },
};
```

---

### 2. Hooks (`src/hooks/`) - React Integration Layer

Hooks **bridge Services to React components**. They use `useState` and `useEffect` to make Service data reactive.

| Hook                     | Service Used        | Purpose                                     |
| ------------------------ | ------------------- | ------------------------------------------- |
| `useRestaurantConfig.ts` | RestaurantService   | Subscribes to restaurant config changes     |
| `useOrders.ts`           | OrderService        | Subscribes to orders, handles create/update |
| `useMenu.ts`             | MenuService         | Subscribes to menu items                    |
| `useLoyalty.ts`          | LoyaltyService      | Subscribes to customer points balance       |
| `useAuth.ts`             | AuthService         | Manages authentication state                |
| `useSubscription.ts`     | SubscriptionService | Subscribes to usage metrics                 |
| `useCart.ts`             | (none)              | Local cart state - client-only              |
| `useConnectionStatus.ts` | (none)              | Network status detection                    |

**Example Hook:**

```typescript
// useRestaurantConfig.ts
export const useRestaurantConfig = () => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const unsubscribe = RestaurantService.subscribeToConfig(
      restaurantId,
      (data) => setConfig(data) // Service → React state
    );
    return unsubscribe;
  }, [restaurantId]);

  return { config };
};
```

---

### 3. Components (`src/components/`) - UI Layer

Components render the UI and handle user interactions. They:

- ✅ Use Hooks to get data
- ✅ Call Service methods for one-off operations
- ❌ Never import `firebase-config` directly

**Example Component:**

```tsx
// SaaSAuth.tsx
import { AuthService } from "../services/AuthService";

function SaaSAuth() {
  const handleLogin = async () => {
    const result = await AuthService.signInWithEmail(email, password);
    if (result.success) navigate("/dashboard");
  };
}
```

---

## Why This Architecture?

### Before (Direct Firebase Calls):

```
Component → Firebase SDK
```

- 🔴 Firebase logic scattered across 18+ components
- 🔴 Hard to test (need Firebase mocks everywhere)
- 🔴 Changing Firebase = touching every component

### After (Service Layer):

```
Component → Hook → Service → Firebase SDK
```

- ✅ Firebase logic centralized in 7 service files
- ✅ Easy to test (mock Services, not Firebase)
- ✅ Changing Firebase = only change Services

---

## Quick Reference: Layer Awareness

| Layer      | Knows React? | Knows Firebase? | Can Be Tested Without... |
| ---------- | ------------ | --------------- | ------------------------ |
| Services   | ❌ No        | ✅ Yes          | React                    |
| Hooks      | ✅ Yes       | ❌ No           | Firebase (mock Services) |
| Components | ✅ Yes       | ❌ No           | Firebase (mock Services) |

---

## Testing

CoffeeOS uses **Vitest + React Testing Library** for automated testing.

### Test Structure

```
src/test/
├── setup.ts              # Global test setup (mocks)
├── hooks/
│   └── useCart.test.ts   # Cart hook tests
├── services/
│   └── SubscriptionService.test.ts  # Tier guard tests
└── lib/
    └── slugValidation.test.ts       # URL safety tests
```

### Running Tests

```bash
npm run test           # Single run
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
```

### Test Philosophy

- **Services**: Test pure logic (no React, mock Firebase)
- **Hooks**: Test with `renderHook()` from RTL
- **Components**: Use `render()` + `userEvent` (future)

---

## Security Features

### Password Security

Kitchen passwords are hashed server-side using bcrypt via Cloud Functions:

```
Admin sets password → setkitchenpassword() → bcrypt.hash() → Firestore
Kitchen login → verifykitchenpassword() → bcrypt.compare() → ✓/✗
```

User account passwords follow industry-standard requirements:

- Minimum 8 characters
- Must contain uppercase, lowercase, number, and special character
- Validated at AuthService level

### Subscription Guards

Tier limits are enforced at the Service layer (not just UI):

```typescript
// SubscriptionService guards
SubscriptionService.checkFeatureAccess(tier, "customTheme"); // Returns boolean
SubscriptionService.assertFeatureAllowed(tier, "loyalty"); // Throws if denied
SubscriptionService.checkOrderLimit(restaurantId, tier); // Async check
```

### Slug Validation

Restaurant slugs are validated for security and URL safety:

```typescript
import { validateSlug, sanitizeSlug } from "../lib/slugValidation";

validateSlug("admin"); // { valid: false, error: 'reserved word' }
sanitizeSlug("Joe's Café"); // 'joe-s-caf'
```

**Protected from:**

- Reserved routes (admin, api, dashboard, login, etc.)
- Invalid characters and formats
- URL injection attacks

### SaaS Route Protection

SaaS pages (`/dashboard`, `/super-admin`, etc.) are protected by `ProtectedSaaSRoute`. This wrapper:

1.  **Strictly enforces authentication**: Redirects to `/login` if no user is found.
2.  **Blocks anonymous users**: Prevents "Guest" accounts (used for ordering) from accessing the dashboard.
3.  **Handles loading states**: Shows a loading spinner while Firebase verifies the session.

This prevents the "empty dashboard" state where an unauthenticated user could previously see the dashboard shell without data.

---

## SaaS Components (`src/components/saas/`)

The SaaS layer handles the multi-tenant subscription platform.

| Component                 | Route               | Purpose                                                      |
| ------------------------- | ------------------- | ------------------------------------------------------------ |
| `SaaSAuth.tsx`            | `/login`, `/signup` | Authentication flows (email + Google)                        |
| `ProtectedSaaSRoute.tsx`  | (Wrapper)           | **Security Gate** - Redirects unauthenticated users to login |
| `SaaSOnboarding.tsx`      | `/onboarding`       | Restaurant setup wizard                                      |
| `SaaSDashboard.tsx`       | `/dashboard/:tab`   | Owner portal with shops & settings (clean URL routing)       |
| `GuideTab.tsx`            | (View)              | Onboarding guide & ecosystem map                             |
| `SuperAdminDashboard.tsx` | `/super-admin`      | Platform admin panel                                         |
| `ROICalculator.tsx`       | `/roi-calculator`   | **Lead gen tool** - Calculate savings, capture leads, PDF    |
| `SubscriptionReceipt.tsx` | `/receipt/:id`      | Payment receipt viewer (clean URL routing)                   |
| `PartnerApply.tsx`        | `/partner/apply`    | Partner program application form                             |

## Landing Page (`src/components/landing/`)

The public-facing landing page uses a modular slide-based architecture.

| Component             | Purpose                                          |
| --------------------- | ------------------------------------------------ |
| `LandingPage.tsx`     | Main container with ThemeProvider                |
| `SlideContainer.tsx`  | Full-screen snap scroll context                  |
| `SlideNavigation.tsx` | Navbar, dot navigation, theme toggle, scroll CTA |
| `slides/HeroSlide`    | Hero section with dashboard mockup               |
| `slides/HowItWorks`   | 3-step process visualization                     |
| `slides/Features`     | Feature grid (desktop) / carousel (mobile)       |
| `slides/Pricing`      | 3-tier pricing cards                             |
| `slides/Value`        | ROI Calculator + Partner Program CTAs            |
| `slides/Footer`       | FAQ accordion + Newsletter + Footer links        |


### Pricing Model

Per-shop billing with three tiers:

| Tier        | Price             | Orders/Month | Key Features                          |
| ----------- | ----------------- | ------------ | ------------------------------------- |
| **Barista** | ₱999/shop/month   | 500          | QR ordering, KDS, basic analytics     |
| **Roaster** | ₱1,499/shop/month | 3,000        | + Audio alerts, themes, CSV export    |
| **Tycoon**  | ₱3,499/shop/month | Unlimited    | + Loyalty program, advanced analytics |

**Key Points:**

- No restaurant limits - owners can have unlimited shops
- Each shop billed independently at its tier
- Only Barista tier has 14-day free trial

### Owner Dashboard Features

- **Overview Tab**: Shop cards with live stats (orders/month, tier badge, table count)
- **User Guide Tab**: Interactive ecosystem map and setup instructions
- **Settings Tab**: Profile management, password change (2 methods), help & support
- **Secure Deletion**: "Type name to confirm" modal for deleting restaurants
- **Time-based greetings**: "Good morning, [Name]!"
- **Responsive design**: Mobile hamburger menu

---

## UX Patterns

### Toast Notifications

All user feedback uses styled toast notifications (no `alert()` calls):

```tsx
// Success: Green background
showToast("Settings saved!", "success");

// Error: Red background
showToast("Failed to save settings", "error");
```

Components with local toast state:

- `KitchenDisplay.tsx`
- `Analytics.tsx`
- `SuperAdminDashboard.tsx`
- `SaaSAuth.tsx`
- `SaaSOnboarding.tsx`

---

## Utilities (`src/lib/`)

| File                   | Purpose                        |
| ---------------------- | ------------------------------ |
| `themes.ts`            | Restaurant color theme presets |
| `subscriptionUtils.ts` | Tier feature matrix            |
| `slugValidation.ts`    | URL/slug validation functions  |
| `analytics.ts`         | Google Analytics wrapper       |

---

## Payment Integration (⏸️ BLOCKED)

**Status:** Awaiting business registration (DTI + TIN for PayMongo)

### Planned Architecture:

```
Frontend → Cloud Function → PayMongo API → Webhook → Firestore
```

### Temporary Workaround:

1. Accept payment manually (GCash/bank transfer)
2. Use SuperAdmin Dashboard → "Change Tier"
3. Manually set subscription tier

**See:** `docs/PAYMENT_IMPLEMENTATION_PLAN.md` for full details.

---

## One-Liner Summary

- **Services** = "How we talk to Firebase"
- **Hooks** = "How React subscribes to data"
- **Components** = "What users see and click"
- **Tests** = "How we verify it works"
- **Guards** = "How we enforce security"
- **SaaS** = "How owners manage their shops"
- **Payments** = "How we get paid" (⏸️ blocked)
