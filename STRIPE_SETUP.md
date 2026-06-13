# Stripe Pricing Setup for Simera

This guide walks you through creating Stripe products and prices for the new unified pricing model.

## Quick Start

### 1. Get your Stripe Secret Key

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers → API Keys**
3. Copy your **Secret Key** (starts with `sk_live_` for production or `sk_test_` for testing)

### 2. Run the setup script

In your terminal, from the simera-app directory:

```bash
export STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE
node scripts/setup-stripe-pricing.js
```

The script will:
- Create a **Starter** product ($149/month, 1 provider)
- Create a **Growth** product ($129/month per provider, scales with provider count)
- Print out the price IDs you need to add to the code

### 3. Update `src/lib/pricing.ts`

The script outputs price IDs. Copy them into the `STRIPE_PLANS` constant:

```typescript
export const STRIPE_PLANS = {
  starter: "price_1A2B3C4D5E6F7G8H",  // ← from script output
  growth: "price_2B3C4D5E6F7G8H9I",   // ← from script output
  enterprise: "custom",                 // Manual/contact sales
} as const;
```

### 4. For Enterprise

Enterprise is handled manually (not automated):
- No product needed yet (it's "contact sales")
- When a customer upgrades, create a custom price in Stripe dashboard or invoice manually
- Or create a product once you have a few enterprise customers

### 5. Deploy

```bash
vercel deploy --prod
```

---

## What Each Pricing Tier Does

| Tier | Amount | Billing | Use Case |
|---|---|---|---|
| **Starter** | $149/month | Monthly | Solo practices (1 provider) |
| **Growth** | $129/provider/month | Monthly | Small practices (2–10 providers) — Stripe bills per provider count |
| **Enterprise** | Custom | Custom | Large networks (11+), negotiated annually |

### Growth Tier Notes

The Growth tier is set up with Stripe's `aggregate_usage: sum` for per-provider billing. This means:
- You set the price to $129 per unit (provider)
- Stripe multiplies it by the number of providers (metered usage)
- Practice pays only for providers they actually have

Example: A 5-provider practice on Growth tier pays `$129 × 5 = $645/month`.

---

## Troubleshooting

**Error: "No such product"**
- The product IDs might already exist. Check the Stripe dashboard and use those IDs instead.

**Error: "STRIPE_SECRET_KEY not found"**
- Make sure you exported the key: `export STRIPE_SECRET_KEY=sk_live_...`

**Want to test first?**
- Use a Stripe test key (`sk_test_...`) to create test products, then run again with live keys.

---

## Manual Alternative (Stripe Dashboard)

If you prefer to create products manually:

1. **Starter:**
   - Name: "Starter"
   - Amount: $149
   - Interval: Monthly
   - Metadata: `simera_tier: starter`

2. **Growth:**
   - Name: "Growth"
   - Amount: $129
   - Interval: Monthly
   - Recurring: **Per-unit pricing** (check "Use per-unit pricing")
   - Metadata: `simera_tier: growth`

Then copy the price IDs from the dashboard into `src/lib/pricing.ts`.

---

## Questions?

- Stripe docs: https://stripe.com/docs/products-prices/pricing-models
- Questions about the script: Check `scripts/setup-stripe-pricing.js`
