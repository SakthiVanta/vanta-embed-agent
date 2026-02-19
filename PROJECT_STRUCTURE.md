# Vanta Platform - Project Structure

This document outlines the optimal folder structure for the Vanta Platform project.

## Directory Structure

```
apps/vanta-platform/
├── prisma/                      # Database schema and migrations
│   ├── schema.prisma           # Prisma schema definition
│   └── migrations/             # Database migrations
│
├── public/                      # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Dashboard route group
│   │   │   ├── layout.tsx      # Dashboard layout with sidebar
│   │   │   ├── page.tsx        # Dashboard home page
│   │   │   ├── agents/         # Agents management
│   │   │   │   └── page.tsx
│   │   │   ├── analytics/      # Analytics views
│   │   │   │   └── page.tsx
│   │   │   ├── providers/      # API key management
│   │   │   │   └── page.tsx
│   │   │   ├── settings/       # Workspace settings
│   │   │   │   └── page.tsx
│   │   │   ├── team/           # Team management
│   │   │   │   └── page.tsx
│   │   │   └── tools/          # Tools management
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                # API routes
│   │   │   ├── agents/         # Agent CRUD operations
│   │   │   │   └── route.ts
│   │   │   ├── auth/           # Authentication
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── logout/
│   │   │   │   │   └── route.ts
│   │   │   │   └── register/
│   │   │   │       └── route.ts
│   │   │   ├── chat/           # Chat API
│   │   │   │   └── route.ts
│   │   │   ├── embed/          # Embed widget API
│   │   │   │   └── route.ts
│   │   │   └── tools/          # Tools CRUD operations
│   │   │       └── route.ts
│   │   │
│   │   ├── embed/              # Embed widget pages
│   │   ├── login/              # Login page
│   │   │   └── page.tsx
│   │   ├── register/           # Registration page
│   │   │   └── page.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css         # Global styles
│   │   └── layout.tsx          # Root layout
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI components (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── switch.tsx
│   │   │   └── textarea.tsx
│   │   │
│   │   ├── dashboard/          # Dashboard-specific components
│   │   │   ├── activity-item.tsx
│   │   │   ├── agent-row.tsx
│   │   │   ├── create-agent-modal.tsx
│   │   │   ├── create-tool-modal.tsx
│   │   │   └── stat-card.tsx
│   │   │
│   │   ├── index.ts            # Component exports
│   │   └── theme-provider.tsx  # Theme context provider
│   │
│   ├── generated/              # Auto-generated code (Prisma)
│   │   └── prisma/
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── index.ts            # Hook exports
│   │   ├── use-agents.ts       # Agent data fetching
│   │   └── use-workspace.ts    # Workspace context
│   │
│   ├── lib/                    # Core library code
│   │   ├── providers/          # LLM provider adapters
│   │   │   ├── base.ts         # Base provider interface
│   │   │   ├── gemini.ts       # Google Gemini adapter
│   │   │   ├── groq.ts         # Groq adapter
│   │   │   ├── index.ts        # Provider factory
│   │   │   ├── openai.ts       # OpenAI adapter
│   │   │   └── openrouter.ts   # OpenRouter adapter
│   │   │
│   │   ├── security/           # Security utilities
│   │   │   ├── auth.ts         # Authentication helpers
│   │   │   └── encryption.ts   # Encryption service
│   │   │
│   │   ├── streaming/          # Streaming utilities
│   │   │   └── controller.ts   # Stream controller
│   │   │
│   │   ├── tenant/             # Multi-tenancy
│   │   │   └── resolver.ts     # Tenant resolution
│   │   │
│   │   ├── tools/              # Tool execution
│   │   │   ├── executor.ts     # Tool executor
│   │   │   └── validators.ts   # Input validation
│   │   │
│   │   ├── api-client.ts       # Centralized API client
│   │   ├── constants.ts        # Application constants
│   │   ├── format.ts           # Formatting utilities
│   │   ├── index.ts            # Lib exports
│   │   ├── prisma.ts           # Prisma client
│   │   ├── rate-limiter.ts     # Rate limiting
│   │   ├── redis.ts            # Redis client
│   │   └── utils.ts            # Utility functions
│   │
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts            # All type exports
│   │
│   ├── middleware.ts           # Next.js middleware
│   └── proxy.ts                # Proxy configuration
│
├── .env                        # Environment variables (gitignored)
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── prisma.config.ts
├── README.md
└── tsconfig.json
```

## Key Improvements Made

### 1. Centralized Types (`src/types/index.ts`)
- All TypeScript interfaces and types in one location
- Eliminates duplicate type definitions across components
- Easy to maintain and update

### 2. Custom Hooks (`src/hooks/`)
- `useWorkspace`: Manages workspace context from localStorage
- `useAgents`: Handles agent data fetching and mutations
- Reusable across components

### 3. Utility Functions (`src/lib/format.ts`)
- `formatTimeAgo`: Consistent time formatting
- `formatDate`, `formatTime`, `formatDateTime`: Date utilities
- `formatBytes`, `formatDuration`: Number formatting
- Removed duplicate `formatTimeAgo` function from components

### 4. Constants (`src/lib/constants.ts`)
- Provider configurations and models
- Tool types and UI modes
- Default configurations
- Rate limits and cache TTLs

### 5. API Client (`src/lib/api-client.ts`)
- Centralized HTTP request handling
- Typed API functions for agents, tools, and auth
- Consistent error handling

### 6. Barrel Exports
- `src/lib/index.ts`: Re-exports all lib modules
- `src/components/index.ts`: Re-exports all components
- `src/hooks/index.ts`: Re-exports all hooks
- Cleaner import statements

### 7. Middleware (`src/middleware.ts`)
- Proper Next.js middleware for authentication
- Handles public/private route protection

## Import Examples

### Before
```typescript
import { StatCard } from '@/components/dashboard/stat-card'
import { ActivityItem } from '@/components/dashboard/activity-item'
import { AgentRow } from '@/components/dashboard/agent-row'
```

### After
```typescript
import { StatCard, ActivityItem, AgentRow } from '@/components'
```

### Before
```typescript
// Inline type definitions in each file
interface Agent {
  id: string
  name: string
  // ...
}
```

### After
```typescript
import type { Agent } from '@/types'
```

## Best Practices

1. **Keep components small and focused**
   - One component per file
   - Extract reusable logic to hooks

2. **Use barrel exports**
   - Export from index files for cleaner imports

3. **Centralize types**
   - All shared types in `src/types/`
   - Component-specific types can remain in component files

4. **Consistent file naming**
   - Components: `kebab-case.tsx`
   - Utilities: `kebab-case.ts`
   - Types: `PascalCase` interfaces

5. **Group related code**
   - Providers together in `lib/providers/`
   - Security utilities in `lib/security/`
   - Dashboard components in `components/dashboard/`
