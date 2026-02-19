// Application-wide constants

// Provider types and models
export const PROVIDERS = {
    OPENAI: {
        name: 'OpenAI',
        models: [
            'gpt-4-turbo-preview',
            'gpt-4',
            'gpt-3.5-turbo',
            'gpt-4o',
            'gpt-4o-mini',
        ],
    },
    GEMINI: {
        name: 'Google Gemini',
        models: [
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-1.0-pro',
            'gemini-pro-vision',
        ],
    },
    GROQ: {
        name: 'Groq',
        models: [
            'llama-3.1-70b-versatile',
            'llama-3.1-8b-instant',
            'mixtral-8x7b-32768',
            'gemma-7b-it',
        ],
    },
    OPENROUTER: {
        name: 'OpenRouter',
        models: [
            'anthropic/claude-3-opus',
            'anthropic/claude-3-sonnet',
            'meta-llama/llama-3.1-70b-instruct',
            'google/gemini-pro',
            'openai/gpt-4o',
        ],
    },
} as const

export type ProviderType = keyof typeof PROVIDERS

// Tool types
export const TOOL_TYPES = {
    REST_API: {
        name: 'REST API',
        description: 'Call external REST APIs',
    },
    CLIENT_BRIDGE: {
        name: 'Client Bridge',
        description: 'Execute code in the client browser',
    },
    CUSTOM_CODE: {
        name: 'Custom Code',
        description: 'Run custom server-side code',
    },
} as const

export type ToolType = keyof typeof TOOL_TYPES

// HTTP Methods for REST API tools
export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const
export type HttpMethod = typeof HTTP_METHODS[number]

// UI Modes for agents
export const UI_MODES = {
    EMBEDDED: {
        name: 'Embedded',
        description: 'Embedded chat widget',
    },
    FLOATING: {
        name: 'Floating',
        description: 'Floating chat bubble',
    },
    FULLPAGE: {
        name: 'Full Page',
        description: 'Full page chat interface',
    },
} as const

export type UIMode = keyof typeof UI_MODES

// Default agent configuration
export const DEFAULT_AGENT_CONFIG = {
    temperature: 0.7,
    maxTokens: 4096,
    contextWindow: 10,
    memoryEnabled: true,
    uiMode: 'EMBEDDED' as UIMode,
    requireAuth: false,
}

// Rate limiting
export const RATE_LIMITS = {
    AGENT_REQUESTS_PER_MINUTE: 60,
    CHAT_MESSAGES_PER_MINUTE: 30,
    API_REQUESTS_PER_MINUTE: 100,
}

// Cache TTLs (in seconds)
export const CACHE_TTL = {
    AGENT: 300,
    TOOLS: 300,
    SESSION: 600,
    MESSAGES: 300,
    RATE_LIMIT: 60,
    WORKSPACE: 600,
    PROVIDER_KEY: 300,
}

// Pagination defaults
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
}

// Theme defaults
export const DEFAULT_THEME = {
    primaryColor: '#10b981', // emerald-500
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderRadius: '8px',
    fontFamily: 'system-ui, sans-serif',
}
