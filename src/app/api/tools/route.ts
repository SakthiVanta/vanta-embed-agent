import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { validateToolInput } from '@/lib/tools/validators'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID required' },
        { status: 400 }
      )
    }

    const tools = await prisma.tool.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: { tools } })

  } catch (error) {
    console.error('Get tools error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateToolInput(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    const { agentId, ...toolData } = body

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'Agent ID required' },
        { status: 400 }
      )
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        _count: {
          select: { tools: true },
        },
        workspace: true,
      },
    })

    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      )
    }

    if (agent._count.tools >= agent.workspace.maxTools) {
      return NextResponse.json(
        { success: false, error: 'Maximum number of tools reached for this agent' },
        { status: 403 }
      )
    }

    const tool = await prisma.tool.create({
      data: {
        agentId,
        name: toolData.name,
        description: toolData.description,
        type: toolData.type,
        method: toolData.method,
        endpoint: toolData.endpoint,
        headers: toolData.headers,
        bodyTemplate: toolData.bodyTemplate,
        authType: toolData.authType,
        authConfig: toolData.authConfig,
        inputSchema: toolData.inputSchema,
        outputSchema: toolData.outputSchema,
        requiresConfirmation: toolData.requiresConfirmation,
        timeoutMs: toolData.timeoutMs,
        retryCount: toolData.retryCount,
        customCode: toolData.customCode,
      },
    })

    return NextResponse.json({ success: true, data: { tool } }, { status: 201 })

  } catch (error) {
    console.error('Create tool error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, agentId, ...updates } = body

    if (!id || !agentId) {
      return NextResponse.json(
        { success: false, error: 'Tool ID and Agent ID required' },
        { status: 400 }
      )
    }

    const tool = await prisma.tool.findFirst({
      where: { id, agentId },
    })

    if (!tool) {
      return NextResponse.json(
        { success: false, error: 'Tool not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.tool.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json({ success: true, data: { tool: updated } })

  } catch (error) {
    console.error('Update tool error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const agentId = searchParams.get('agentId')

    if (!id || !agentId) {
      return NextResponse.json(
        { success: false, error: 'Tool ID and Agent ID required' },
        { status: 400 }
      )
    }

    await prisma.tool.deleteMany({
      where: { id, agentId },
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete tool error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
