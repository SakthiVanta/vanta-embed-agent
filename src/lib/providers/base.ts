export interface ToolDefinition {
  name: string
  description: string
  parameters: {
    type: string
    properties: Record<string, any>
    required: string[]
  }
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface StreamChunk {
  type: 'content' | 'tool_call' | 'tool_call_end' | 'end'
  content?: string
  tool_call?: ToolCall
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface ProviderConfig {
  apiKey: string
  model: string
  temperature?: number
  maxTokens?: number
}

export abstract class LLMProviderAdapter {
  protected config: ProviderConfig

  constructor(config: ProviderConfig) {
    this.config = config
  }

  abstract streamChat(
    messages: Message[],
    tools?: ToolDefinition[]
  ): AsyncGenerator<StreamChunk>

  abstract normalizeToolDefinition(tool: any): any
  abstract normalizeToolCall(toolCall: any): ToolCall
  abstract supportsToolCalling(): boolean
}
