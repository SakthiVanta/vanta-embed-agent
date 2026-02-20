'use server'

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { LLMProvider, ToolType, ToolAuthType } from "@/generated/prisma/client"

// --- Agent Actions ---

const createAgentSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    systemPrompt: z.string().min(1, "System prompt is required"),
    provider: z.nativeEnum(LLMProvider),
    model: z.string().min(1, "Model is required"),
    workspaceId: z.string().min(1, "Workspace ID is required"),
    avatarUrl: z.string().optional(),
    // theme fields
    primaryColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    buttonColor: z.string().optional(),
    buttonTextColor: z.string().optional(),

    // advanced fields
    welcomeMessage: z.string().optional(),
    mood: z.string().optional(),
    fontFamily: z.string().optional(),
    supportEmail: z.string().optional(),
    logoUrl: z.string().optional(),
    contactLink: z.string().optional(),
    suggestions: z.string().optional(), // Store as comma separated string or parse to array
})

export async function createAgent(formData: FormData) {
    const rawData = {
        name: formData.get("name"),
        description: formData.get("description"),
        systemPrompt: formData.get("systemPrompt"),
        provider: formData.get("provider"),
        model: formData.get("model"),
        workspaceId: formData.get("workspaceId"),
        avatarUrl: formData.get("avatarUrl") || undefined,
        primaryColor: formData.get("primaryColor") || undefined,
        backgroundColor: formData.get("backgroundColor") || undefined,
        textColor: formData.get("textColor") || undefined,
        buttonColor: formData.get("buttonColor") || undefined,
        buttonTextColor: formData.get("buttonTextColor") || undefined,
        welcomeMessage: formData.get("welcomeMessage") || undefined,
        mood: formData.get("mood") || undefined,
        fontFamily: formData.get("fontFamily") || undefined,
        supportEmail: formData.get("supportEmail") || undefined,
        logoUrl: formData.get("logoUrl") || undefined,
        contactLink: formData.get("contactLink") || undefined,
        suggestions: formData.get("suggestions") || undefined,
    }

    const result = createAgentSchema.safeParse(rawData)

    if (!result.success) {
        return { error: result.error.flatten().fieldErrors }
    }

    try {
        const {
            workspaceId,
            primaryColor,
            backgroundColor,
            textColor,
            buttonColor,
            buttonTextColor,
            welcomeMessage,
            mood,
            fontFamily,
            supportEmail,
            logoUrl,
            contactLink,
            suggestions,
            ...data
        } = result.data

        // Check limits
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { maxAgents: true }
        })

        if (workspace) {
            const count = await prisma.agent.count({ where: { workspaceId } })
            if (count >= workspace.maxAgents) {
                return { error: "Agent limit reached for this workspace" }
            }
        }

        // Build theme config
        const themeConfig: Record<string, any> = {}
        if (primaryColor) themeConfig.primaryColor = primaryColor
        if (backgroundColor) themeConfig.backgroundColor = backgroundColor
        if (textColor) themeConfig.textColor = textColor
        if (buttonColor) themeConfig.buttonColor = buttonColor
        if (buttonTextColor) themeConfig.buttonTextColor = buttonTextColor
        if (welcomeMessage) themeConfig.welcomeMessage = welcomeMessage
        if (mood) themeConfig.mood = mood
        if (fontFamily) themeConfig.fontFamily = fontFamily
        if (supportEmail) themeConfig.supportEmail = supportEmail
        if (logoUrl) themeConfig.logoUrl = logoUrl
        if (contactLink) themeConfig.contactLink = contactLink
        if (suggestions) {
            themeConfig.suggestions = suggestions.split(',').map(s => s.trim()).filter(s => s.length > 0)
        }

        await prisma.agent.create({
            data: {
                workspaceId,
                ...data,
                theme: Object.keys(themeConfig).length > 0 ? themeConfig : undefined,
                // Defaults
                temperature: 0.7,
                maxTokens: 2048,
                memoryEnabled: true,
                contextWindow: 10,
                uiMode: "EMBEDDED",
            },
        })

        revalidatePath("/")
        return { success: true }
    } catch (error) {
        console.error("Failed to create agent:", error)
        return { error: "Failed to create agent" }
    }
}

