import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vanta AI - Build AI Agents That Work for You',
  description: 'Create, deploy, and manage intelligent AI agents with custom tools, multi-provider LLM support, and enterprise-grade security.',
  keywords: ['AI agents', 'chatbots', 'LLM', 'OpenAI', 'Claude', 'Gemini', 'automation'],
  authors: [{ name: 'Vanta' }],
  openGraph: {
    title: 'Vanta AI - Build AI Agents That Work for You',
    description: 'Create, deploy, and manage intelligent AI agents with custom tools.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster 
            position="top-right"
            richColors
            closeButton
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
