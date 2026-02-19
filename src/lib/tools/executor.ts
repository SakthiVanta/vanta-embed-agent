import type { ToolModel, ToolExecutionModel } from '@/generated/prisma/models'

export interface ToolExecutionResult {
  success: boolean
  data: any
  error?: string
  latencyMs: number
}

export interface ToolExecutionContext {
  sessionId: string
  agentId: string
  workspaceId: string
  visitorId?: string
  origin?: string
}

export class ToolRegistry {
  private tools: Map<string, ToolModel>

  constructor() {
    this.tools = new Map()
  }

  register(tool: ToolModel): void {
    this.tools.set(tool.id, tool)
  }

  registerMany(tools: ToolModel[]): void {
    tools.forEach(tool => this.register(tool))
  }

  get(toolId: string): ToolModel | undefined {
    return this.tools.get(toolId)
  }

  getByAgent(agentId: string): ToolModel[] {
    return Array.from(this.tools.values()).filter(t => t.agentId === agentId)
  }

  clear(): void {
    this.tools.clear()
  }
}

export class ToolExecutor {
  private registry: ToolRegistry

  constructor(registry: ToolRegistry) {
    this.registry = registry
  }

  async execute(
    toolId: string,
    parameters: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const tool = this.registry.get(toolId)
    
    if (!tool) {
      return {
        success: false,
        data: null,
        error: `Tool not found: ${toolId}`,
        latencyMs: 0,
      }
    }

    const startTime = Date.now()

    try {
      switch (tool.type) {
        case 'REST_API':
          return await this.executeRestApi(tool, parameters, context)
        case 'CLIENT_BRIDGE':
          return await this.executeClientBridge(tool, parameters, context)
        case 'CUSTOM_CODE':
          return await this.executeCustomCode(tool, parameters, context)
        default:
          throw new Error(`Unsupported tool type: ${tool.type}`)
      }
    } catch (error) {
      const latencyMs = Date.now() - startTime
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        latencyMs,
      }
    }
  }

  private async executeRestApi(
    tool: ToolModel,
    parameters: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now()
    
    if (!tool.endpoint || !tool.method) {
      throw new Error('REST API tool missing endpoint or method')
    }

    let url = tool.endpoint
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(tool.headers as Record<string, string> || {}),
    }

    if (tool.authType === 'BEARER') {
      const authConfig = tool.authConfig as { token?: string }
      if (authConfig?.token) {
        headers['Authorization'] = `Bearer ${authConfig.token}`
      }
    } else if (tool.authType === 'API_KEY') {
      const authConfig = tool.authConfig as { headerName?: string; apiKey?: string }
      if (authConfig?.headerName && authConfig?.apiKey) {
        headers[authConfig.headerName] = authConfig.apiKey
      }
    }

    Object.keys(parameters).forEach(key => {
      url = url.replace(`{{${key}}}`, encodeURIComponent(String(parameters[key])))
    })

    let body: string | undefined
    if (tool.bodyTemplate) {
      const template = JSON.stringify(tool.bodyTemplate)
      let populatedBody = template
      Object.keys(parameters).forEach(key => {
        populatedBody = populatedBody.replace(
          new RegExp(`"{{${key}}}"`, 'g'),
          JSON.stringify(parameters[key])
        )
      })
      body = populatedBody
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), tool.timeoutMs || 30000)

    try {
      const response = await fetch(url, {
        method: tool.method,
        headers,
        body: body && tool.method !== 'GET' ? body : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const latencyMs = Date.now() - startTime

      return {
        success: true,
        data,
        latencyMs,
      }
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  private async executeClientBridge(
    tool: ToolModel,
    parameters: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now()
    
    return {
      success: true,
      data: {
        type: 'CLIENT_BRIDGE_REQUEST',
        toolId: tool.id,
        toolName: tool.name,
        parameters,
        sessionId: context.sessionId,
        requiresConfirmation: tool.requiresConfirmation,
      },
      latencyMs: Date.now() - startTime,
    }
  }

  private async executeCustomCode(
    tool: ToolModel,
    parameters: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now()
    
    if (!tool.customCode) {
      throw new Error('Custom code tool missing code')
    }

    throw new Error('Custom code execution not implemented in this environment')
  }
}
