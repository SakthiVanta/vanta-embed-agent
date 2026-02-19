import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/security/auth';
import prisma from '@/lib/prisma';

export async function GET() {
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
      where: { userId: payload.userId },
      include: { workspace: true },
    });

    if (!workspaceMember) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const workspace = workspaceMember.workspace;

    return NextResponse.json({
      tier: workspace.tier,
      status: workspace.subscriptionStatus,
      currentPeriodEnd: workspace.currentPeriodEnd,
      cancelAtPeriodEnd: workspace.cancelAtPeriodEnd,
      stripeCustomerId: workspace.stripeCustomerId,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
