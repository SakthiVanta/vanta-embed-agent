'use client'

import { Button } from "@/components/ui/button"
import Link from "next/link"
import React from "react"

export function AgentRow({
    name,
    status,
    conversations,
    lastActive,
}: {
    name: string
    status: 'active' | 'inactive'
    conversations: string
    lastActive: string
}) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <div>
                    <p className="font-medium text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground">{conversations} conversations</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{lastActive}</span>
                <Link href="/agents">
                    <Button variant="ghost" size="sm">
                        Edit
                    </Button>
                </Link>
            </div>
        </div>
    )
}
