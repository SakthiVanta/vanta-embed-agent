/**
 * Centralized API client for making HTTP requests
 */

interface RequestOptions extends RequestInit {
    params?: Record<string, string | number | boolean>
}

class ApiClient {
    private baseUrl: string

    constructor(baseUrl: string = '') {
        this.baseUrl = baseUrl
    }

    private buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
        const url = new URL(path, window.location.origin)
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, String(value))
            })
        }
        return url.toString()
    }

    private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
        const { params, ...fetchOptions } = options
        const url = this.buildUrl(path, params)

        const response = await fetch(url, {
            ...fetchOptions,
            headers: {
                'Content-Type': 'application/json',
                ...fetchOptions.headers,
            },
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'An error occurred')
        }

        return data
    }

    async get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
        return this.request<T>(path, { method: 'GET', params })
    }

    async post<T>(path: string, body?: unknown): Promise<T> {
        return this.request<T>(path, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        })
    }

    async put<T>(path: string, body?: unknown): Promise<T> {
        return this.request<T>(path, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        })
    }

    async patch<T>(path: string, body?: unknown): Promise<T> {
        return this.request<T>(path, {
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        })
    }

    async delete<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
        return this.request<T>(path, { method: 'DELETE', params })
    }
}

export const apiClient = new ApiClient()

// Typed API functions
export const agentsApi = {
    list: (workspaceId: string) => apiClient.get<{ agents: import('@/types').Agent[] }>(`/api/agents`, { workspaceId }),

    create: (data: import('@/types').AgentFormData & { workspaceId: string }) =>
        apiClient.post<{ agent: import('@/types').Agent }>('/api/agents', data),

    update: (data: { id: string; workspaceId: string } & Partial<import('@/types').AgentFormData>) =>
        apiClient.put<{ agent: import('@/types').Agent }>('/api/agents', data),

    delete: (id: string, workspaceId: string) =>
        apiClient.delete<{ success: boolean }>(`/api/agents`, { id, workspaceId }),
}

export const toolsApi = {
    list: (agentId: string) => apiClient.get<{ tools: import('@/types').Tool[] }>(`/api/tools`, { agentId }),

    create: (data: import('@/types').ToolFormData & { agentId: string }) =>
        apiClient.post<{ tool: import('@/types').Tool }>('/api/tools', data),

    update: (data: { id: string; agentId: string } & Partial<import('@/types').ToolFormData>) =>
        apiClient.put<{ tool: import('@/types').Tool }>('/api/tools', data),

    delete: (id: string, agentId: string) =>
        apiClient.delete<{ success: boolean }>(`/api/tools`, { id, agentId }),
}

export const authApi = {
    login: (email: string, password: string) =>
        apiClient.post<{ user: import('@/types').User; token: string; workspace: import('@/types').Workspace }>('/api/auth/login', { email, password }),

    register: (data: { email: string; password: string; firstName?: string; lastName?: string; workspaceName: string }) =>
        apiClient.post<{ user: import('@/types').User; token: string; workspace: import('@/types').Workspace }>('/api/auth/register', data),

    logout: () => apiClient.post('/api/auth/logout'),
}
