import prisma from '@/lib/prisma'

export async function getOrCreateChatSession({
    providedSessionId,
    workspaceId,
    agentId,
    visitorId,
    visitorEmail,
    ip,
    userAgent,
    origin,
    contextWindow
}: {
    providedSessionId?: string
    workspaceId: string
    agentId: string
    visitorId?: string
    visitorEmail?: string
    ip: string
    userAgent: string
    origin: string
    contextWindow: number
}) {
    let chatSessionId = providedSessionId
    let session = null

    if (chatSessionId) {
        session = await prisma.chatSession.findUnique({
            where: { id: chatSessionId },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: contextWindow,
                },
            },
        })
    }

    // If no session ID provided, or the provided one was stale/not found, create a new one
    if (!session) {
        if (providedSessionId) {
            console.warn(`[ChatSession] Session ${providedSessionId} not found. Creating new session.`)
        }

        session = await prisma.chatSession.create({
            data: {
                workspaceId,
                agentId,
                visitorId,
                visitorEmail,
                ipAddress: ip,
                userAgent,
                origin,
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: contextWindow,
                },
            },
        })
        chatSessionId = session.id
    }

    return { session, chatSessionId }
}

export async function saveUserMessage(sessionId: string, content: string) {
    return await prisma.message.create({
        data: {
            sessionId,
            role: 'USER',
            content,
        },
    })
}

export async function saveAssistantMessage(sessionId: string, content: string) {
    return await prisma.message.create({
        data: {
            sessionId: sessionId,
            role: 'ASSISTANT',
            content: content,
        },
    })
}

export async function logUsageMetrics({
    workspaceId,
    provider,
    model,
    message,
    fullResponse,
    ip,
    userAgent,
    origin
}: {
    workspaceId: string,
    provider: any,
    model: string,
    message: string,
    fullResponse: string,
    ip: string,
    userAgent: string,
    origin: string
}) {
    const inputTokens = Math.ceil(message.length / 4)
    const outputTokens = Math.ceil(fullResponse.length / 4)

    return await prisma.usageLog.create({
        data: {
            workspaceId,
            eventType: 'CHAT_MESSAGE',
            provider,
            model,
            tokensInput: inputTokens,
            tokensOutput: outputTokens,
            ipAddress: ip,
            userAgent,
            origin,
        }
    })
}
