'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Key, Copy, Trash2, Plus, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { createApiKey, getApiKeys, revokeApiKey } from '@/app/actions'
import { useWorkspace } from '@/hooks/use-workspace'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface ApiKey {
    id: string
    name: string
    displayKey: string
    lastUsedAt: Date | null
    createdAt: Date
}

export function ApiKeyManagement() {
    const { workspace } = useWorkspace()
    const [keys, setKeys] = useState<ApiKey[]>([])
    const [loading, setLoading] = useState(true)
    const [newKeyName, setNewKeyName] = useState('')
    const [createdKey, setCreatedKey] = useState<string | null>(null)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        if (workspace?.id) {
            loadKeys()
        }
    }, [workspace?.id])

    const loadKeys = async () => {
        if (!workspace?.id) return
        const result = await getApiKeys(workspace.id)
        if (result.success) {
            setKeys(result.keys as ApiKey[])
        } else {
            toast.error('Failed to load API keys')
        }
        setLoading(false)
    }

    const handleCreateKey = async () => {
        if (!workspace?.id || !newKeyName.trim()) return

        setCreating(true)
        const result = await createApiKey(workspace.id, newKeyName)
        setCreating(false)

        if (result.success && result.key) {
            setCreatedKey(result.key)
            setNewKeyName('')
            loadKeys()
            toast.success('API Key created successfully')
        } else {
            toast.error(result.error || 'Failed to create API key')
        }
    }

    const handleRevokeKey = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return

        const result = await revokeApiKey(id)
        if (result.success) {
            toast.success('API Key revoked')
            loadKeys()
        } else {
            toast.error('Failed to revoke API key')
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Copied to clipboard')
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    API Keys
                </CardTitle>
                <CardDescription>
                    Manage API keys for accessing the Vanta Platform programmatically.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Active Keys</h3>
                    <Dialog open={isCreateOpen} onOpenChange={(open) => {
                        setIsCreateOpen(open)
                        if (!open) setCreatedKey(null) // Reset shown key on close
                    }}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Create New Key
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create API Key</DialogTitle>
                                <DialogDescription>
                                    Generate a new API key for your applications.
                                </DialogDescription>
                            </DialogHeader>

                            {!createdKey ? (
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="keyName">Key Name</Label>
                                        <Input
                                            id="keyName"
                                            placeholder="e.g. Website Integration"
                                            value={newKeyName}
                                            onChange={(e) => setNewKeyName(e.target.value)}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleCreateKey} disabled={creating || !newKeyName.trim()}>
                                            {creating ? 'Creating...' : 'Create Key'}
                                        </Button>
                                    </DialogFooter>
                                </div>
                            ) : (
                                <div className="space-y-4 py-4">
                                    <div className="p-4 bg-muted rounded-md border border-emerald-200 bg-emerald-50">
                                        <p className="text-sm font-medium text-emerald-800 mb-2">
                                            Successfully created! Copy this key now. You won't see it again.
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 bg-white p-2 rounded border font-mono text-sm break-all">
                                                {createdKey}
                                            </code>
                                            <Button size="icon" variant="ghost" onClick={() => copyToClipboard(createdKey)}>
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={() => setIsCreateOpen(false)}>Done</Button>
                                    </DialogFooter>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Loading keys...</p>
                    ) : keys.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No active API keys found.</p>
                    ) : (
                        keys.map((key) => (
                            <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                                <div>
                                    <p className="font-medium">{key.name}</p>
                                    <p className="text-xs text-muted-foreground font-mono mt-1">{key.displayKey}</p>
                                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                        <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                                        <span>Last Used: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}</span>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleRevokeKey(key.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
