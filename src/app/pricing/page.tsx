'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Bot, Sparkles, ArrowRight, Building2 } from 'lucide-react'
import { SUBSCRIPTION_TIERS } from '@/lib/stripe'
import { toast } from 'sonner'

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleSubscribe = async (tier: string, priceId: string) => {
    if (tier === 'FREE') {
      window.location.href = '/register'
      return
    }

    setIsLoading(tier)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, priceId }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login?redirect=/pricing'
          return
        }
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong')
    } finally {
      setIsLoading(null)
    }
  }

  const tiers = [
    {
      ...SUBSCRIPTION_TIERS.FREE,
      id: 'FREE',
      cta: 'Get Started Free',
      popular: false,
    },
    {
      ...SUBSCRIPTION_TIERS.STARTER,
      id: 'STARTER',
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      ...SUBSCRIPTION_TIERS.PRO,
      id: 'PRO',
      cta: 'Start Free Trial',
      popular: false,
    },
    {
      ...SUBSCRIPTION_TIERS.ENTERPRISE,
      id: 'ENTERPRISE',
      cta: 'Contact Sales',
      popular: false,
    },
  ]

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
          <div className="flex items-center space-x-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="h-8">Log in</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Pricing Header */}
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 mb-6">
          <Sparkles className="w-3 h-3" />
          <span>14-day free trial on all paid plans</span>
        </div>
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start free and scale as you grow. No hidden fees, no surprises.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {tiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={`relative flex flex-col ${tier.popular ? 'border-emerald-600 shadow-lg' : ''}`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 hover:bg-emerald-700">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                <CardDescription>
                  {tier.id === 'ENTERPRISE' ? 'For large organizations' : `Perfect for ${tier.id === 'FREE' ? 'getting started' : tier.id === 'STARTER' ? 'small teams' : 'growing businesses'}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-4">
                  <span className="text-3xl font-bold">${tier.price}</span>
                  {tier.price > 0 && <span className="text-muted-foreground">/month</span>}
                </div>
                <ul className="space-y-2 text-sm">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="w-4 h-4 text-emerald-600 mr-2 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full ${tier.popular ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                  variant={tier.popular ? 'default' : 'outline'}
                  disabled={isLoading === tier.id}
                  onClick={() => handleSubscribe(tier.id, (tier as any).priceId || '')}
                >
                  {isLoading === tier.id ? (
                    'Loading...'
                  ) : (
                    <>
                      {tier.cta}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Enterprise CTA */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <Building2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Need a Custom Plan?</h3>
              <p className="text-muted-foreground mb-4">
                Contact our sales team for custom pricing, dedicated support, and enterprise features.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline">Contact Sales</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700">Schedule Demo</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <FAQItem 
              question="Can I change plans anytime?"
              answer="Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
            />
            <FAQItem 
              question="What happens if I exceed my limits?"
              answer="We'll notify you when you reach 80% of your limits. You can upgrade or purchase additional capacity."
            />
            <FAQItem 
              question="Is there a free trial?"
              answer="Yes, all paid plans include a 14-day free trial. No credit card required to start."
            />
            <FAQItem 
              question="Do you offer refunds?"
              answer="Yes, we offer a 30-day money-back guarantee if you're not satisfied with our service."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 Vanta. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  return (
    <div>
      <h4 className="font-semibold mb-2">{question}</h4>
      <p className="text-sm text-muted-foreground">{answer}</p>
    </div>
  )
}
