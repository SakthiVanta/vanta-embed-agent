import { LLMProviderAdapter, ProviderConfig } from './base'
import { OpenAIAdapter } from './openai'
import { GeminiAdapter } from './gemini'
import { GroqAdapter } from './groq'
import { OpenRouterAdapter } from './openrouter'

export type ProviderType = 'OPENAI' | 'GEMINI' | 'GROQ' | 'OPENROUTER'

export class ProviderFactory {
  static createProvider(type: ProviderType, config: ProviderConfig): LLMProviderAdapter {
    switch (type) {
      case 'OPENAI':
        return new OpenAIAdapter(config)
      case 'GEMINI':
        return new GeminiAdapter(config)
      case 'GROQ':
        return new GroqAdapter(config)
      case 'OPENROUTER':
        return new OpenRouterAdapter(config)
      default:
        throw new Error(`Unsupported provider type: ${type}`)
    }
  }

  static getAvailableModels(type: ProviderType): string[] {
    switch (type) {
      case 'OPENAI':
        return [
          'gpt-4-turbo-preview',
          'gpt-4',
          'gpt-3.5-turbo',
          'gpt-4o',
          'gpt-4o-mini',
        ]
      case 'GEMINI':
        return [
          'gemini-1.5-pro',
          'gemini-1.5-flash',
          'gemini-1.0-pro',
          'gemini-pro-vision',
        ]
      case 'GROQ':
        return [
          'llama-3.1-70b-versatile',
          'llama-3.1-8b-instant',
          'mixtral-8x7b-32768',
          'gemma-7b-it',
        ]
      case 'OPENROUTER':
        return [
          'anthropic/claude-3-opus',
          'anthropic/claude-3-sonnet',
          'meta-llama/llama-3.1-70b-instruct',
          'google/gemini-pro',
          'openai/gpt-4o',
        ]
      default:
        return []
    }
  }
}
