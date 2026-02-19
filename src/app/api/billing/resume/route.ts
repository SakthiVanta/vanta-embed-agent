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

    if (!workspace.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    await stripe.subscriptions.update(workspace.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { cancelAtPeriodEnd: false },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Subscription has been resumed' 
    });
  } catch (error) {
    console.error('Error resuming subscription:', error);
    return NextResponse.json(
      { error: 'Failed to resume subscription' },
      { status: 500 }
    );
  }
}