export async function updateAgent(id: string, formData: FormData) {
    const rawData = {
        name: formData.get("name"),
        description: formData.get("description"),
        systemPrompt: formData.get("systemPrompt"),
        provider: formData.get("provider"),
        model: formData.get("model"),
        workspaceId: formData.get("workspaceId"),
        avatarUrl: formData.get("avatarUrl") || undefined,
        primaryColor: formData.get("primaryColor") || undefined,
        backgroundColor: formData.get("backgroundColor") || undefined,
        textColor: formData.get("textColor") || undefined,
        buttonColor: formData.get("buttonColor") || undefined,
        buttonTextColor: formData.get("buttonTextColor") || undefined,
        welcomeMessage: formData.get("welcomeMessage") || undefined,
        mood: formData.get("mood") || undefined,
        fontFamily: formData.get("fontFamily") || undefined,
        supportEmail: formData.get("supportEmail") || undefined,
        logoUrl: formData.get("logoUrl") || undefined,
        contactLink: formData.get("contactLink") || undefined,
        suggestions: formData.get("suggestions") || undefined,
    }

    const result = createAgentSchema.safeParse(rawData)

    if (!result.success) {
        return { error: result.error.flatten().fieldErrors }
    }

    try {
        const {
            workspaceId,
            primaryColor,
            backgroundColor,
            textColor,
            buttonColor,
            buttonTextColor,
            welcomeMessage,
            mood,
            fontFamily,
            supportEmail,
            logoUrl,
            contactLink,
            suggestions,
            ...data
        } = result.data

        // Build theme config
        const themeConfig: Record<string, any> = {}
        if (primaryColor) themeConfig.primaryColor = primaryColor
        if (backgroundColor) themeConfig.backgroundColor = backgroundColor
        if (textColor) themeConfig.textColor = textColor
        if (buttonColor) themeConfig.buttonColor = buttonColor
        if (buttonTextColor) themeConfig.buttonTextColor = buttonTextColor
        if (welcomeMessage) themeConfig.welcomeMessage = welcomeMessage
        if (mood) themeConfig.mood = mood
        if (fontFamily) themeConfig.fontFamily = fontFamily
        if (supportEmail) themeConfig.supportEmail = supportEmail
        if (logoUrl) themeConfig.logoUrl = logoUrl
        if (contactLink) themeConfig.contactLink = contactLink
        if (suggestions) {
            themeConfig.suggestions = suggestions.split(',').map(s => s.trim()).filter(s => s.length > 0)
        }

        await prisma.agent.update({
            where: { id, workspaceId },
            data: {
                ...data,
                theme: Object.keys(themeConfig).length > 0 ? themeConfig : undefined,
            },
        })

        revalidatePath(`/agents/${id}`)
        revalidatePath("/agents")
        return { success: true }
    } catch (error) {
        console.error("Failed to update agent:", error)
        return { error: "Failed to update agent" }
    }
}

// --- Tool Actions ---

const createToolSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    type: z.nativeEnum(ToolType),
    agentId: z.string().min(1, "Agent ID is required"),
    method: z.string().optional().nullable(),
    endpoint: z.string().optional().nullable(),
    authType: z.string().optional().nullable(),
    authToken: z.string().optional().nullable(),
    apiKeyKey: z.string().optional().nullable(),
    apiKeyValue: z.string().optional().nullable(),
    apiKeyLocation: z.string().optional().nullable(),
    basicUsername: z.string().optional().nullable(),
    basicPassword: z.string().optional().nullable(),
})

export async function createTool(formData: FormData) {
    const rawData = {
        name: formData.get("name"),
        description: formData.get("description"),
        type: formData.get("type"),
        agentId: formData.get("agentId"),
        method: formData.get("method"),
        endpoint: formData.get("endpoint"),
        authType: formData.get("authType"),
        authToken: formData.get("authToken"),
        apiKeyKey: formData.get("apiKeyKey"),
        apiKeyValue: formData.get("apiKeyValue"),
        apiKeyLocation: formData.get("apiKeyLocation"),
        basicUsername: formData.get("basicUsername"),
        basicPassword: formData.get("basicPassword"),
    }

    const result = createToolSchema.safeParse(rawData)

    if (!result.success) {
        return { error: result.error.flatten().fieldErrors }
    }

    try {
        const {
            agentId,
            method,
            endpoint,
            authType,
            authToken,
            apiKeyKey,
            apiKeyValue,
            apiKeyLocation,
            basicUsername,
            basicPassword,
            ...data
        } = result.data

        // Construct authConfig based on authType
        let authConfig = undefined
        if (authType === 'BEARER' && authToken) {
            authConfig = { token: authToken }
        } else if (authType === 'API_KEY' && apiKeyKey && apiKeyValue) {
            authConfig = { key: apiKeyKey, value: apiKeyValue, location: apiKeyLocation }
        } else if (authType === 'BASIC' && basicUsername && basicPassword) {
            authConfig = { username: basicUsername, password: basicPassword }
        }

        await prisma.tool.create({
            data: {
                agentId,
                ...data,
                method: method as any, // Cast to HttpMethod
                endpoint: endpoint || undefined,
                authType: authType as ToolAuthType || ToolAuthType.NONE,
                authConfig: authConfig ? authConfig : undefined,
                // Defaults
                inputSchema: {},
            },
        })

        revalidatePath("/")
        return { success: true }
    } catch (error) {
        console.error("Failed to create tool:", error)
        return { error: "Failed to create tool" }
    }
}
// --- API Key Actions ---

