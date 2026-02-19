import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Bot, 
  Zap, 
  Shield, 
  Globe, 
  Code, 
  MessageSquare,
  Check,
  ArrowRight,
  Sparkles,
  BarChart3,
  Layers,
  Cpu
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">Vanta</span>
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="#docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="h-8">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-background to-background dark:from-emerald-950/20 dark:via-background dark:to-background" />
        <div className="container relative mx-auto px-4">
          <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
              <Sparkles className="w-3 h-3" />
              <span>Now with GPT-4, Claude & Gemini support</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Build AI Agents That
              <span className="block text-emerald-600">Work for You</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Create, deploy, and manage intelligent AI agents with custom tools, 
              multi-provider LLM support, and enterprise-grade security. 
              From chatbots to automation workflows.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/register">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 h-11 px-8">
                  Start Building Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="outline" size="lg" className="h-11 px-8">
                  View Demo
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              No credit card required. Free plan includes 1 agent & 100K tokens.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-emerald-600">10K+</div>
              <div className="text-sm text-muted-foreground mt-1">Active Agents</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-600">5M+</div>
              <div className="text-sm text-muted-foreground mt-1">Messages Processed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-600">99.9%</div>
              <div className="text-sm text-muted-foreground mt-1">Uptime SLA</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-600">50+</div>
              <div className="text-sm text-muted-foreground mt-1">Integrations</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground">
              Powerful features to build, deploy, and scale AI agents for any use case
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Bot className="w-5 h-5" />}
              title="Multi-Provider LLMs"
              description="Connect OpenAI, Anthropic, Google Gemini, Groq, and more. Switch providers instantly without changing code."
            />
            <FeatureCard 
              icon={<Zap className="w-5 h-5" />}
              title="Custom Tools"
              description="Create REST API tools, client-side functions, or custom code. Your agents can call any service or database."
            />
            <FeatureCard 
              icon={<Code className="w-5 h-5" />}
              title="Embed Anywhere"
              description="One line of JavaScript to embed on any website. Floating widget or inline integration options."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-5 h-5" />}
              title="Analytics & Insights"
              description="Track conversations, token usage, tool calls, and performance metrics in real-time dashboards."
            />
            <FeatureCard 
              icon={<Shield className="w-5 h-5" />}
              title="Enterprise Security"
              description="AES-256 encryption, audit logs, SSO/SAML, role-based access, and domain restrictions."
            />
            <FeatureCard 
              icon={<Layers className="w-5 h-5" />}
              title="Multi-Tenant Workspaces"
              description="Organize agents by team or project. Granular permissions and isolated environments."
            />
            <FeatureCard 
              icon={<Cpu className="w-5 h-5" />}
              title="Streaming Responses"
              description="Real-time streaming for natural conversations. Optimized for low latency and high throughput."
            />
            <FeatureCard 
              icon={<Globe className="w-5 h-5" />}
              title="Global CDN"
              description="Deploy agents to edge locations worldwide. Sub-100ms response times anywhere on Earth."
            />
            <FeatureCard 
              icon={<MessageSquare className="w-5 h-5" />}
              title="Human Handoff"
              description="Seamless escalation to human agents when needed. Full conversation context preserved."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">Build in Minutes, Not Months</h2>
            <p className="text-muted-foreground">
              From idea to deployed AI agent in three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard 
              number="1"
              title="Create Your Agent"
              description="Define personality, system prompts, and choose from 50+ LLM models across multiple providers."
            />
            <StepCard 
              number="2"
              title="Add Custom Tools"
              description="Connect APIs, databases, or custom functions. Your agent can fetch data, take actions, and integrate with your stack."
            />
            <StepCard 
              number="3"
              title="Deploy & Scale"
              description="Embed with one line of code or use our API. Auto-scaling infrastructure handles any traffic."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="relative rounded-2xl bg-emerald-600 p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-emerald-800" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Build Your First AI Agent?
              </h2>
              <p className="text-emerald-100 mb-8">
                Join thousands of developers and companies building the future with AI. 
                Start free, scale as you grow.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register">
                  <Button size="lg" variant="secondary" className="h-11 px-8">
                    Get Started Free
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline" className="h-11 px-8 border-white text-white hover:bg-white hover:text-emerald-600">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">Vanta</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Build, deploy, and scale AI agents with enterprise-grade infrastructure.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground">Integrations</Link></li>
                <li><Link href="#" className="hover:text-foreground">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Documentation</Link></li>
                <li><Link href="#" className="hover:text-foreground">API Reference</Link></li>
                <li><Link href="#" className="hover:text-foreground">Guides</Link></li>
                <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About</Link></li>
                <li><Link href="#" className="hover:text-foreground">Careers</Link></li>
                <li><Link href="#" className="hover:text-foreground">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 Vanta. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">GitHub</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group relative rounded-xl border bg-card p-6 hover:shadow-lg transition-all hover:border-emerald-200">
      <div className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function StepCard({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="relative">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600 text-white font-bold text-lg mb-4">
        {number}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
