'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-provider';
import { Button } from '../ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import { MarketTicker } from '@/components/home/market-ticker';

export function SignalsPreview() {
  const { user, signals, signalsLoading } = useAuth() as any;
  const [publicFree, setPublicFree] = useState<any[]>([]);
  const [publicLoading, setPublicLoading] = useState(false);

  // If not logged in, fetch public free signals from PHP endpoint
  useEffect(() => {
    const load = async () => {
      if (user) return;
      try {
        setPublicLoading(true);
        const base = (globalThis as any)?.process?.env?.NEXT_PUBLIC_API_BASE_URL || 'https://traderchoice.asia/api';
        const res = await fetch(`${base}/signals.php?action=public`, { credentials: 'include' });
        const data = await res.json();
        setPublicFree(Array.isArray(data.signals) ? data.signals : []);
      } catch {
        setPublicFree([]);
      } finally {
        setPublicLoading(false);
      }
    };
    load();
  }, [user]);

  // Show only the latest 2 free signals for the preview
  const source = (signals && signals.length > 0) ? signals : publicFree;
  const freeSignals = (source || []).filter((s: any) => s.type === 'free').slice(0, 2);

  return (
    <section id="signals" className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="font-headline text-3xl md:text-4xl font-bold">Today's Free Signals</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Get a glimpse of our premium analysis. Pro members get unlimited access.
          </p>
        </div>

        {/* Two-column layout: left = free signals, right = live rates */}
        <div className="grid gap-8 md:grid-cols-2 max-w-6xl mx-auto items-start">
          <div className="space-y-6">
          {(signalsLoading || publicLoading) ? (
             <>
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
             </>
          ) : freeSignals.length > 0 ? (
            freeSignals.map((signal: any) => (
              <Card key={signal.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="font-headline">{signal.title}</CardTitle>
                    <Badge variant="secondary">{signal.type}</Badge>
                  </div>
                  {signal.createdAt && (
                    <CardDescription>
                      {typeof signal.createdAt?.toDate === 'function'
                        ? format(signal.createdAt.toDate(), 'PPP p')
                        : format(new Date((signal.createdAt || 0) * 1000), 'PPP p')}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <p className="text-sm text-muted-foreground">{signal.description}</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm font-bold text-green-500">Entry</p>
                      <p className="font-mono">{signal.entryPrice}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-500">Take Profit</p>
                      <p className="font-mono">{signal.takeProfit}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-500">Stop Loss</p>
                      <p className="font-mono">{signal.stopLoss}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="flex flex-col items-center justify-center p-8 text-center h-full">
              <CardHeader>
                <CardTitle>No Free Signals Today</CardTitle>
                <CardDescription>Check back later or upgrade to Pro for unlimited access.</CardDescription>
              </CardHeader>
            </Card>
          )}
          </div>

          {/* Right column: Live Forex Rates */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Live Forex Rates</CardTitle>
                <CardDescription>Updated every minute</CardDescription>
              </CardHeader>
              <CardContent>
                <MarketTicker />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Button asChild size="lg" variant="default">
            <Link href="/pricing">
              Unlock All Signals
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
