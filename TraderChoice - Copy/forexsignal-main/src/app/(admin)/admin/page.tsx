'use client';

import { useAuth } from '@/contexts/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const signalSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(5, 'Title must be at least 5 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  type: z.enum(['free', 'premium']),
  tradeType: z.enum(['buy', 'sell']).default('buy'),
  entryPrice: z.coerce.number().positive('Entry price must be positive'),
  takeProfit: z.coerce.number().positive('Take profit must be positive'),
  stopLoss: z.coerce.number().positive('Stop loss must be positive'),
  riskLevel: z.enum(['low','medium','high']).default('medium'),
  accuracyPercent: z.coerce.number().min(0).max(100).default(80),
  tp1: z.coerce.number().optional().nullable(),
  tp2: z.coerce.number().optional().nullable(),
  tp3: z.coerce.number().optional().nullable(),
});

type SignalFormValues = z.infer<typeof signalSchema>;

export default function AdminPage() {
  const { user: currentUser, signals, addSignal, updateSignal, deleteSignal, allUsers, payments, signalsLoading, adminLoading, refreshAdminData } = useAuth() as any;
  const { toast } = useToast();
  const API_BASE = ((globalThis as any)?.process?.env?.NEXT_PUBLIC_API_BASE_URL as string | undefined) || 'https://traderchoice.asia/api';
  
  const { register, handleSubmit, control, reset, setValue, formState: { errors, isDirty }, watch } = useForm<SignalFormValues>({
    resolver: zodResolver(signalSchema),
    defaultValues: {
        type: 'free',
        tradeType: 'buy',
        entryPrice: 0,
        takeProfit: 0,
        stopLoss: 0,
        riskLevel: 'medium',
        accuracyPercent: 80,
        tp1: undefined,
        tp2: undefined,
        tp3: undefined,
    }
  });

  const handleUpdatePayment = async (id: string, status: 'verified' | 'rejected') => {
    try {
      const res = await fetch(`${API_BASE}/payments.php?action=admin_update`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': (globalThis as any)?.process?.env?.NEXT_PUBLIC_ADMIN_TOKEN || '' },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update payment');
      toast({ title: 'Payment Updated', description: status === 'verified' ? 'User upgraded to PRO.' : 'Payment marked as rejected.' });
      await refreshAdminData();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'Request failed' });
    }
  }

  const handleSetNormal = async (email: string) => {
    try {
      const res = await fetch(`${API_BASE}/users.php?action=setNormal`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': (globalThis as any)?.process?.env?.NEXT_PUBLIC_ADMIN_TOKEN || '' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to set normal');
      toast({ title: 'Success', description: 'User downgraded to NORMAL successfully' });
      await refreshAdminData();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'Request failed' });
    }
  }

  const handleFormSubmit: SubmitHandler<SignalFormValues> = async (data) => {
    try {
      const { id, ...signalData } = data;
      if (id) {
        await updateSignal(id, signalData);
        toast({ title: 'Success', description: 'Signal updated successfully.' });
      } else {
        await addSignal(signalData);
        toast({ title: 'Success', description: 'Signal added successfully.' });
      }
      reset({ title: '', description: '', type: 'free', tradeType: 'buy', entryPrice: 0, takeProfit: 0, stopLoss: 0, riskLevel: 'medium', accuracyPercent: 80, tp1: undefined, tp2: undefined, tp3: undefined, id: undefined });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };
  
  const handleEdit = (signal: any) => {
    setValue('id', signal.id);
    setValue('title', signal.title);
    setValue('description', signal.description);
    setValue('type', signal.type);
    setValue('tradeType', signal.tradeType || 'buy');
    setValue('entryPrice', signal.entryPrice);
    setValue('takeProfit', signal.takeProfit);
    setValue('stopLoss', signal.stopLoss);
    setValue('riskLevel', signal.riskLevel || 'medium');
    setValue('accuracyPercent', signal.accuracyPercent || 80);
    setValue('tp1', signal.tp1 ?? undefined);
    setValue('tp2', signal.tp2 ?? undefined);
    setValue('tp3', signal.tp3 ?? undefined);
  }

  const handleDelete = async (signalId: string) => {
      if(confirm('Are you sure you want to delete this signal?')) {
          try {
            await deleteSignal(signalId);
            toast({ title: 'Success', description: 'Signal deleted successfully.' });
          } catch(error: any) {
             toast({ variant: 'destructive', title: 'Error', description: error.message });
          }
      }
  }

  const handleSetPro = async (email: string) => {
    try {
      const res = await fetch(`${API_BASE}/users.php?action=setPro`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': (globalThis as any)?.process?.env?.NEXT_PUBLIC_ADMIN_TOKEN || '' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to set pro');
      toast({ title: 'Success', description: 'User upgraded to PRO successfully' });
      await refreshAdminData();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'Request failed' });
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="font-headline text-3xl font-bold">Admin Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Manage Signals</CardTitle>
          <CardDescription>Create, update, or delete trading signals.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <input type="hidden" {...register('id')} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Signal Title</Label>
                    <Input id="title" {...register('title')} placeholder="e.g., EUR/USD Buy" />
                    {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="type">Signal Type</Label>
                    <Controller
                        name="type"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tradeType">Order Direction</Label>
                <Controller
                  name="tradeType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select direction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="riskLevel">Risk Level</Label>
                <Controller
                  name="riskLevel"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select risk level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                    <Label htmlFor="entryPrice">Entry Price</Label>
                    <Input id="entryPrice" type="number" step="0.0001" {...register('entryPrice')} />
                    {errors.entryPrice && <p className="text-destructive text-sm">{errors.entryPrice.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="takeProfit">Take Profit</Label>
                    <Input id="takeProfit" type="number" step="0.0001" {...register('takeProfit')} />
                    {errors.takeProfit && <p className="text-destructive text-sm">{errors.takeProfit.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="stopLoss">Stop Loss</Label>
                    <Input id="stopLoss" type="number" step="0.0001" {...register('stopLoss')} />
                    {errors.stopLoss && <p className="text-destructive text-sm">{errors.stopLoss.message}</p>}
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                 <Label htmlFor="accuracyPercent">Accuracy Percentage</Label>
                 <Input id="accuracyPercent" type="number" step="0.01" min="0" max="100" {...register('accuracyPercent')} />
                 {errors.accuracyPercent && <p className="text-destructive text-sm">{errors.accuracyPercent.message}</p>}
               </div>
               <div className="space-y-2">
                 <Label htmlFor="tp1">TP1</Label>
                 <Input id="tp1" type="number" step="0.0001" {...register('tp1')} />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="tp2">TP2</Label>
                 <Input id="tp2" type="number" step="0.0001" {...register('tp2')} />
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                 <Label htmlFor="tp3">TP3</Label>
                 <Input id="tp3" type="number" step="0.0001" {...register('tp3')} />
               </div>
             </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} placeholder="Signal rationale and analysis" />
              {errors.description && <p className="text-destructive text-sm">{errors.description.message}</p>}
            </div>

            <div className="flex gap-4">
                <Button type="submit">{watch('id') ? 'Update Signal' : 'Create Signal'}</Button>
                {isDirty && <Button variant="outline" type="button" onClick={() => reset({ title: '', description: '', type: 'free', entryPrice: 0, takeProfit: 0, stopLoss: 0, id: undefined })}>Cancel</Button>}
            </div>
            {/* Live preview card */}
            <div className="mt-8">
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Trade #{(signals?.reduce((m:any,s:any)=> Math.max(m, s.tradeNumber||0),0) || 0) + 1}</span>
                    <span className={`capitalize px-2 py-1 rounded-md ${ (watch('tradeType') || 'buy') === 'buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{watch('tradeType')}</span>
                  </CardTitle>
                  <CardDescription>
                    {watch('title') || 'Symbol title'} — <span className="capitalize">{watch('riskLevel')}</span> Risk ({(watch('accuracyPercent')||0).toFixed(2)}% Accuracy)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Entry Price: {watch('entryPrice') || 0}</p>
                  <p>SL: {watch('stopLoss') || 0}</p>
                  <p>TP1: {watch('tp1') ?? '—'}, TP2: {watch('tp2') ?? '—'}, TP3: {watch('tp3') ?? '—'}</p>
                  <p className="text-muted-foreground">For optimal results, trade before 8:00 AM or after 11:00 PM. Outside these hours, wait for confirmation signals.</p>
                </CardContent>
              </Card>
            </div>

          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Signals</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Entry Price</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {signalsLoading ? (
                 [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                 ))
              ) : signals.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center">No signals found.</TableCell></TableRow>
              ) : (
                signals.map(signal => (
                  <TableRow key={signal.id}>
                    <TableCell className="font-medium">{signal.title}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <span className={`capitalize p-2 rounded-md ${signal.type === 'premium' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>{signal.type}</span>
                      <span className={`capitalize px-2 py-1 rounded-md ${ (signal.tradeType || 'buy') === 'buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{signal.tradeType || 'buy'}</span>
                    </TableCell>
                    <TableCell>{signal.entryPrice}</TableCell>
                    <TableCell>{signal.createdAt ? format(signal.createdAt.toDate(), 'PPP p') : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(signal)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(signal.id)}><Trash2 className="h-4 w-4"/></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Pro Expires</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminLoading ? (
                 [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                 ))
              ) : allUsers.length === 0 ? (
                 <TableRow><TableCell colSpan={4} className="text-center">No users found.</TableCell></TableRow>
              ) : (
                allUsers.map(user => (
                  <TableRow key={user.uid}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>{user.proExpires ? format(user.proExpires.toDate(), 'PPP') : 'N/A'}</TableCell>
                    <TableCell>{user.createdAt ? format(user.createdAt.toDate(), 'PPP') : 'N/A'}</TableCell>
                    <TableCell className="text-right flex gap-2 justify-end">
                      {currentUser?.uid !== user.uid && (
                        user.role !== 'pro' ? (
                          <Button size="sm" onClick={() => handleSetPro(user.email)}>
                            Set as PRO
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleSetNormal(user.email)}>
                            Make Normal
                          </Button>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>TX Hash</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminLoading ? (
                [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                 ))
              ) : payments.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center">No payments found.</TableCell></TableRow>
              ) : (
                payments.map(payment => {
                  const user = allUsers.find(u => u.uid === payment.userId);
                  return (
                      <TableRow key={payment.id}>
                        <TableCell>{user?.email || 'Unknown User'}</TableCell>
                        <TableCell className="capitalize">{payment.status || 'pending'}</TableCell>
                        <TableCell><a href={`https://tronscan.org/#/transaction/${payment.txHash}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate w-32 block">{payment.txHash || '—'}</a></TableCell>
                        <TableCell>
                          {payment.proofUrl ? (
                            <a href={payment.proofUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Proof</a>
                          ) : '—'}
                        </TableCell>
                        <TableCell>${payment.amount}</TableCell>
                        <TableCell>{payment.createdAt ? format(payment.createdAt.toDate(), 'PPP p') : 'N/A'}</TableCell>
                        <TableCell className="text-right flex gap-2 justify-end">
                          {payment.status !== 'verified' && (
                            <>
                              <Button size="sm" onClick={() => handleUpdatePayment(payment.id, 'verified')}>Verify</Button>
                              <Button size="sm" variant="outline" onClick={() => handleUpdatePayment(payment.id, 'rejected')}>Reject</Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
