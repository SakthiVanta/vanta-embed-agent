import OpenAI from 'openai'
import { LLMProviderAdapter, Message, ToolDefinition, StreamChunk, ToolCall, ProviderConfig } from './base'

export class OpenAIAdapter extends LLMProviderAdapter {
  private client: OpenAI

  constructor(config: ProviderConfig) {
    super(config)
    this.client = new OpenAI({
      apiKey: config.apiKey,
    })
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

    const stream = await this.client.chat.completions.create({
      model: this.config.model,
      messages: messages.map(m => {
        if (m.role === 'tool') {
          return {
            role: m.role as 'tool',
            content: m.content,
            tool_call_id: m.tool_call_id!,
          }
        }
        return {
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
          tool_calls: m.tool_calls,
        }
      }),
      tools: formattedTools,
      tool_choice: formattedTools ? 'auto' : undefined,
      temperature: this.config.temperature ?? 0.7,
      max_tokens: this.config.maxTokens ?? 2048,
      stream: true,
    })

    let currentToolCall: ToolCall | null = null

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta

      if (delta?.tool_calls && delta.tool_calls.length > 0) {
        const toolDelta = delta.tool_calls[0]
        
        if (toolDelta.id) {
          if (currentToolCall) {
            yield {
              type: 'tool_call_end',
              tool_call: currentToolCall,
            }
          }
          currentToolCall = {
            id: toolDelta.id,
            type: 'function',
            function: {
              name: toolDelta.function?.name || '',
              arguments: toolDelta.function?.arguments || '',
            },
          }
        } else if (currentToolCall && toolDelta.function) {
          if (toolDelta.function.name) {
            currentToolCall.function.name += toolDelta.function.name
          }
          if (toolDelta.function.arguments) {
            currentToolCall.function.arguments += toolDelta.function.arguments
          }
        }

        if (currentToolCall && chunk.choices[0]?.finish_reason === 'tool_calls') {
          yield {
            type: 'tool_call',
            tool_call: currentToolCall,
          }
          currentToolCall = null
        }
      }

      if (delta?.content) {
        yield {
          type: 'content',
          content: delta.content,
        }
      }

      if (chunk.choices[0]?.finish_reason === 'stop') {
        yield {
          type: 'end',
          usage: chunk.usage ? {
            prompt_tokens: chunk.usage.prompt_tokens,
            completion_tokens: chunk.usage.completion_tokens,
            total_tokens: chunk.usage.total_tokens,
          } : undefined,
        }
      }
    }
  }
}
