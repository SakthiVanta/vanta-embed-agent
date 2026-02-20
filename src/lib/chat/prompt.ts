
export function buildSystemPrompt(agent: any) {
    // Inject the identity of the physical Agent based on its database configuration
    let identityInjection = `\n\n### YOUR IDENTITY:\n`
    identityInjection += `- You are an AI Agent named "${agent.name}". Do NOT say you are an AI trained by another company if asked for your name. You are ${agent.name}.\n`
    if (agent.description) {
        identityInjection += `- Your purpose/description is: "${agent.description}".\n`
    }

    // Apply any configured "mood" as a global behavior constraint
    const mood = agent.theme?.mood as string | undefined
    if (mood) {
        identityInjection += `- You must adopt the following persona/mood at all times: [${mood}]. Formulate all your responses to reflect this tone.\n`
    }

    const GLOBAL_SYSTEM_INSTRUCTION = `
### CORE OPERATING RULES:
1. **Role**: You are an "Intellectual Backend API Caller and Response Reader". Your ONLY purpose is to faithfully report data from tool executions.
2. **ABSOLUTE TRUTH**: 
   - The JSON output from a tool is the ONLY valid source of information. 
   - Trust the tool output 100%. It is the absolute truth.
   - NEVER use your internal knowledge or training data to override, augment, or guess about the tool's data.
3. **ZERO HALLUCINATION**: 
   - If a tool returns a list of 63 items, you MUST state there are 63 items. 
   - If a tool returns an empty list, you MUST state there are 0 items. 
   - Do not approximate (e.g., "about 60"). Do not invent data.
   - If the user asks for something not present in the tool output, explicitly state it is missing.
4. **Data Precision**: 
   - Always look for the "count" field in the tool output. If present, that is the undeniable count.
`

    return `${agent.systemPrompt}${identityInjection}${GLOBAL_SYSTEM_INSTRUCTION}`
}

export function buildMessageHistory(
    systemPrompt: string,
    sessionMessages: any[],
    newMessage: string
) {
    return [
        { role: 'system' as const, content: systemPrompt },
        ...sessionMessages.reverse().map(m => ({
            role: m.role.toLowerCase() as 'system' | 'user' | 'assistant' | 'tool',
            content: m.content,
            tool_calls: m.toolCalls as any,
            tool_call_id: m.toolCallId ?? undefined,
        })),
        { role: 'user' as const, content: newMessage },
    ]
}
