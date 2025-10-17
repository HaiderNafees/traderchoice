
'use client';

export type MarketRate = { price: number; change: number };
export type MarketRates = {
  usdt: MarketRate;
  eur: MarketRate;
  gbp: MarketRate;
  jpy: MarketRate;
  gold: MarketRate;
};

const fallback: MarketRates = {
  usdt: { price: 1.0, change: 0.0 },
  eur: { price: 1.07, change: 0.0 },
  gbp: { price: 1.25, change: 0.0 },
  jpy: { price: 157.0, change: 0.0 },
  gold: { price: 2300.0, change: 0.0 },
};

export async function getMarketRates(): Promise<MarketRates> {
  try {
    const base = (globalThis as any)?.process?.env?.NEXT_PUBLIC_API_BASE_URL || 'https://traderchoice.asia/api';
    const res = await fetch(`${base}/rates.php`, { credentials: 'include' });
    if (!res.ok) return fallback;
    const data = await res.json();
    // Expecting { success?: bool, rates?: { ... } } or { timestamp, data }
    const rates = (data?.rates || data?.data || {}) as Record<string, number>;
    const pick = (k: string, def: number): MarketRate => ({ price: Number(rates[k] ?? def) || def, change: 0 });
    return {
      usdt: pick('USDT', 1.0),
      eur: pick('EUR', 1.07),
      gbp: pick('GBP', 1.25),
      jpy: pick('JPY', 157.0),
      gold: pick('GOLD', 2300.0),
    };
  } catch {
    return fallback;
  }
}
