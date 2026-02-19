import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      );
    }

    const body = await req.text();
    const signature = (await headers()).get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const workspace = await prisma.workspace.findFirst({
    where: { stripeCustomerId: subscription.customer as string },
  });

  if (!workspace) {
    console.error('Workspace not found for customer:', subscription.customer);
    return;
  }

  const tier = getTierFromPriceId(subscription.items.data[0]?.price.id);

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status.toUpperCase() as any,
      tier: (tier || workspace.tier) as any,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  await updateWorkspaceLimits(workspace.id, tier);

  console.log(`Subscription ${subscription.id} updated for workspace ${workspace.id}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const workspace = await prisma.workspace.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!workspace) return;

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      stripeSubscriptionId: null,
      subscriptionStatus: 'CANCELED',
      tier: 'FREE',
      cancelAtPeriodEnd: false,
    },
  });

  await updateWorkspaceLimits(workspace.id, 'FREE');

  console.log(`Subscription ${subscription.id} cancelled for workspace ${workspace.id}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription;
  if (!subscriptionId) return;

  const workspace = await prisma.workspace.findFirst({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (!workspace) return;

  await prisma.invoice.create({
    data: {
      workspaceId: workspace.id,
      stripeInvoiceId: invoice.id,
      stripeCustomerId: invoice.customer as string,
      stripeSubscriptionId: subscriptionId as string,
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      amountRemaining: invoice.amount_remaining,
      currency: invoice.currency,
      status: (invoice.status?.toUpperCase() || 'OPEN') as any,
      pdfUrl: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
    },
  });

  console.log(`Invoice ${invoice.id} payment succeeded for workspace ${workspace.id}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const workspace = await prisma.workspace.findFirst({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (!workspace) return;

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      status: 'PENDING_PAYMENT',
    },
  });

  console.log(`Invoice ${invoice.id} payment failed for workspace ${workspace.id}`);
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const workspace = await prisma.workspace.findFirst({
    where: { stripeCustomerId: paymentIntent.customer as string },
  });

  if (!workspace) return;

  await prisma.payment.create({
    data: {
      workspaceId: workspace.id,
      stripePaymentIntentId: paymentIntent.id,
      stripeCustomerId: paymentIntent.customer as string,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'SUCCEEDED',
      description: paymentIntent.description,
      metadata: paymentIntent.metadata as any,
    },
  });
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const workspace = await prisma.workspace.findFirst({
    where: { stripeCustomerId: paymentIntent.customer as string },
  });

  if (!workspace) return;

  await prisma.payment.create({
    data: {
      workspaceId: workspace.id,
      stripePaymentIntentId: paymentIntent.id,
      stripeCustomerId: paymentIntent.customer as string,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'FAILED',
      description: paymentIntent.description,
      metadata: paymentIntent.metadata as any,
    },
  });
}

function getTierFromPriceId(priceId: string | undefined): string | null {
  if (!priceId) return null;
  
  const { STRIPE_PRICE_IDS } = require('@/lib/stripe');
  
  if (priceId === STRIPE_PRICE_IDS.STARTER) return 'STARTER';
  if (priceId === STRIPE_PRICE_IDS.PRO) return 'PRO';
  if (priceId === STRIPE_PRICE_IDS.ENTERPRISE) return 'ENTERPRISE';
  
  return null;
}

async function updateWorkspaceLimits(workspaceId: string, tier: string | null) {
  const { SUBSCRIPTION_TIERS } = require('@/lib/stripe');
  
  const tierConfig = tier ? SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS] : SUBSCRIPTION_TIERS.FREE;
  
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      maxAgents: tierConfig.maxAgents,
      maxTools: tierConfig.maxTools,
      monthlyTokenQuota: tierConfig.monthlyTokenQuota,
    },
  });
}
