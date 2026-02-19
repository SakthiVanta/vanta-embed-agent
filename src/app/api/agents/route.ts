import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { validateAgentConfig } from '@/lib/tools/validators'

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

    const agents = await prisma.agent.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: { tools: true, sessions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: { agents } })

  } catch (error) {
    console.error('Get agents error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateAgentConfig(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { workspaceId, ...agentData } = body

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID required' },
        { status: 400 }
      )
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    const existingCount = await prisma.agent.count({
      where: { workspaceId },
    })

    if (existingCount >= workspace.maxAgents) {
      return NextResponse.json(
        { error: 'Maximum number of agents reached for this workspace' },
        { status: 403 }
      )
    }

    const agent = await prisma.agent.create({
      data: {
        workspaceId,
        name: agentData.name,
        description: agentData.description,
        systemPrompt: agentData.systemPrompt,
        provider: agentData.provider,
        model: agentData.model,
        temperature: agentData.temperature,
        maxTokens: agentData.maxTokens,
        memoryEnabled: agentData.memoryEnabled,
        contextWindow: agentData.contextWindow,
        uiMode: agentData.uiMode,
        floatingPosition: agentData.floatingPosition,
        theme: agentData.theme || {},
        allowedDomains: agentData.allowedDomains,
        requireAuth: agentData.requireAuth,
      },
    })

    return NextResponse.json({ agent }, { status: 201 })

  } catch (error) {
    console.error('Create agent error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, workspaceId, ...updates } = body

    if (!id || !workspaceId) {
      return NextResponse.json(
        { error: 'Agent ID and Workspace ID required' },
        { status: 400 }
      )
    }

    const agent = await prisma.agent.findFirst({
      where: { id, workspaceId },
    })

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.agent.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json({ agent: updated })

  } catch (error) {
    console.error('Update agent error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const workspaceId = searchParams.get('workspaceId')

    if (!id || !workspaceId) {
      return NextResponse.json(
        { error: 'Agent ID and Workspace ID required' },
        { status: 400 }
      )
    }

    await prisma.agent.deleteMany({
      where: { id, workspaceId },
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete agent error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
