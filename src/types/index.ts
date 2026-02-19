// Agent Types
export interface Agent {
    id: string
    name: string
    description?: string
    provider: string
    model: string
    isActive: boolean
    isPublic: boolean
    systemPrompt?: string
    temperature?: number
    maxTokens?: number
    memoryEnabled?: boolean
    contextWindow?: number
    uiMode?: string
    floatingPosition?: string
    theme?: Record<string, unknown>
    allowedDomains?: string[]
    requireAuth?: boolean
    createdAt?: string
    updatedAt: string
    _count?: {
        tools: number
        sessions: number
    }
}

export interface AgentFormData {
    name: string
    description?: string
    systemPrompt: string
    provider: string
    model: string
    temperature?: number
    maxTokens?: number
    memoryEnabled?: boolean
    contextWindow?: number
    uiMode?: string
    floatingPosition?: string
    theme?: Record<string, unknown>
    allowedDomains?: string[]
    requireAuth?: boolean
}

// Tool Types
export interface Tool {
    id: string
    name: string
    description: string
    type: 'REST_API' | 'CLIENT_BRIDGE' | 'CUSTOM_CODE'
    method?: string
    endpoint?: string
    isActive: boolean
    requiresConfirmation: boolean
    inputSchema?: Record<string, unknown>
    outputSchema?: Record<string, unknown>
    headers?: Record<string, string>
    createdAt?: string
    updatedAt?: string
}

export interface ToolFormData {
    name: string
    description: string
    type: 'REST_API' | 'CLIENT_BRIDGE' | 'CUSTOM_CODE'
    method?: string
    endpoint?: string
    inputSchema?: Record<string, unknown>
    outputSchema?: Record<string, unknown>
    headers?: Record<string, string>
    requiresConfirmation?: boolean
}

// User Types
export interface User {
    id: string
    email: string
    firstName?: string
    lastName?: string
    createdAt?: string
    updatedAt?: string
}

export interface UserSession {
    id: string
    userId: string
    token: string
    expiresAt: string
}

// Workspace Types
export interface Workspace {
    id: string
    name: string
    slug: string
    maxAgents?: number
    maxTools?: number
    createdAt?: string
    updatedAt?: string
}

export interface WorkspaceMember {
    id: string
    workspaceId: string
    userId: string
    role: 'OWNER' | 'ADMIN' | 'MEMBER'
    user?: User
}

// Chat Types
export interface ChatSession {
    id: string
    agentId: string
    visitorId?: string
    visitorEmail?: string
    ipAddress?: string
    userAgent?: string
    origin?: string
    createdAt?: string
    updatedAt?: string
}

export interface Message {
    id: string
    sessionId: string
    role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL'
    content: string
    toolCalls?: unknown
    toolCallId?: string
    createdAt?: string
}

// Dashboard Types
export interface DashboardStats {
    totalAgents: number
    totalMessages: number
    totalToolCalls: number
    avgResponseTime: string
}

export interface RecentActivity {
    id: string
    title: string
    time: string
    agent: string
}

// Provider Types
export type ProviderType = 'OPENAI' | 'GEMINI' | 'GROQ' | 'OPENROUTER'

export interface ProviderKey {
    id: string
    workspaceId: string
    provider: ProviderType
    encryptedKey: string
    isActive: boolean
    isDefault: boolean
    createdAt?: string
    updatedAt?: string
}

// API Response Types
export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
}

export interface PaginatedResponse<T> {
    items: T[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
}
