'use client'

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { createAgent } from "@/app/actions"
import { toast } from "sonner" // Assuming sonner is installed, if not we'll use simple alert or verify

export function CreateAgentModal({ workspaceId, children }: { workspaceId: string, children?: React.ReactNode }) {
    const [open, setOpen] = useState(false)

    async function clientAction(formData: FormData) {
        const result = await createAgent(formData)
        if (result?.error) {
            // Simple error handling for now
            alert(typeof result.error === 'string' ? result.error : "Failed to create agent")
        } else {
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="w-full justify-start gap-2" variant="outline">
                        <Plus className="w-4 h-4" />
                        Create New Agent
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Agent</DialogTitle>
                    <DialogDescription>
                        Configure your new AI agent.
                    </DialogDescription>
                </DialogHeader>
                <form action={clientAction} className="grid gap-4 py-4">
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" placeholder="Customer Support Bot" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" name="description" placeholder="Handles customer inquiries..." />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="systemPrompt">System Prompt</Label>
                        <Textarea
                            id="systemPrompt"
                            name="systemPrompt"
                            placeholder="You are a helpful assistant..."
                            className="resize-none"
                            rows={4}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="provider">Provider</Label>
                            <Select name="provider" defaultValue="OPENAI" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OPENAI">OpenAI</SelectItem>
                                    <SelectItem value="GEMINI">Gemini</SelectItem>
                                    <SelectItem value="GROQ">Groq</SelectItem>
                                    <SelectItem value="OPENROUTER">OpenRouter</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="model">Model</Label>
                            <Input id="model" name="model" placeholder="gpt-4o" defaultValue="gpt-4o" required />
                        </div>
                    </div>
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
            Create Agent
        </Button>
    )
}
