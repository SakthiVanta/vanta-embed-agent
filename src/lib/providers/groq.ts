import { LLMProviderAdapter, Message, ToolDefinition, StreamChunk, ToolCall, ProviderConfig } from './base'

export class GroqAdapter extends LLMProviderAdapter {
  private apiKey: string
  private baseUrl = 'https://api.groq.com/openai/v1'

  constructor(config: ProviderConfig) {
    super(config)
    this.apiKey = config.apiKey
  }

  supportsToolCalling(): boolean {
    return true
  }

  normalizeToolDefinition(tool: ToolDefinition): any {
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }
  }

  normalizeToolCall(toolCall: any): ToolCall {
    return {
      id: toolCall.id,
      type: 'function',
      function: {
        name: toolCall.function.name,
        arguments: toolCall.function.arguments,
      },
    }
  }

  async *streamChat(
    messages: Message[],
    tools?: ToolDefinition[]
  ): AsyncGenerator<StreamChunk> {
    const formattedTools = tools?.map(t => this.normalizeToolDefinition(t))

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          tool_calls: m.tool_calls,
          tool_call_id: m.tool_call_id,
        })),
        tools: formattedTools,
        tool_choice: formattedTools ? 'auto' : undefined,
        temperature: this.config.temperature ?? 0.7,
        max_tokens: this.config.maxTokens ?? 2048,
        stream: true,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Groq API error: ${error.error?.message || 'Unknown error'}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim() === '' || line.startsWith(':')) continue

        const data = line.replace(/^data: /, '')
        if (data === '[DONE]') {
          yield { type: 'end' }
          return
        }

        try {
          const chunk = JSON.parse(data)
          const delta = chunk.choices[0]?.delta

          if (delta?.tool_calls) {
            for (const toolCall of delta.tool_calls) {
              if (toolCall.function?.name) {
                yield {
                  type: 'tool_call',
                  tool_call: {
                    id: toolCall.id || `call_${Date.now()}`,
                    type: 'function',
                    function: {
                      name: toolCall.function.name,
                      arguments: toolCall.function.arguments || '',
                    },
                  },
                }
              }
            }
          }

          if (delta?.content) {
            yield {
              type: 'content',
              content: delta.content,
            }
          }
        } catch (e) {
          console.error('Failed to parse chunk:', e)
        }
      }
    }
  }
}
