import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/security/auth'

export async function GET(request: NextRequest) {
  try {
    // Get workspace ID from query params
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID required' },
        { status: 400 }
      )
    }

    // Verify user has access to this workspace
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    
    if (token) {
      const payload = await verifyToken(token)
      if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Check workspace membership
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: payload.userId,
        },
      })

      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Get date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // 1. Total Agents Count
    const totalAgents = await prisma.agent.count({
      where: { workspaceId },
    })

    // 2. Agents created this week (for trend)
    const agentsThisWeek = await prisma.agent.count({
      where: {
        workspaceId,
        createdAt: {
          gte: startOfWeek,
        },
      },
    })

    // 3. Total Messages this month
    const messagesThisMonth = await prisma.message.count({
      where: {
        session: {
          workspaceId,
        },
        createdAt: {
          gte: startOfMonth,
        },
      },
    })

    // 4. Messages last month (for comparison)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const messagesLastMonth = await prisma.message.count({
      where: {
        session: {
          workspaceId,
        },
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    })

    // 5. Total Tool Executions
    const totalToolExecutions = await prisma.toolExecution.count({
      where: {
        session: {
          workspaceId,
        },
      },
    })

    // 6. Successful Tool Executions
    const successfulToolExecutions = await prisma.toolExecution.count({
      where: {
        session: {
          workspaceId,
        },
        status: 'SUCCESS',
      },
    })

    // 7. Calculate tool success rate
    const toolSuccessRate = totalToolExecutions > 0
      ? ((successfulToolExecutions / totalToolExecutions) * 100).toFixed(1)
      : '0'

    // 8. Calculate average response time from messages with latency data
    const messagesWithLatency = await prisma.message.findMany({
      where: {
        session: {
          workspaceId,
        },
        latencyMs: {
          not: null,
        },
      },
      select: {
        latencyMs: true,
      },
      take: 100, // Sample last 100 messages
      orderBy: {
        createdAt: 'desc',
      },
    })

    const avgLatency = messagesWithLatency.length > 0
      ? messagesWithLatency.reduce((sum, m) => sum + (m.latencyMs || 0), 0) / messagesWithLatency.length
      : 0

    const avgResponseTime = avgLatency > 0
      ? `${(avgLatency / 1000).toFixed(1)}s`
      : '< 1s'

    // Calculate trends
    const agentTrend = agentsThisWeek > 0 ? `+${agentsThisWeek} this week` : '+0 this week'
    
    const messageTrend = messagesLastMonth > 0
      ? `+${(((messagesThisMonth - messagesLastMonth) / messagesLastMonth) * 100).toFixed(0)}%`
      : '+0%'

    const stats = {
      totalAgents,
      agentTrend,
      totalMessages: messagesThisMonth,
      messageTrend,
      totalToolCalls: totalToolExecutions,
      toolSuccessRate: `${toolSuccessRate}% success`,
      avgResponseTime,
    }

    return NextResponse.json({ 
      success: true, 
      data: stats 
    })

  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
