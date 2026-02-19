import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    })
  : null as unknown as Stripe;

export const STRIPE_PRICE_IDS = {
  STARTER: process.env.STRIPE_STARTER_PRICE_ID || '',
  PRO: process.env.STRIPE_PRO_PRICE_ID || '',
  ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
};

export const STRIPE_PRODUCT_IDS = {
  STARTER: process.env.STRIPE_STARTER_PRODUCT_ID || '',
  PRO: process.env.STRIPE_PRO_PRODUCT_ID || '',
  ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRODUCT_ID || '',
};

export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    price: 0,
    maxAgents: 1,
    maxTools: 2,
    monthlyTokenQuota: 100000,
    features: [
      '1 AI Agent',
      '2 Tools per agent',
      '100K tokens/month',
      'Basic analytics',
      'Community support',
    ],
  },
  STARTER: {
    name: 'Starter',
    price: 29,
    priceId: STRIPE_PRICE_IDS.STARTER,
    maxAgents: 5,
    maxTools: 10,
    monthlyTokenQuota: 500000,
    features: [
      '5 AI Agents',
      '10 Tools per agent',
      '500K tokens/month',
      'Advanced analytics',
      'Email support',
      'Custom domains',
      'API access',
    ],
  },
  PRO: {
    name: 'Pro',
    price: 99,
    priceId: STRIPE_PRICE_IDS.PRO,
    maxAgents: 20,
    maxTools: 50,
    monthlyTokenQuota: 2000000,
    features: [
      '20 AI Agents',
      '50 Tools per agent',
      '2M tokens/month',
      'Real-time analytics',
      'Priority support',
      'Custom domains',
      'Full API access',
      'Team collaboration',
      'Advanced security',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 299,
    priceId: STRIPE_PRICE_IDS.ENTERPRISE,
    maxAgents: 100,
    maxTools: 200,
    monthlyTokenQuota: 10000000,
    features: [
      'Unlimited AI Agents',
      'Unlimited Tools',
      '10M+ tokens/month',
      'Custom analytics',
      'Dedicated support',
      'Custom domains',
      'Enterprise API',
      'SSO & SAML',
      'Audit logs',
      'SLA guarantee',
      'Custom contracts',
    ],
  },
};

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
