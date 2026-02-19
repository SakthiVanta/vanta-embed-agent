import { z } from 'zod'

export const toolInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  type: z.enum(['REST_API', 'CLIENT_BRIDGE', 'CUSTOM_CODE']),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
  endpoint: z.string().url().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  bodyTemplate: z.record(z.string(), z.any()).optional(),
  authType: z.enum(['NONE', 'BEARER', 'API_KEY', 'BASIC', 'OAUTH2']).default('NONE'),
  authConfig: z.record(z.string(), z.any()).optional(),
  inputSchema: z.record(z.string(), z.any()),
  outputSchema: z.record(z.string(), z.any()).optional(),
  requiresConfirmation: z.boolean().default(false),
  timeoutMs: z.number().min(1000).max(120000).default(30000),
  retryCount: z.number().min(0).max(5).default(3),
  customCode: z.string().optional(),
})

export const agentConfigSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  systemPrompt: z.string().min(1).max(10000),
  provider: z.enum(['OPENAI', 'GEMINI', 'GROQ', 'OPENROUTER']),
  model: z.string(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(8000).default(2048),
  memoryEnabled: z.boolean().default(true),
  contextWindow: z.number().min(1).max(50).default(10),
  uiMode: z.enum(['EMBEDDED', 'FLOATING']).default('EMBEDDED'),
  floatingPosition: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']).optional(),
  theme: z.record(z.string(), z.any()).optional(),
  allowedDomains: z.array(z.string()).min(1),
  requireAuth: z.boolean().default(false),
})

export const chatMessageSchema = z.object({
  agentId: z.string().min(1),
  sessionId: z.string().optional(),
  message: z.string().min(1).max(10000),
  visitorId: z.string().optional(),
  visitorEmail: z.string().email().optional(),
})

export const validateToolInput = (
  input: unknown
): { success: true; data: z.infer<typeof toolInputSchema> } | { success: false; error: string } => {
  const result = toolInputSchema.safeParse(input)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ') }
}

export const validateAgentConfig = (
  input: unknown
): { success: true; data: z.infer<typeof agentConfigSchema> } | { success: false; error: string } => {
  const result = agentConfigSchema.safeParse(input)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ') }
}

export const validateChatMessage = (
  input: unknown
): { success: true; data: z.infer<typeof chatMessageSchema> } | { success: false; error: string } => {
  const result = chatMessageSchema.safeParse(input)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ') }
}

export const sanitizeToolOutput = (output: any): any => {
  if (typeof output === 'string') {
    return output
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
  }

  if (Array.isArray(output)) {
    return output.map(sanitizeToolOutput)
  }

  if (typeof output === 'object' && output !== null) {
    const sanitized: Record<string, any> = {}
    for (const [key, value] of Object.entries(output)) {
      if (typeof key === 'string' && !key.startsWith('__') && !key.startsWith('$')) {
        sanitized[key] = sanitizeToolOutput(value)
      }
    }
    return sanitized
  }

  return output
}