export async function createApiKey(workspaceId: string, name: string) {
    if (!workspaceId || !name) {
        return { error: "Workspace ID and Name are required" }
    }

    try {
        // Generate a secure random key
        // Format: vk_<random_chars>
        const keyPart = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
        const key = `vk_${keyPart}`;

        // In a real app, we should hash this before storing.
        // For this MVP, we are storing it directly as `key` is marked unique and used for lookup.
        // However, best practice is to store hash. 
        // The schema has `key` and `hashedKey`. 
        // Let's assume `key` in DB stores the hash, and we return the raw key ONCE.
        // But wait, the schema has BOTH. `key` @unique and `hashedKey` @unique.
        // This implies `key` might be a prefix or open, and `hashedKey` is the secret?
        // Actually, typically you store (prefix, hash).
        // Let's store the full key in `key` for now to match the lookup logic in `route.ts`.
        // Update: `route.ts` looks up by `key`. So we must store the full key in `key`.
        // This is not secure for production (storing plain text secrets), but matches current implementation.
        // I will stick to the current schema usage: store `key` as the actual key.

        await prisma.apiKey.create({
            data: {
                workspaceId,
                name,
                key: key,
                hashedKey: key, // Redundant but required by schema if we don't change it.
            }
        })

        revalidatePath("/settings")
        return { success: true, key: key }
    } catch (error) {
        console.error("Failed to create API key:", error)
        return { error: "Failed to create API key" }
    }
}

export async function getApiKeys(workspaceId: string) {
    if (!workspaceId) return { error: "Workspace ID required" }

    try {
        const keys = await prisma.apiKey.findMany({
            where: { workspaceId, isActive: true },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                key: true,
                lastUsedAt: true,
                createdAt: true,
            }
        })

        // Mask the keys for display
        const maskedKeys = keys.map(k => ({
            ...k,
            displayKey: `${k.key.substring(0, 5)}...${k.key.substring(k.key.length - 4)}`
        }))

        return { success: true, keys: maskedKeys }
    } catch (error) {
        console.error("Failed to fetch API keys:", error)
        return { error: "Failed to fetch API keys" }
    }
}

export async function revokeApiKey(keyId: string) {
    if (!keyId) return { error: "Key ID required" }

    try {
        await prisma.apiKey.update({
            where: { id: keyId },
            data: { isActive: false }
        })
        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        console.error("Failed to revoke API key:", error)
        return { error: "Failed to revoke API key" }
    }
}

// --- Provider Key Actions ---

const { createEncryptionService } = await import('@/lib/security/encryption')

export async function getProviderKeys(workspaceId: string) {
    if (!workspaceId) return { error: "Workspace ID required" }

    try {
        const keys = await prisma.providerKey.findMany({
            where: { workspaceId, isActive: true },
            select: {
                id: true,
                provider: true,
                keyHint: true,
                isDefault: true,
                createdAt: true,
                updatedAt: true,
            }
        })

        return { success: true, keys }
    } catch (error) {
        console.error("Failed to fetch provider keys:", error)
        return { error: "Failed to fetch provider keys" }
    }
}

export async function setProviderKey(workspaceId: string, provider: LLMProvider, apiKey: string, makeDefault: boolean = false) {
    if (!workspaceId || !provider || !apiKey) {
        return { error: "Workspace ID, provider, and API key are required" }
    }

    try {
        const encryption = createEncryptionService()
        const encryptedKey = encryption.encrypt(apiKey)
        const keyHint = encryption.getKeyHint(encryptedKey)

        // If making this the default, unset any existing default for this provider
        if (makeDefault) {
            await prisma.providerKey.updateMany({
                where: { workspaceId, provider, isDefault: true },
                data: { isDefault: false }
            })
        }

        // Check if a key for this provider already exists
        const existingKey = await prisma.providerKey.findFirst({
            where: { workspaceId, provider, isActive: true }
        })

        if (existingKey) {
            // Update existing key
            await prisma.providerKey.update({
                where: { id: existingKey.id },
                data: {
                    encryptedKey,
                    keyHint,
                    isDefault: makeDefault || existingKey.isDefault,
                }
            })
        } else {
            // Create new key
            await prisma.providerKey.create({
                data: {
                    workspaceId,
                    provider,
                    encryptedKey,
                    keyHint,
                    isDefault: makeDefault,
                }
            })
        }

        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        console.error("Failed to set provider key:", error)
        return { error: "Failed to set provider key" }
    }
}

export async function deleteProviderKey(keyId: string) {
    if (!keyId) return { error: "Key ID required" }

    try {
        await prisma.providerKey.update({
            where: { id: keyId },
            data: { isActive: false }
        })
        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete provider key:", error)
        return { error: "Failed to delete provider key" }
    }
}

export async function getDecryptedProviderKey(workspaceId: string, provider: LLMProvider): Promise<string | null> {
    try {
        const key = await prisma.providerKey.findFirst({
            where: { workspaceId, provider, isActive: true },
            select: { encryptedKey: true }
        })

        if (!key) return null

        const encryption = createEncryptionService()
        return encryption.decrypt(key.encryptedKey)
    } catch (error) {
        console.error("Failed to get decrypted provider key:", error)
        return null
    }
}
