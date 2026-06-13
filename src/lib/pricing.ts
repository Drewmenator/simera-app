// Single source of truth for Simera pricing.
// Unified per-provider model: $149 starter, $129/provider growth, custom enterprise.
// Also includes optional percentage-of-recovery model for future activation.

export const PRICING_TIERS = [
  {
    id: "starter" as const,
    name: "Starter",
    desc: "Perfect for solo practices",
    providers: 1,
    price: 149, // Per month, flat for 1 provider
    pricePerProvider: undefined,
    features: [
      "1 provider",
      "Up to 3 835 uploads/month",
      "All analysis features",
      "Email support",
    ],
    badge: null,
    highlighted: false,
  },
  {
    id: "growth" as const,
    name: "Growth",
    desc: "For small practices scaling up",
    providersMin: 2,
    providersMax: 10,
    price: undefined,
    pricePerProvider: 129, // Per month per provider
    features: [
      "Up to 10 providers",
      "Unlimited 835 uploads",
      "Priority support",
      "Team members & roles",
      "Advanced analytics",
    ],
    badge: "Most Popular",
    highlighted: true,
  },
  {
    id: "enterprise" as const,
    name: "Enterprise",
    desc: "For large networks",
    providersMin: 11,
    price: undefined,
    pricePerProvider: 100, // Discounted for scale
    features: [
      "Unlimited providers",
      "Unlimited uploads",
      "Dedicated support",
      "Custom integrations",
      "SSO & advanced security",
      "SLA guarantee",
    ],
    badge: null,
    highlighted: false,
  },
] as const;

// Percentage-of-recovery pricing (secondary, future activation).
// For practices that want to align Simera's incentives with their recovery outcomes.
export const RECOVERY_PRICING = {
  enabled: false, // Toggle this to activate; initially subscription-only
  recoveryPercentage: 0.15, // 15% of recovered revenue
  minimumMonthly: 149, // Floor so small practices aren't penalized
  recoveryTypes: [
    "denied_appeals_recovered",
    "undercoding_uplift", // Found but not claimed = revenue Simera helped identify
    "bundling_errors_corrected",
  ] as const,
};

// Helper: calculate monthly cost for a practice
export function calculateMonthlyPrice(providerCount: number): number {
  if (providerCount === 1) {
    const price = PRICING_TIERS[0].price;
    return price ?? 0;
  }
  if (providerCount >= 2 && providerCount <= 10) {
    const pricePerProvider = PRICING_TIERS[1].pricePerProvider;
    return (pricePerProvider ?? 0) * providerCount;
  }
  // Enterprise: 11+
  const pricePerProvider = PRICING_TIERS[2].pricePerProvider;
  return (pricePerProvider ?? 0) * providerCount;
}

// Helper: estimate gross margin given variable cost per provider
export function estimateGrossMargin(
  providerCount: number,
  variableCostPerProvider: number // e.g., 30 for $30/provider/month
): { monthlyRevenue: number; monthlyCost: number; grossMarginPct: number } {
  const monthlyRevenue = calculateMonthlyPrice(providerCount);
  const monthlyCost = variableCostPerProvider * providerCount;
  const grossMarginPct = monthlyRevenue > 0 ? ((monthlyRevenue - monthlyCost) / monthlyRevenue) * 100 : 0;
  return { monthlyRevenue, monthlyCost, grossMarginPct };
}

// Helper: calculate percentage-of-recovery fee
export function calculateRecoveryFee(recoveredAmount: number): number {
  if (!RECOVERY_PRICING.enabled) return 0;
  const fee = recoveredAmount * RECOVERY_PRICING.recoveryPercentage;
  return Math.max(fee, RECOVERY_PRICING.minimumMonthly); // Floor
}

// Stripe plan IDs — live production prices
export const STRIPE_PLANS = {
  starter: "price_1TdaFr9P24voFtaQ1LpaSm0s",
  growth: "price_1TdaIA9P24voFtaQU5ZXkBWQ",
  enterprise: "custom", // Enterprise is manual (contact sales)
} as const;
