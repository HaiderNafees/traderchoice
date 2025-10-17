
"use client";

import { useEffect, useState } from "react";
import { getMarketRates, type MarketRates } from "@/ai/flows/get-market-rates";
import { DollarSign, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

function RateItem({ name, price, change }: { name: string, price: number | null, change: number | null }) {
    const isUp = change !== null ? change >= 0 : null;
    const changeColor = isUp === null ? 'text-muted-foreground' : isUp ? 'text-green-500' : 'text-red-500';

    return (
        <div className="flex items-center gap-2 text-sm md:text-base px-4">
            <span className="font-semibold text-foreground/80">{name}</span>
            {price !== null ? (
                <span className="font-mono">${price.toFixed(4)}</span>
            ) : (
                <span className="w-16 h-4 bg-muted/50 animate-pulse rounded-md" />
            )}
            {change !== null && isUp !== null && (
                 <div className={cn("flex items-center text-xs", changeColor)}>
                    {isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    <span>{change.toFixed(2)}%</span>
                </div>
            )}
        </div>
    );
}


export function MarketTicker() {
  const [rates, setRates] = useState<MarketRates | null>(null);

  useEffect(() => {
    async function fetchRates() {
      try {
        const result = await getMarketRates();
        setRates(result);
      } catch (error) {
        console.error("Failed to fetch market rates", error);
        setRates({
          usdt: { price: 1.0, change: 0.0 },
          eur: { price: 1.07, change: 0.0 },
          gbp: { price: 1.25, change: 0.0 },
          jpy: { price: 157.0, change: 0.0 },
          gold: { price: 2300.0, change: 0.0 },
        });
      }
    }
    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  const items = [
    <RateItem key="gold1" name="XAU/USD" price={rates?.gold?.price ?? null} change={rates?.gold?.change ?? null} />,
    <RateItem key="eur1" name="EUR/USD" price={rates?.eur?.price ?? null} change={rates?.eur?.change ?? null} />,
    <RateItem key="gbp1" name="GBP/USD" price={rates?.gbp?.price ?? null} change={rates?.gbp?.change ?? null} />,
    <RateItem key="jpy1" name="USD/JPY" price={rates?.jpy?.price ?? null} change={rates?.jpy?.change ?? null} />,
    <RateItem key="usdt1" name="USDT/USD" price={rates?.usdt?.price ?? null} change={rates?.usdt?.change ?? null} />,
  ];

  return (
    <div className="relative h-40 overflow-hidden bg-card border rounded-md">
      <div className="absolute inset-0 p-2">
        <div className="ticker-vertical">
          {[...items, ...items].map((el, i) => (
            <div className="py-2" key={i}>{el}</div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .ticker-vertical {
          display: flex;
          flex-direction: column;
          animation: scrollUp 18s linear infinite;
        }
        @keyframes scrollUp {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
      `}</style>
    </div>
  );
}
