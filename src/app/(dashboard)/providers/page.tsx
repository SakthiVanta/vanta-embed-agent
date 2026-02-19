'use client'

import { ProviderKeyManagement } from '@/components/dashboard/provider-key-management'

export default function ProvidersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI Providers</h2>
        <p className="text-muted-foreground">
          Configure external AI providers for your agents.
        </p>
      </div>

      <ProviderKeyManagement />
    </div>
  )
}
