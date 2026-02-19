'use client'

import { Card, CardContent } from "@/components/ui/card"
import React from "react"

export function StatCard({
    title,
    value,
    description,
    icon,
}: {
    title: string
    value: string
    description: string
    icon: React.ReactNode
}) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                    </div>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        {icon}
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{description}</p>
            </CardContent>
        </Card>
    )
}
