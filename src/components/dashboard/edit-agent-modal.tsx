'use client'

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Loader2, Edit } from "lucide-react"
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
import { updateAgent } from "@/app/actions"
import { toast } from "sonner"

export function EditAgentModal({ agent, workspaceId, children }: { agent: any, workspaceId: string, children?: React.ReactNode }) {
    const [open, setOpen] = useState(false)

    async function clientAction(formData: FormData) {
        const result = await updateAgent(agent.id, formData)
        if (result?.error) {
            toast.error(typeof result.error === 'string' ? result.error : "Failed to update agent")
        } else {
            toast.success("Agent updated successfully!")
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Agent</DialogTitle>
                    <DialogDescription>
                        Update the configuration for {agent.name}.
                    </DialogDescription>
                </DialogHeader>
                <form action={clientAction} className="grid gap-4 py-4">
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" defaultValue={agent.name} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" name="description" defaultValue={agent.description || ''} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="systemPrompt">System Prompt</Label>
                        <Textarea
                            id="systemPrompt"
                            name="systemPrompt"
                            defaultValue={agent.systemPrompt}
                            className="resize-none"
                            rows={4}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="provider">Provider</Label>
                            <Select name="provider" defaultValue={agent.provider} required>
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
                            <Input id="model" name="model" defaultValue={agent.model} required />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="text-sm font-medium">Appearance / Theme (Optional)</h4>

                        <div className="grid gap-2">
                            <Label htmlFor="avatarUrl">Avatar URL</Label>
                            <Input id="avatarUrl" name="avatarUrl" defaultValue={agent.avatarUrl || ''} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 hidden sm:grid sm:grid-cols-4">
                            <div className="grid gap-2">
                                <Label htmlFor="primaryColor">Primary Color</Label>
                                <Input id="primaryColor" name="primaryColor" type="color" defaultValue={agent.theme?.primaryColor || "#00E5FF"} className="w-12 h-10 p-1 cursor-pointer" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="backgroundColor">Background Window</Label>
                                <Input id="backgroundColor" name="backgroundColor" type="color" defaultValue={agent.theme?.backgroundColor || "#0f172a"} className="w-12 h-10 p-1 cursor-pointer" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="textColor">Text Color</Label>
                                <Input id="textColor" name="textColor" type="color" defaultValue={agent.theme?.textColor || "#f8fafc"} className="w-12 h-10 p-1 cursor-pointer" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="buttonColor">Trigger Button Color</Label>
                                <Input id="buttonColor" name="buttonColor" type="color" defaultValue={agent.theme?.buttonColor || "#0055FF"} className="w-12 h-10 p-1 cursor-pointer" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="text-sm font-medium">Advanced / Extras (Optional)</h4>

                        <div className="grid gap-2">
                            <Label htmlFor="welcomeMessage">Welcome Message</Label>
                            <Input id="welcomeMessage" name="welcomeMessage" defaultValue={agent.theme?.welcomeMessage || ''} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="mood">Mood (Prompt Context)</Label>
                                <Input id="mood" name="mood" defaultValue={agent.theme?.mood || ''} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="fontFamily">Font Family</Label>
                                <Input id="fontFamily" name="fontFamily" defaultValue={agent.theme?.fontFamily || ''} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="supportEmail">Support Email</Label>
                                <Input id="supportEmail" name="supportEmail" type="email" defaultValue={agent.theme?.supportEmail || ''} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="logoUrl">Company Logo URL</Label>
                                <Input id="logoUrl" name="logoUrl" type="url" defaultValue={agent.theme?.logoUrl || ''} />
                            </div>
                            <div className="grid gap-2 col-span-2">
                                <Label htmlFor="contactLink">Contact Link</Label>
                                <Input id="contactLink" name="contactLink" type="url" defaultValue={agent.theme?.contactLink || ''} />
                            </div>
                            <div className="grid gap-2 col-span-2">
                                <Label htmlFor="suggestions">Suggestions (Comma separated)</Label>
                                <Input id="suggestions" name="suggestions" defaultValue={Array.isArray(agent.theme?.suggestions) ? agent.theme.suggestions.join(', ') : ''} />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
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
            Save Changes
        </Button>
    )
}
