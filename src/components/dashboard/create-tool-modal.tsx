'use client'

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Zap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createTool } from "@/app/actions"
import { HTTP_METHODS } from "@/lib/constants"

interface Agent {
    id: string
    name: string
}

export function CreateToolModal({ agents, children }: { agents: Agent[], children?: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [toolType, setToolType] = useState<string>("REST_API")
    const [authType, setAuthType] = useState<string>("NONE")

    async function clientAction(formData: FormData) {
        const result = await createTool(formData)
        if (result?.error) {
            alert(typeof result.error === 'string' ? result.error : "Failed to create tool")
        } else {
            setOpen(false)
            // Reset state
            setToolType("REST_API")
            setAuthType("NONE")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="w-full justify-start gap-2" variant="outline">
                        <Zap className="w-4 h-4" />
                        Add Tool
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Tool</DialogTitle>
                    <DialogDescription>
                        Create a new tool for your agents.
                    </DialogDescription>
                </DialogHeader>
                <form action={clientAction} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="agentId">Assign to Agent</Label>
                        <Select name="agentId" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an agent" />
                            </SelectTrigger>
                            <SelectContent>
                                {agents.length === 0 ? (
                                    <SelectItem value="none" disabled>No agents found</SelectItem>
                                ) : (
                                    agents.map(agent => (
                                        <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" placeholder="web_search" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" name="description" placeholder="Searches the web for information..." required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="type">Type</Label>
                        <Select name="type" value={toolType} onValueChange={setToolType} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="REST_API">REST API</SelectItem>
                                <SelectItem value="CLIENT_BRIDGE">Client Bridge</SelectItem>
                                <SelectItem value="CUSTOM_CODE">Custom Code</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {toolType === "REST_API" && (
                        <div className="space-y-4 border-t pt-4 mt-2">
                            <h4 className="font-medium text-sm text-foreground">API Configuration</h4>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-1 grid gap-2">
                                    <Label htmlFor="method">Method</Label>
                                    <Select name="method" defaultValue="GET" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {HTTP_METHODS.map(method => (
                                                <SelectItem key={method} value={method}>{method}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-3 grid gap-2">
                                    <Label htmlFor="endpoint">Endpoint URL</Label>
                                    <Input id="endpoint" name="endpoint" placeholder="https://api.example.com/v1/resource" required />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="authType">Authentication</Label>
                                <Select name="authType" value={authType} onValueChange={setAuthType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Auth Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NONE">None</SelectItem>
                                        <SelectItem value="BEARER">Bearer Token</SelectItem>
                                        <SelectItem value="API_KEY">API Key</SelectItem>
                                        <SelectItem value="BASIC">Basic Auth</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {authType === "BEARER" && (
                                <div className="grid gap-2">
                                    <Label htmlFor="authToken">Bearer Token</Label>
                                    <Input id="authToken" name="authToken" type="password" placeholder="sk-..." required />
                                </div>
                            )}

                            {authType === "API_KEY" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="apiKeyKey">Key Name</Label>
                                        <Input id="apiKeyKey" name="apiKeyKey" placeholder="X-API-Key" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="apiKeyValue">Key Value</Label>
                                        <Input id="apiKeyValue" name="apiKeyValue" type="password" placeholder="Key value" required />
                                    </div>
                                    <div className="col-span-2 grid gap-2">
                                        <Label htmlFor="apiKeyLocation">Location</Label>
                                        <Select name="apiKeyLocation" defaultValue="HEADER">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Location" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="HEADER">Header</SelectItem>
                                                <SelectItem value="QUERY">Query Params</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {authType === "BASIC" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="basicUsername">Username</Label>
                                        <Input id="basicUsername" name="basicUsername" placeholder="Username" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="basicPassword">Password</Label>
                                        <Input id="basicPassword" name="basicPassword" type="password" placeholder="Password" required />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Tool
        </Button>
    )
}
