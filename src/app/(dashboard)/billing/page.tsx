'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Check, 
  X, 
  CreditCard, 
  Download, 
  AlertCircle,
  Loader2,
  Calendar,
  Receipt
} from 'lucide-react'
import { SUBSCRIPTION_TIERS } from '@/lib/stripe'
import { toast } from 'sonner'

interface SubscriptionData {
  tier: string
  status: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  stripeCustomerId: string | null
}

interface Invoice {
  id: string
  amountPaid: number
  currency: string
  status: string
  createdAt: string
  pdfUrl: string | null
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isResuming, setIsResuming] = useState(false)

  useEffect(() => {
    fetchBillingData()
  }, [])

  const fetchBillingData = async () => {
    try {
      const [subRes, invoicesRes] = await Promise.all([
        fetch('/api/billing/subscription'),
        fetch('/api/billing/invoices'),
      ])

      if (subRes.ok) {
        const subData = await subRes.json()
        setSubscription(subData)
      }

      if (invoicesRes.ok) {
        const invData = await invoicesRes.json()
        setInvoices(invData.invoices || [])
      }
    } catch (error) {
      console.error('Error fetching billing data:', error)
      toast.error('Failed to load billing information')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      const response = await fetch('/api/billing/cancel', { method: 'POST' })
      if (response.ok) {
        toast.success('Subscription will cancel at period end')
        fetchBillingData()
      } else {
        throw new Error('Failed to cancel')
      }
    } catch (error) {
      toast.error('Failed to cancel subscription')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleResume = async () => {
    setIsResuming(true)
    try {
      const response = await fetch('/api/billing/resume', { method: 'POST' })
      if (response.ok) {
        toast.success('Subscription resumed successfully')
        fetchBillingData()
      } else {
        throw new Error('Failed to resume')
      }
    } catch (error) {
      toast.error('Failed to resume subscription')
    } finally {
      setIsResuming(false)
    }
  }

  const handlePortal = async () => {
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      toast.error('Failed to open billing portal')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  const tier = subscription?.tier || 'FREE'
  const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS] || SUBSCRIPTION_TIERS.FREE
  const isPaid = tier !== 'FREE'
  const isActive = subscription?.status === 'ACTIVE'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Billing & Subscription</h2>
        <p className="text-sm text-muted-foreground">
          Manage your subscription, payment methods, and billing history
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Current Plan</CardTitle>
              <CardDescription>Your active subscription details</CardDescription>
            </div>
            <Badge variant={isPaid ? 'default' : 'secondary'} className={isPaid ? 'bg-emerald-600' : ''}>
              {tierConfig.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">${tierConfig.price}</span>
            {tierConfig.price > 0 && <span className="text-muted-foreground">/month</span>}
          </div>
          
          {isPaid && subscription && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  {subscription.cancelAtPeriodEnd ? (
                    <span className="text-amber-600">Cancels on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                  ) : (
                    <span>Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="capitalize">{subscription.status.toLowerCase()}</span>
              </div>
            </div>
          )}

          <Separator />

          <div>
            <h4 className="font-medium mb-2 text-sm">Plan Features</h4>
            <ul className="space-y-1.5">
              {tierConfig.features.map((feature, idx) => (
                <li key={idx} className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
            {isPaid ? (
              <>
                {subscription?.cancelAtPeriodEnd ? (
                  <Button 
                    variant="outline" 
                    onClick={handleResume}
                    disabled={isResuming}
                  >
                    {isResuming && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                    Resume Subscription
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={isCancelling}
                  >
                    {isCancelling && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                    Cancel Subscription
                  </Button>
                )}
                <Button variant="outline" onClick={handlePortal}>
                  <CreditCard className="mr-2 w-4 h-4" />
                  Manage Payment
                </Button>
              </>
            ) : (
              <Link href="/pricing">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Upgrade Plan
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Overview */}
      {isPaid && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Usage This Period</CardTitle>
            <CardDescription>Your current billing cycle usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UsageBar 
              label="AI Agents" 
              used={1} 
              total={tierConfig.maxAgents} 
            />
            <UsageBar 
              label="Tools" 
              used={2} 
              total={tierConfig.maxTools} 
            />
            <UsageBar 
              label="Tokens" 
              used={45000} 
              total={tierConfig.monthlyTokenQuota} 
              format={(n) => `${(n / 1000).toFixed(0)}K`}
            />
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Billing History</CardTitle>
          <CardDescription>Download past invoices and receipts</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div 
                  key={invoice.id} 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        ${(invoice.amountPaid / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={invoice.status === 'PAID' ? 'default' : 'secondary'} className="text-xs">
                      {invoice.status}
                    </Badge>
                    {invoice.pdfUrl && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                        <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function UsageBar({ label, used, total, format = (n: number) => n.toString() }: { 
  label: string
  used: number
  total: number
  format?: (n: number) => string
}) {
  const percentage = Math.min((used / total) * 100, 100)
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {format(used)} / {format(total)}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-emerald-600 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
