import prisma from '@/lib/prisma'

export async function authenticateChatRequest(authHeader: string | null) {
    if (!authHeader?.startsWith('Bearer ')) {
        return { success: false, apiKeyWorkspaceId: undefined }
    }

    const apiKey = authHeader.split(' ')[1]

    const validKey = await prisma.apiKey.findUnique({
        where: { key: apiKey },
    })

    if (validKey && validKey.isActive) {
        // Update last used asynchronously (don't block)
        prisma.apiKey.update({
            where: { id: validKey.id },
            data: { lastUsedAt: new Date() }
        }).catch(console.error)

        return { success: true, apiKeyWorkspaceId: validKey.workspaceId }
    }

    return { success: false, apiKeyWorkspaceId: undefined }
}
