import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/security/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID required' },
        { status: 400 }
      )
    }

    // Verify authentication
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
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

    // Get date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // 1. Total Messages (this month)
    const totalMessages = await prisma.message.count({
      where: {
        session: {
          workspaceId,
        },
        createdAt: {
          gte: startOfMonth,
        },
      },
    })

    // Messages last month for comparison
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

    const messageChange = messagesLastMonth > 0
      ? ((totalMessages - messagesLastMonth) / messagesLastMonth * 100).toFixed(0)
      : '0'

    // 2. Active Sessions (last 30 days)
    const activeSessions = await prisma.chatSession.count({
      where: {
        workspaceId,
        updatedAt: {
          gte: thirtyDaysAgo,
        },
      },
    })

    const sessionsLastMonth = await prisma.chatSession.count({
      where: {
        workspaceId,
        updatedAt: {
          gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
          lte: thirtyDaysAgo,
        },
      },
    })

    const sessionChange = sessionsLastMonth > 0
      ? ((activeSessions - sessionsLastMonth) / sessionsLastMonth * 100).toFixed(0)
      : '0'

    // 3. Tool Executions
    const toolExecutions = await prisma.toolExecution.count({
      where: {
        session: {
          workspaceId,
        },
      },
    })

    // Tool executions last month - use startedAt field
    const toolExecutionsLastMonth = await prisma.toolExecution.count({
      where: {
        session: {
          workspaceId,
        },
        startedAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    })

    const toolChange = toolExecutionsLastMonth > 0
      ? ((toolExecutions - toolExecutionsLastMonth) / toolExecutionsLastMonth * 100).toFixed(0)
      : '0'

    // 4. Calculate estimated cost from usage logs
    const usageLogs = await prisma.usageLog.findMany({
      where: {
        workspaceId,
        costUsd: {
          not: null,
        },
      },
      select: {
        costUsd: true,
      },
    })

    const totalCost = usageLogs.reduce((sum, log) => {
      return sum + (log.costUsd ? Number(log.costUsd) : 0)
    }, 0)

    // 5. Top performing agents
    const agentsWithStats = await prisma.agent.findMany({
      where: {
        workspaceId,
      },
      include: {
        _count: {
          select: {
            sessions: true,
            tools: true,
          },
        },
        sessions: {
          select: {
            _count: {
              select: {
                messages: true,
              },
            },
          },
        },
      },
      orderBy: {
        sessions: {
          _count: 'desc',
        },
      },
      take: 5,
    })

    const topAgents = agentsWithStats.map(agent => {
      const totalMessagesCount = agent.sessions.reduce((sum, session) => {
        return sum + session._count.messages
      }, 0)
      
      return {
        id: agent.id,
        name: agent.name,
        messages: totalMessagesCount,
        tools: agent._count.tools,
      }
    }).sort((a, b) => b.messages - a.messages)

    // 6. Daily message volume (last 30 days)
    const dailyMessages = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM messages
      WHERE session_id IN (
        SELECT id FROM chat_sessions WHERE workspace_id = ${workspaceId}
      )
      AND created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    ` as Array<{ date: Date; count: bigint }>

    const messageVolume = dailyMessages.map(day => ({
      date: day.date.toISOString().split('T')[0],
      count: Number(day.count),
    }))

    const analytics = {
      totalMessages,
      messageChange,
      activeSessions,
      sessionChange,
      toolExecutions,
      toolChange,
      estimatedCost: totalCost.toFixed(2),
      topAgents,
      messageVolume,
    }

    return NextResponse.json({
      success: true,
      data: analytics,
    })

  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
