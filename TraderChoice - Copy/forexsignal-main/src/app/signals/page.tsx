'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type PublicSignal = {
  id: string;
  title: string;
  description: string;
  type: 'free' | 'premium';
  tradeType?: 'buy' | 'sell';
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  createdAt?: any;
};

export default function SignalsPage() {
  const [signals, setSignals] = useState<PublicSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth() as any;
  const isPro = !!(user && (user.role === 'pro' || user.subscription === 'premium'));

  useEffect(() => {
    const load = async () => {
      try {
        const base = (globalThis as any)?.process?.env?.NEXT_PUBLIC_API_BASE_URL || 'https://traderchoice.asia/api';
        const res = await fetch(`${base}/signals.php?action=public_all`, { credentials: 'include' });
        const data = await res.json();
        setSignals(Array.isArray(data.signals) ? data.signals : []);
      } catch {
        setSignals([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section id="signals" className="py-16 md:py-24 bg-card pt-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold">All Trading Signals</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Browse all available signals. Admin can add or modify; public can view.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
             [...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)
          ) : signals.length > 0 ? (
            signals.map((signal) => {
              const isPremium = signal.type === 'premium';
              const locked = isPremium && !isPro;
              const risk = (signal as any).riskLevel || 'medium';
              const riskEmoji = risk === 'high' ? '🔴' : risk === 'low' ? '🟢' : '🟠';
              const accuracy = (signal as any).accuracyPercent != null ? Number((signal as any).accuracyPercent).toFixed(2) : null;
              return (
              <Card key={signal.id} className={`relative flex flex-col overflow-hidden rounded-xl shadow-sm ${locked ? 'locked premium-locked' : ''}`}>
                <div className="signal-content">
                  <CardHeader>
                    <div className="flex justify-between items-center gap-2">
                      <CardTitle className="font-headline flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">Trade #{(signal as any).tradeNumber ?? '—'}</span>
                        <span>{signal.title}</span>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={signal.type === 'premium' ? 'default' : 'secondary'} className="capitalize">{signal.type}</Badge>
                        <span className={`capitalize px-2 py-1 rounded-md ${ (signal.tradeType || 'buy') === 'buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{signal.tradeType || 'buy'}</span>
                      </div>
                    </div>
                    <CardDescription className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1"><span>{riskEmoji}</span><span className="capitalize">{risk}</span> Risk</span>
                      {accuracy && <span className="text-muted-foreground">({accuracy}% Accuracy)</span>}
                      {signal.createdAt && (
                        <span className="ml-auto text-xs">
                          {typeof (signal as any).createdAt?.toDate === 'function'
                            ? format((signal as any).createdAt.toDate(), 'PPP p')
                            : format(new Date(((signal as any).createdAt || 0) * 1000), 'PPP p')}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                    <p className="text-sm text-muted-foreground">{signal.description}</p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm font-bold text-green-500">Entry</p>
                        <p className="font-mono">{signal.entryPrice}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-red-500">SL</p>
                        <p className="font-mono">{signal.stopLoss}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-500">TP</p>
                        <p className="font-mono">{(signal as any).tp1 ?? signal.takeProfit} {((signal as any).tp2 || (signal as any).tp3) ? '• ' + ((signal as any).tp2 ?? '—') + ' • ' + ((signal as any).tp3 ?? '—') : ''}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>For optimal results, trade before 8:00 AM or after 11:00 PM. Outside these hours, wait for confirmation signals.</p>
                    </div>
                  </CardContent>
                </div>
                {locked && (
                  <a href="/pricing" className="lock-overlay premium-overlay absolute inset-0 z-10 flex flex-col items-center justify-center text-white bg-black/55">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 8V6a3 3 0 016 0v3H9z"/></svg>
                    <span className="text-sm font-medium">Upgrade to get this premium signal</span>
                  </a>
                )}
              </Card>
            );})
          ) : (
             <div className="md:col-span-2 lg:col-span-3">
                <Card className="flex flex-col items-center justify-center p-8 text-center">
                    <CardHeader>
                        <CardTitle>No Signals Available</CardTitle>
                        <CardDescription>There are no signals available right now. Please check back later!</CardDescription>
                    </CardHeader>
                </Card>
            </div>
          )}
        </div>
        {/* Apply blur only to content of locked cards */}
        <style jsx global>{`
          .locked > .signal-content { filter: blur(6px); pointer-events: none; }
          .lock-overlay { background: rgba(0,0,0,0.55); }
          /* Optional class names from spec */
          .premium-locked { position: relative; }
          .premium-locked > .signal-content { filter: blur(4px); pointer-events: none; }
          .premium-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); color: #fff; font-size: 1rem; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
          .premium-overlay::before { content: '🔒 Upgrade to view this premium signal'; }
        `}</style>
      </div>
    </section>
  );
}
