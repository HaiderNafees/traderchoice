'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Check, X, Copy } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// Firebase removed; using backend API instead

const tiers = [
  {
    name: 'Free',
    price: '$0',
    priceFrequency: '/ month',
    description: 'Get a feel for our platform with basic access to kickstart your journey.',
    features: ['Access to 2 free signals daily', 'Basic market overview', 'Standard email support', 'Limited historical data'],
    cta: 'Start for Free',
    href: '/signup',
    variant: 'secondary',
  },
  {
    name: 'Pro',
    price: '$60',
    priceFrequency: '/ month',
    description: 'Unlock the full power of Trader Choice for serious traders aiming for consistent results.',
    features: [
      'Unlimited access to all signals',
      'Advanced real-time analytics & insights',
      'Priority email & chat support',
      'Full historical data & backtesting',
      'Access to pro community channels',
    ],
    cta: 'Go Pro',
    href: '/signup',
    variant: 'default',
  },
];

const featureComparison = [
  { feature: 'Daily Signals', free: 'Up to 2 per day', pro: 'Unlimited' },
  { feature: 'Premium Signals', free: <X className="text-red-500" />, pro: <Check className="text-green-500" /> },
  { feature: 'Real-Time Analytics', free: <X className="text-red-500" />, pro: <Check className="text-green-500" /> },
  { feature: 'Community Access', free: <X className="text-red-500" />, pro: <Check className="text-green-500" /> },
  { feature: 'Historical Data', free: 'Last 7 days', pro: 'Unlimited' },
  { feature: 'Support', free: 'Email', pro: 'Priority Email & Chat' },
];

const pricingFaqs = [
    {
        question: "Is there a free trial for the Pro plan?",
        answer: "We do not offer a free trial for the Pro plan. However, our Free plan is available for you to test our platform's core features indefinitely."
    },
    {
        question: "What payment methods do you accept?",
        answer: "We currently accept USDT (TRC-20) for Pro plan subscriptions. This is a manual process where you submit your transaction hash for verification."
    },
    {
        question: "How do I cancel my subscription?",
        answer: "Since subscriptions are handled manually for a 30-day period, there is no recurring charge. Your Pro access will simply expire after 30 days, and you can choose to purchase another 30 days at your convenience."
    },
]

