import { GoogleGenerativeAI, GenerativeModel, Tool, SchemaType } from '@google/generative-ai'
import { LLMProviderAdapter, Message, ToolDefinition, StreamChunk, ToolCall, ProviderConfig } from './base'

export class GeminiAdapter extends LLMProviderAdapter {
  private client: GoogleGenerativeAI
  private model: GenerativeModel

  constructor(config: ProviderConfig) {
    super(config)
    this.client = new GoogleGenerativeAI(config.apiKey)
    this.model = this.client.getGenerativeModel({
      model: config.model,
    })
  }

  supportsToolCalling(): boolean {
    return true
  }

  normalizeToolDefinition(tool: ToolDefinition): Tool {
    return {
      functionDeclarations: [{
        name: tool.name.trim(),
        description: tool.description,
        parameters: {
          type: SchemaType.OBJECT,
          properties: tool.parameters.properties,
          required: tool.parameters.required,
        },
      }],
    }
  }

  normalizeToolCall(toolCall: any): ToolCall {
    return {
      id: `${toolCall.name}_${Date.now()}`,
      type: 'function',
      function: {
        name: toolCall.name,
        arguments: JSON.stringify(toolCall.args),
      },
    }
  }

  async *streamChat(
    messages: Message[],
    tools?: ToolDefinition[]
  ): AsyncGenerator<StreamChunk> {
    const geminiTools = tools?.map(t => this.normalizeToolDefinition(t))

    // Extract system message if present
    const systemMessage = messages.find(m => m.role === 'system')
    let historyMessages = messages.filter(m => m.role !== 'system')

    // Ensure history excludes the last message (which is the new prompt)
    const history = historyMessages.slice(0, -1).map(m => {
      if (m.role === 'assistant' && m.tool_calls && m.tool_calls.length > 0) {
        return {
          role: 'model',
          parts: m.tool_calls.map(tc => ({
            functionCall: {
              name: tc.function.name,
              args: JSON.parse(tc.function.arguments),
            }
          }))
        }
      }

      if (m.role === 'tool') {
        const toolCallId = m.tool_call_id
        // We need the function name. It's not in the message content easily unless we look back.
        // But for Gemini, we can try to find it or parse it.
        // However, the standard mapping usually requires lookahead/lookbehind.
        // For simplicity, let's assume we can derive it or the previous message has it.
        // Actually, without the name, functionResponse is invalid.
        // Let's assume the previous message was the function call.

        // HACK: We need the name. 
        // Iterate history to find the matching call? 
        // Or better: The adapter should have preserved it.

        // Let's try to infer it from the structure if possible, OR
        // allow the 'functionResponse' to use a placeholder if necessary, 
        // but Gemini is strict.

        // A robust way: Iterate the *entire* message array to map IDs to names?
        // But here we are inside map().

        // Let's just create the part structure and hope we can fill the name.
        // Actually, let's change the map strategy to specific block below.
        return {
          role: 'function',
          parts: [{
            functionResponse: {
              name: 'unknown_tool', // This will fail if not matched.
              response: { name: 'unknown_tool', content: JSON.parse(m.content) }
            }
          }]
        }
      }

      return {
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }
    })

    // Fix tool names for function responses by looking at previous messages
    for (let i = 0; i < history.length; i++) {
      if (history[i].role === 'function') {
        const prev = history[i - 1];
        if (prev && prev.parts && prev.parts.length > 0) {
          const part = prev.parts[0];
          if ('functionCall' in part) {
            const name = part.functionCall.name;
            // @ts-ignore
            history[i].parts[0].functionResponse.name = name;
            // @ts-ignore
            history[i].parts[0].functionResponse.response.name = name;
          }
        }
      }
    }

    console.log('[GeminiAdapter] System Instruction:', systemMessage?.content)
    console.log('[GeminiAdapter] History:', JSON.stringify(history, null, 2))

    const chat = this.model.startChat({
      tools: geminiTools,
      systemInstruction: systemMessage ? {
        role: 'user',
        parts: [{ text: systemMessage.content }]
      } : undefined,
      history: history,
      generationConfig: {
        temperature: this.config.temperature ?? 0.7,
        maxOutputTokens: this.config.maxTokens ?? 2048,
      },
    })

    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessageStream(lastMessage.content)

    for await (const chunk of result.stream) {
      const candidates = chunk.candidates
      if (!candidates || candidates.length === 0) continue

      const candidate = candidates[0]

      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.text) {
            yield {
              type: 'content',
              content: part.text,
            }
          }

          if (part.functionCall) {
            yield {
              type: 'tool_call',
              tool_call: this.normalizeToolCall(part.functionCall),
            }
          }
        }
      }

      if (candidate.finishReason === 'STOP') {
        yield {
          type: 'end',
        }
      }
    }
  }
}
