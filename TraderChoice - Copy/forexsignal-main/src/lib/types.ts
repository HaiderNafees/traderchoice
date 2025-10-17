// Lightweight timestamp-like shape to keep UI code (toDate()) working post-Firebase removal
export type FireTimestampLike = { toDate: () => Date };

export interface User {
  uid: string;
  email: string | null;
  role: 'free' | 'pro' | 'admin';
  proExpires: FireTimestampLike | null;
  createdAt: FireTimestampLike;
}

export interface Signal {
  id: string;
  title: string;
  description: string;
  type: 'free' | 'premium';
  tradeType?: 'buy' | 'sell';
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  tradeNumber?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  accuracyPercent?: number;
  tp1?: number | null;
  tp2?: number | null;
  tp3?: number | null;
  createdBy: string; // Admin UID
  createdAt: FireTimestampLike;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  txHash: string;
  createdAt: FireTimestampLike;
}
