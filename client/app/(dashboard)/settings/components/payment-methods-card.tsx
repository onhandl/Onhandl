'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, useToast } from '@/components/ui';
import { Button } from '@/components/ui/buttons/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/select';
import { CreditCard, Plus, Trash2, Save, Loader2, CheckCircle2 } from 'lucide-react';

const NETWORKS = ['Ethereum', 'CKB', 'Solana', 'Polygon', 'BNB Chain'];
const ASSETS: Record<string, string[]> = {
    Ethereum: ['ETH', 'USDT', 'USDC'],
    CKB: ['CKB'],
    Solana: ['SOL', 'USDC'],
    Polygon: ['MATIC', 'USDT'],
    'BNB Chain': ['BNB', 'USDT'],
};

interface CryptoMethod { label: string; network: string; walletAddress: string; asset: string }

export function PaymentMethodsCard() {
    const [stripe, setStripe] = useState(false);
    const [cryptoList, setCryptoList] = useState<CryptoMethod[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        apiFetch('/auth/payment-methods').then((d: any) => {
            setStripe(d.stripe?.enabled ?? false);
            setCryptoList(d.crypto || []);
        }).catch(() => {});
    }, []);

    const addCrypto = () => setCryptoList([...cryptoList, { label: '', network: 'Ethereum', walletAddress: '', asset: 'ETH' }]);

    const removeCrypto = (i: number) => setCryptoList(cryptoList.filter((_, idx) => idx !== i));

    const updateCrypto = (i: number, patch: Partial<CryptoMethod>) =>
        setCryptoList(cryptoList.map((c, idx) => idx === i ? { ...c, ...patch } : c));

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            await apiFetch('/auth/payment-methods', {
                method: 'PUT',
                body: JSON.stringify({ stripe: { enabled: stripe }, crypto: cryptoList }),
            });
            setSaved(true);
            toast({ title: 'Payment methods saved' });
            setTimeout(() => setSaved(false), 3000);
        } catch (e: any) {
            toast({ title: 'Failed to save', description: e.message, variant: 'destructive' });
        } finally { setSaving(false); }
    };

    return (
        <Card className="border-border shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="border-b border-border/50 bg-muted/5">
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Saved Payment Methods
                </CardTitle>
                <CardDescription>
                    Save your payment details once — select them when publishing to the marketplace.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
                {/* Stripe */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background">
                    <div>
                        <p className="text-sm font-medium">Stripe Payments</p>
                        <p className="text-xs text-muted-foreground">Accept card payments via your Stripe account.</p>
                    </div>
                    <button
                        onClick={() => setStripe(!stripe)}
                        className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${stripe ? 'bg-primary' : 'bg-muted'}`}
                        role="switch" aria-checked={stripe}
                    >
                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${stripe ? 'translate-x-5' : ''}`} />
                    </button>
                </div>

                {/* Crypto wallets */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Crypto Wallets</p>
                        <Button size="sm" variant="outline" onClick={addCrypto} className="h-7 text-xs gap-1">
                            <Plus className="w-3 h-3" /> Add Wallet
                        </Button>
                    </div>

                    {cryptoList.length === 0 && (
                        <p className="text-xs text-muted-foreground py-2 text-center border border-dashed border-border/50 rounded-xl">
                            No wallets saved yet. Click "Add Wallet" to get started.
                        </p>
                    )}

                    {cryptoList.map((c, i) => (
                        <div key={i} className="rounded-xl border border-border/50 bg-background p-3 space-y-2">
                            <div className="flex items-center gap-2">
                                <Input placeholder="Label (e.g. My CKB Wallet)" value={c.label}
                                    onChange={(e) => updateCrypto(i, { label: e.target.value })}
                                    className="flex-1 h-8 text-xs" />
                                <button onClick={() => removeCrypto(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Select value={c.network} onValueChange={(v) => updateCrypto(i, { network: v, asset: ASSETS[v]?.[0] || '' })}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>{NETWORKS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                                </Select>
                                <Select value={c.asset} onValueChange={(v) => updateCrypto(i, { asset: v })}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>{(ASSETS[c.network] || []).map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <Input placeholder="Wallet address" value={c.walletAddress}
                                onChange={(e) => updateCrypto(i, { walletAddress: e.target.value })}
                                className="h-8 text-xs font-mono" />
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="border-t border-border/50 pt-5 flex justify-end bg-muted/5">
                <Button onClick={handleSave} disabled={saving} className="rounded-full px-6">
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                        : saved ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Saved!</>
                        : <><Save className="mr-2 h-4 w-4" /> Save Methods</>}
                </Button>
            </CardFooter>
        </Card>
    );
}