export default function PricingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  
  const walletAddress = "TBYKKvjy7KxexKA4jCn4F9cie88wUDtgUL"; // TRC-20 USDT wallet address
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${walletAddress}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress);
    toast({ title: 'Copied!', description: 'Wallet address copied to clipboard.' });
  };
  
  const handlePaymentVerification = async () => {
    if (!txHash) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a transaction hash.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const base = (globalThis as any)?.process?.env?.NEXT_PUBLIC_API_BASE_URL || 'https://traderchoice.asia/api';
      const res = await fetch(`${base}/payments.php?action=verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success!', description: data.message || 'Payment submitted for verification.' });
        setIsDialogOpen(false);
        setTxHash('');
      } else {
        throw new Error(data.error || 'Verification failed.');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Verification Failed', description: error.message || 'Could not verify your payment.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleUploadProof = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to upload proof.'});
      return;
    }
    if (!proofFile && !txHash) {
      toast({ variant: 'destructive', title: 'Missing Info', description: 'Please select a proof image or enter a TxHash.'});
      return;
    }
    setIsSubmitting(true);
    try {
      const base = (globalThis as any)?.process?.env?.NEXT_PUBLIC_API_BASE_URL || 'https://traderchoice.asia/api';
      const form = new FormData();
      if (txHash) form.append('txHash', txHash);
      if (proofFile) form.append('proof', proofFile);
      const res = await fetch(`${base}/payments.php?action=verify_upload`, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');
      toast({ title: 'Uploaded!', description: data.message || 'Payment proof uploaded. We will verify shortly.' });
      setIsDialogOpen(false);
      setTxHash('');
      setProofFile(null);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Upload Failed', description: e.message || 'Could not upload payment proof.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleGoProClick = () => {
      if (!user) {
          toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to upgrade.'});
          return;
      }
      setIsDialogOpen(true);
  }

  return (
    <div className="bg-card pt-24">
      <div className="container mx-auto px-4 md:px-6 py-16">
        <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold">Choose Your Plan</h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Simple, transparent pricing. Get started for free and upgrade when you're ready.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
          {tiers.map((tier) => (
            <Card key={tier.name} className={`flex flex-col ${tier.variant === 'default' ? 'border-primary shadow-2xl' : ''}`}>
              <CardHeader className="border-b">
                <CardTitle className="font-headline text-3xl">{tier.name}</CardTitle>
                <div className="flex items-baseline pt-2">
                  <span className="text-4xl font-bold tracking-tight">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.priceFrequency}</span>
                </div>
                <CardDescription className="pt-2">{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow pt-6">
                <ul className="space-y-4">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="mt-4">
                {tier.name === 'Pro' ? (
                     <Button className="w-full" variant={tier.variant as any} onClick={handleGoProClick} disabled={user?.role === 'pro' || user?.role === 'admin'}>
                        {user?.role === 'pro' ? 'You are Pro' : 'Go Pro'}
                    </Button>
                ) : (
                    <Button asChild className="w-full" variant={tier.variant as any}>
                        <Link href={tier.href}>{tier.cta}</Link>
                    </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        <section className="mb-20">
          <h2 className="font-headline text-3xl font-bold text-center mb-8">Feature Comparison</h2>
          <Card className="max-w-4xl mx-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Feature</TableHead>
                  <TableHead className="text-center">Free</TableHead>
                  <TableHead className="text-center font-semibold text-primary">Pro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureComparison.map((item) => (
                  <TableRow key={item.feature}>
                    <TableCell className="font-medium">{item.feature}</TableCell>
                    <TableCell className="text-center">{item.free}</TableCell>
                    <TableCell className="text-center font-semibold text-primary">{item.pro}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>

         <section>
            <h2 className="font-headline text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto">
                <Accordion type="single" collapsible className="w-full">
                {pricingFaqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left font-headline text-lg">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
            </div>
        </section>

      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upgrade to Pro - $60/month</DialogTitle>
                    <DialogDescription>
                        To upgrade, send exactly 60 USDT (TRC-20) to the address below. After sending, paste the transaction hash (TxHash) or upload a payment proof image to verify your payment.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">Network: Tron (TRC20)</p>
                    <Image src={qrCodeUrl} alt="USDT TRC20 Wallet QR Code" width={200} height={200} className="mx-auto border p-1 rounded-md" />
                    <div className="relative">
                         <Input type="text" readOnly value={walletAddress} className="pr-10 text-sm text-center" />
                         <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={copyToClipboard}>
                            <Copy className="h-4 w-4" />
                         </Button>
                    </div>
                     <div className="space-y-2 text-left">
                        <Label htmlFor="txHash">Transaction Hash (TxHash)</Label>
                        <Input id="txHash" value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="Paste your transaction hash here" />
                     </div>
                     <div className="space-y-2 text-left">
                         <Label htmlFor="proof">Payment Proof (image)</Label>
                         <Input id="proof" type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
                         <p className="text-xs text-muted-foreground">You can either submit TxHash or upload a clear screenshot/receipt. Both are accepted.</p>
                     </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handlePaymentVerification} disabled={isSubmitting}>
                        {isSubmitting ? 'Verifying...' : 'Verify by TxHash'}
                    </Button>
                    <Button onClick={handleUploadProof} disabled={isSubmitting} variant="secondary">
                        {isSubmitting ? 'Uploading...' : 'Upload Proof'}
                    </Button>
                </DialogFooter>
            </DialogContent>
      </Dialog>

    </div>
  );
}
