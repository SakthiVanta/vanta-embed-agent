'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Key, Trash2, Eye, EyeOff, Shield, Check, AlertCircle, Lock, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { getProviderKeys, setProviderKey, deleteProviderKey } from '@/app/actions'
import { useWorkspace } from '@/hooks/use-workspace'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LLMProvider } from '@/generated/prisma/client'

interface ProviderKey {
    id: string
    provider: LLMProvider
    keyHint: string
    isDefault: boolean
    createdAt: Date
    updatedAt: Date
}

interface ProviderConfig {
    id: LLMProvider
    name: string
    description: string
    icon: string
    keyPrefix: string
    placeholder: string
    docsUrl: string
}

const PROVIDERS: ProviderConfig[] = [
    {
        id: 'OPENAI',
        name: 'OpenAI',
        description: 'GPT-4, GPT-3.5, and other OpenAI models',
        icon: '🤖',
        keyPrefix: 'sk-',
        placeholder: 'sk-...',
        docsUrl: 'https://platform.openai.com/api-keys'
    },
    {
        id: 'GEMINI',
        name: 'Google Gemini',
        description: 'Gemini Pro and other Google AI models',
        icon: '✨',
        keyPrefix: 'AI',
        placeholder: 'AI...',
        docsUrl: 'https://aistudio.google.com/app/apikey'
    },
    {
        id: 'GROQ',
        name: 'Groq',
        description: 'Fast inference with LLaMA and Mixtral models',
        icon: '⚡',
        keyPrefix: 'gsk_',
        placeholder: 'gsk_...',
        docsUrl: 'https://console.groq.com/keys'
    },
    {
        id: 'OPENROUTER',
        name: 'OpenRouter',
        description: 'Access to multiple LLM providers through one API',
        icon: '🌐',
        keyPrefix: 'sk-or-',
        placeholder: 'sk-or-...',
        docsUrl: 'https://openrouter.ai/keys'
    }
]

export function ProviderKeyManagement() {
    const { workspace } = useWorkspace()
    const [keys, setKeys] = useState<ProviderKey[]>([])
    const [loading, setLoading] = useState(true)
    const [configuringProvider, setConfiguringProvider] = useState<ProviderConfig | null>(null)
    const [apiKey, setApiKey] = useState('')
    const [showKey, setShowKey] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        if (workspace?.id) {
            loadKeys()
        }
    }, [workspace?.id])

    const loadKeys = async () => {
        if (!workspace?.id) return
        setLoading(true)
        const result = await getProviderKeys(workspace.id)
        if (result.success && result.keys) {
            setKeys(result.keys as ProviderKey[])
        } else {
            toast.error('Failed to load provider keys')
        }
        setLoading(false)
    }

    const handleSaveKey = async () => {
        if (!workspace?.id || !configuringProvider || !apiKey.trim()) return

        // Validate key format
        const provider = PROVIDERS.find(p => p.id === configuringProvider.id)
        if (provider && !apiKey.startsWith(provider.keyPrefix) && configuringProvider.id !== 'GEMINI') {
            toast.error(`Invalid API key format. Key should start with "${provider.keyPrefix}"`)
            return
        }

        setSaving(true)
        const result = await setProviderKey(workspace.id, configuringProvider.id, apiKey.trim(), true)
        setSaving(false)

        if (result.success) {
            toast.success(`${configuringProvider.name} API key saved successfully`)
            setConfiguringProvider(null)
            setApiKey('')
            setShowKey(false)
            loadKeys()
        } else {
            toast.error(result.error || 'Failed to save API key')
        }
    }

    const handleDeleteKey = async () => {
        if (!deleteKeyId) return

        setDeleting(true)
        const result = await deleteProviderKey(deleteKeyId)
        setDeleting(false)

        if (result.success) {
            toast.success('API key deleted')
            setDeleteKeyId(null)
            loadKeys()
        } else {
            toast.error('Failed to delete API key')
        }
    }

    const getKeyForProvider = (providerId: LLMProvider): ProviderKey | undefined => {
        return keys.find(k => k.provider === providerId)
    }

    const isKeyConfigured = (providerId: LLMProvider): boolean => {
        return !!getKeyForProvider(providerId)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    API Keys
                </CardTitle>
                <CardDescription>
                    Manage your LLM provider API keys
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Provider Cards */}
                <div className="space-y-3">
                    {PROVIDERS.map((provider) => {
                        const key = getKeyForProvider(provider.id)
                        const configured = isKeyConfigured(provider.id)

                        return (
                            <div
                                key={provider.id}
                                className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{provider.icon}</span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{provider.name}</p>
                                            {configured && (
                                                <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                                    <Check className="w-3 h-3" />
                                                    Configured
                                                </span>
                                            )}
                                            {!configured && (
                                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                    Not configured
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{provider.description}</p>
                                        {key && (
                                            <p className="text-xs text-muted-foreground font-mono mt-1">
                                                Key: {key.keyHint}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {key && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => setDeleteKeyId(key.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant={configured ? "outline" : "default"}
                                        size="sm"
                                        onClick={() => setConfiguringProvider(provider)}
                                    >
                                        {configured ? 'Update' : 'Configure'}
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Security Info */}
                <div className="mt-6 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        API Key Security
                    </h4>
                    <div className="grid gap-3 text-sm">
                        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <Lock className="w-4 h-4 mt-0.5 text-emerald-600" />
                            <div>
                                <p className="font-medium">Encrypted Storage</p>
                                <p className="text-xs text-muted-foreground">
                                    All API keys are encrypted at rest using AES-256 encryption
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <EyeOff className="w-4 h-4 mt-0.5 text-emerald-600" />
                            <div>
                                <p className="font-medium">Never Exposed</p>
                                <p className="text-xs text-muted-foreground">
                                    Only the last 4 characters are shown for identification
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <Globe className="w-4 h-4 mt-0.5 text-emerald-600" />
                            <div>
                                <p className="font-medium">Workspace Isolation</p>
                                <p className="text-xs text-muted-foreground">
                                    Keys are isolated per workspace for security
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>

            {/* Configure Dialog */}
            <Dialog open={!!configuringProvider} onOpenChange={(open) => {
                if (!open) {
                    setConfiguringProvider(null)
                    setApiKey('')
                    setShowKey(false)
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {configuringProvider && (
                                <>
                                    <span className="text-xl">{configuringProvider.icon}</span>
                                    Configure {configuringProvider.name}
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {configuringProvider?.description}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">API Key</Label>
                            <div className="relative">
                                <Input
                                    id="apiKey"
                                    type={showKey ? "text" : "password"}
                                    placeholder={configuringProvider?.placeholder}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setShowKey(!showKey)}
                                >
                                    {showKey ? (
                                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="w-4 h-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Get your API key from{' '}
                                <a
                                    href={configuringProvider?.docsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    {configuringProvider?.name} Dashboard
                                </a>
                            </p>
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                            <p className="text-xs text-amber-800">
                                Your API key is encrypted and stored securely. It will only be used to make requests to {configuringProvider?.name} on your behalf.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setConfiguringProvider(null)
                                setApiKey('')
                                setShowKey(false)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSaveKey} disabled={saving || !apiKey.trim()}>
                            {saving ? 'Saving...' : 'Save Key'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteKeyId} onOpenChange={(open) => {
                if (!open) setDeleteKeyId(null)
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete API Key</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this API key? This action cannot be undone.
                            You will need to re-enter the key to use this provider again.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteKeyId(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteKey}
                            disabled={deleting}
                        >
                            {deleting ? 'Deleting...' : 'Delete Key'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
