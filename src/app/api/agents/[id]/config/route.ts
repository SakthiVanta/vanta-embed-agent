import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: agentId } = await params

        // Fetch agent config details
        const agent = await prisma.agent.findUnique({
            where: { id: agentId },
            select: {
                id: true,
                name: true,
                description: true,
                avatarUrl: true,
                theme: true,
            }
        })

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
        }

        // Default theme fallback
        const defaultTheme = {
            primaryColor: '#00E5FF',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            textColor: '#F8FAFC',
            buttonColor: '#0055FF',
            buttonTextColor: '#ffffff',
        }

        // Parse theme from DB if it exists
        let agentTheme: Record<string, any> = {}
        if (agent.theme && typeof agent.theme === 'object') {
            agentTheme = agent.theme
        }

        // Map Prisma fields to the SDK expected format
        const configPayload = {
            name: agent.name,
            avatar: agent.avatarUrl,
            description: agent.description,
            ...defaultTheme,

            // Override with DB theme configuration if they exist
            ...(agentTheme.primaryColor && { primaryColor: agentTheme.primaryColor }),
            ...(agentTheme.backgroundColor && { backgroundColor: agentTheme.backgroundColor }),
            ...(agentTheme.textColor && { textColor: agentTheme.textColor }),
            ...(agentTheme.buttonColor && { buttonColor: agentTheme.buttonColor }),
            ...(agentTheme.buttonTextColor && { buttonTextColor: agentTheme.buttonTextColor }),
            ...(agentTheme.welcomeMessage && { welcomeMessage: agentTheme.welcomeMessage }),
            ...(agentTheme.mood && { mood: agentTheme.mood }),
            ...(agentTheme.fontFamily && { fontFamily: agentTheme.fontFamily }),
            ...(agentTheme.supportEmail && { supportEmail: agentTheme.supportEmail }),
            ...(agentTheme.logoUrl && { logoUrl: agentTheme.logoUrl }),
            ...(agentTheme.contactLink && { contactLink: agentTheme.contactLink }),
            ...(agentTheme.suggestions && { suggestions: agentTheme.suggestions }),
        }

        // CORS headers to allow the embedded widget to access this from any origin
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
        }

        return NextResponse.json(configPayload, { headers })

    } catch (error) {
        console.error('Get agent config error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function OPTIONS() {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    }
    return new NextResponse(null, { status: 200, headers })
}
