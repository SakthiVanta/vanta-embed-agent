import prisma from '@/lib/prisma'
import { ToolExecutor } from '@/lib/tools/executor'
import { sanitizeToolOutput } from '@/lib/tools/validators'

export async function executeToolCall({
    toolCall,
    agent,
    chatSessionId,
    workspaceId,
    visitorId,
    origin,
    toolExecutor
}: {
    toolCall: any,
    agent: any,
    chatSessionId: string,
    workspaceId: string,
    visitorId?: string,
    origin?: string,
    toolExecutor: ToolExecutor
}) {
    const tool = agent.tools.find((t: any) => t.name.trim() === toolCall.function.name.trim())

    if (!tool) {
        return {
            success: false,
            data: null,
            error: `Tool not found: ${toolCall.function.name}`,
            latencyMs: 0,
        }
    }

    console.log(`[ToolEx] LLM requested: ${toolCall.function.name}`)
    const parameters = JSON.parse(toolCall.function.arguments || '{}')

    await prisma.toolExecution.create({
        data: {
            sessionId: chatSessionId,
            toolId: tool.id,
            input: parameters,
            status: 'RUNNING',
        },
    })

    const result = await toolExecutor.execute(tool.id, parameters, {
        sessionId: chatSessionId,
        agentId: agent.id,
        workspaceId,
        visitorId,
        origin,
    })

    console.log(`[ToolEx] Result for ${tool.name}:`, {
        success: result.success,
        latency: result.latencyMs,
        error: result.error,
    })

    await prisma.toolExecution.updateMany({
        where: {
            sessionId: chatSessionId,
            toolId: tool.id,
        },
        data: {
            output: result.data,
            error: result.error,
            status: result.success ? 'SUCCESS' : 'FAILED',
            completedAt: new Date(),
            latencyMs: result.latencyMs,
        },
    })

    const sanitizedOutput = sanitizeToolOutput(result.data)
    const finalOutput = Array.isArray(sanitizedOutput)
        ? { count: sanitizedOutput.length, items: sanitizedOutput } // Enforce 'count' injection
        : sanitizedOutput

    return {
        ...result,
        data: finalOutput,
    }
}
