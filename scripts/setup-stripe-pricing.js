#!/usr/bin/env node

/**
 * Stripe pricing setup for Simera
 * Run: node scripts/setup-stripe-pricing.js
 *
 * Creates products and prices for:
 * - Starter: $149/month (1 provider)
 * - Growth: $129/month per provider
 * - Enterprise: Custom (no product, handled manually)
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRODUCTS = [
  {
    id: 'starter',
    name: 'Starter',
    description: '1 provider, up to 3 uploads/month',
    amount: 14900, // $149.00
    interval: 'month',
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'Up to 10 providers, unlimited uploads',
    amount: 12900, // $129/provider/month — practices pay per provider
    interval: 'month',
  },
];

async function setupPricing() {
  console.log('Setting up Stripe products and prices...\n');

  try {
    for (const prod of PRODUCTS) {
      console.log(`Creating product: ${prod.name}`);

      // Create product
      const product = await stripe.products.create({
        id: `prod_simera_${prod.id}`,
        name: prod.name,
        description: prod.description,
        type: 'service',
        metadata: {
          simera_tier: prod.id,
          simera_pricing_model: prod.id === 'growth' ? 'per_provider' : 'flat',
        },
      });

      console.log(`  ✓ Product created: ${product.id}`);

      // Create price (recurring monthly)
      const price = await stripe.prices.create({
        product: product.id,
        type: 'recurring',
        currency: 'usd',
        unit_amount: prod.amount,
        recurring: {
          interval: prod.interval,
          interval_count: 1,
          usage_type: 'licensed',
          aggregate_usage: prod.id === 'growth' ? 'sum' : undefined,
        },
        metadata: {
          simera_tier: prod.id,
        },
      });

      console.log(`  ✓ Price created: ${price.id}`);
      console.log(`    → $${(prod.amount / 100).toFixed(2)}/${prod.interval}`);
      console.log(`\n  Add to src/lib/pricing.ts:\n`);
      console.log(`  ${prod.id}: "${price.id}",\n`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Stripe setup complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Next steps:');
    console.log('1. Copy the price IDs above into src/lib/pricing.ts (STRIPE_PLANS)');
    console.log('2. For Enterprise: manually create a product in Stripe dashboard,');
    console.log('   or handle it in code as "custom" (contact sales)');
    console.log('3. Deploy with `vercel deploy --prod`\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

// Check for API key
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable not set');
  console.error('   Run: export STRIPE_SECRET_KEY=sk_live_... && node scripts/setup-stripe-pricing.js');
  process.exit(1);
}

setupPricing();
