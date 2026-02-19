import { NextRequest, NextResponse } from 'next/server';
import { stripe, SUBSCRIPTION_TIERS } from '@/lib/stripe';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/security/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { priceId, tier } = await req.json();

    if (!priceId || !tier) {
      return NextResponse.json(
        { error: 'Price ID and tier are required' },
        { status: 400 }
      );
    }

    // Get user's workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { 
        userId: payload.userId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
      include: { workspace: true },
    });

    if (!workspaceMember) {
      return NextResponse.json(
        { error: 'No workspace found or insufficient permissions' },
        { status: 403 }
      );
    }

    const workspace = workspaceMember.workspace;

    // Create or get Stripe customer
    let customerId = workspace.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: payload.email,
        name: workspace.name,
        metadata: {
          workspaceId: workspace.id,
          userId: payload.userId,
        },
      });
      
      customerId = customer.id;
      
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          workspaceId: workspace.id,
          userId: payload.userId,
          tier: tier,
        },
      },
      metadata: {
        workspaceId: workspace.id,
        userId: payload.userId,
        tier: tier,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
