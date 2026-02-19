import { LLMProviderAdapter, StreamChunk, Message, ToolDefinition } from '../providers/base'
import { ToolExecutionResult } from '../tools/executor'

export interface StreamControllerOptions {
  onChunk?: (chunk: StreamChunk) => void
  onToolCall?: (toolCall: any) => Promise<ToolExecutionResult>
  onComplete?: () => void
  onError?: (error: Error) => void
}

export class StreamController {
  private provider: LLMProviderAdapter
  private messages: Message[]
  private tools?: ToolDefinition[]
  private options: StreamControllerOptions
  private isRunning: boolean = false

  constructor(
    provider: LLMProviderAdapter,
    messages: Message[],
    tools: ToolDefinition[] | undefined,
    options: StreamControllerOptions
  ) {
    this.provider = provider
    this.messages = messages
    this.tools = tools
    this.options = options
  }

  async *stream(): AsyncGenerator<StreamChunk> {
    if (this.isRunning) {
      throw new Error('Stream is already running')
    }

    this.isRunning = true

    try {
      const stream = this.provider.streamChat(this.messages, this.tools)

      for await (const chunk of stream) {
        if (chunk.type === 'tool_call' && this.options.onToolCall) {
          const result = await this.options.onToolCall(chunk.tool_call)

          yield {
            type: 'content',
            content: `\n[Tool ${chunk.tool_call?.function?.name} executed: ${result.success ? 'success' : 'failed'}]\n`,
          }

          if (result.data) {
            // Add the assistant's tool call message to history
            this.messages.push({
              role: 'assistant',
              content: '',
              tool_calls: [chunk.tool_call!],
            })

            // Add the tool execution result
            this.messages.push({
              role: 'tool',
              content: JSON.stringify(result.data),
              tool_call_id: chunk.tool_call?.id,
            })

            const continuation = this.provider.streamChat(this.messages, this.tools)
            for await (const contChunk of continuation) {
              yield contChunk
            }
          }
        } else {
          if (this.options.onChunk) {
            this.options.onChunk(chunk)
          }
          yield chunk
        }

        if (chunk.type === 'end') {
          if (this.options.onComplete) {
            this.options.onComplete()
          }
          break
        }
      }
    } catch (error) {
      if (this.options.onError) {
        this.options.onError(error instanceof Error ? error : new Error(String(error)))
      }
      throw error
    } finally {
      this.isRunning = false
    }
  }

  stop(): void {
    this.isRunning = false
  }
}

export const createSSEStream = (
  generator: AsyncGenerator<StreamChunk>
): ReadableStream => {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          const data = `data: ${JSON.stringify(chunk)}\n\n`
          controller.enqueue(encoder.encode(data))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (error) {
        const errorData = `data: ${JSON.stringify({ error: String(error) })}\n\n`
        controller.enqueue(encoder.encode(errorData))
        controller.close()
      }
    },
    cancel() {
    },
  })
}
