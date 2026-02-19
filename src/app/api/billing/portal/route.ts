import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/security/auth';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

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

    if (!workspace.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 400 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: workspace.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}
