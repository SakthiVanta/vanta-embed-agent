'use client'

import React from "react"

export function ActivityItem({
    title,
    time,
    agent,
}: {
    title: string
    time: string
    agent: string
}) {
    return (
        <div className="flex items-start gap-3 text-sm">
            <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500" />
            <div className="flex-1">
                <p className="font-medium">{title}</p>
                <p className="text-muted-foreground text-xs">
                    {agent} • {time}
                </p>
            </div>
        </div>
    )
}
