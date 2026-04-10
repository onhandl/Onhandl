'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/forms/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/select';
import { Store, Loader2, Settings, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import Link from 'next/link';

const CATEGORIES = ['Trading Bot', 'Analytics', 'DeFi Assistant', 'Portfolio Manager', 'Data Feed', 'Custom'];

interface SavedCrypto { label: string; network: string; walletAddress: string; asset: string }

interface MarketplaceSectionProps {
    agentId: string
    agentName: string
    onPublished?: () => void
}

export function MarketplaceSection({ agentId, agentName, onPublished }: MarketplaceSectionProps) {
    const [open, setOpen]               = useState(false);
    const [isPublishing, setPublishing] = useState(false);
    const [category, setCategory]       = useState('Custom');
    const [visibility, setVisibility]   = useState<'public' | 'unlisted'>('public');
    const [pricingType, setPricingType] = useState<'free' | 'paid'>('free');
    const [price, setPrice]             = useState('');
    const [currency, setCurrency]       = useState('USD');
    const [stripeEnabled, setStripe]    = useState(false);
    const [cryptoEnabled, setCrypto]    = useState(false);
    const [selectedCrypto, setSelected] = useState<number | null>(null);
    const [cryptoAmount, setCryptoAmt]  = useState('');
    const [saved, setSaved]             = useState<{ stripe: any; crypto: SavedCrypto[] }>({ stripe: null, crypto: [] });

    useEffect(() => {
        if (!open) return;
        apiFetch('/auth/payment-methods').then((d: any) => setSaved({ stripe: d.stripe, crypto: d.crypto || [] })).catch(() => {});
    }, [open]);

    const wallet = selectedCrypto !== null ? saved.crypto[selectedCrypto] : null;

    const handlePublish = async () => {
        setPublishing(true);
        try {
            const { toast } = await import('@/components/ui');
            await apiFetch(`/marketplace/${agentId}/publish`, {
                method: 'POST',
                body: JSON.stringify({
                    published: true, category, visibility,
                    pricing: { type: pricingType, price: pricingType === 'paid' ? parseFloat(price) || 0 : 0, currency },
                    paymentMethods: {
                        stripe: { enabled: stripeEnabled },
                        crypto: {
                            enabled: cryptoEnabled && wallet !== null,
                            walletAddress: wallet?.walletAddress || '',
                            network: wallet?.network || '',
                            asset: wallet?.asset || '',
                            amount: parseFloat(cryptoAmount) || 0,
                        },
                    },
                }),
            });
            toast({ title: 'Published!', description: `${agentName} is now on the marketplace.` });
            onPublished?.();
        } catch (e: any) {
            const { toast } = await import('@/components/ui');
            toast({ title: 'Publish failed', description: e.message, variant: 'destructive' });
        } finally { setPublishing(false); }
    };

    return (
        <div className="rounded-xl border border-border/60 overflow-hidden">
            <button onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30 transition-colors">
                <span className="flex items-center gap-2"><Store className="w-4 h-4 text-primary" /> Publish to Marketplace</span>
                {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {open && (
                <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border/60 bg-muted/10">
                    <p className="text-xs text-muted-foreground">List this agent on the Onhandl marketplace. The agent must be published first.</p>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="bg-muted/30 border-border/50 text-sm h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Visibility</label>
                            <Select value={visibility} onValueChange={v => setVisibility(v as any)}>
                                <SelectTrigger className="bg-muted/30 border-border/50 text-sm h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="public">Public</SelectItem>
                                    <SelectItem value="unlisted">Unlisted</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Pricing</label>
                        <div className="flex gap-2">
                            {(['free', 'paid'] as const).map(t => (
                                <button key={t} onClick={() => setPricingType(t)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${pricingType === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/30 border-border/50 hover:bg-muted/50'}`}>
                                    {t === 'free' ? 'Free' : 'Paid'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {pricingType === 'paid' && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Price</label>
                                    <Input type="number" min="0" step="0.01" placeholder="9.99" value={price} onChange={e => setPrice(e.target.value)} className="bg-muted/30 border-border/50 text-sm h-9" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Currency</label>
                                    <Select value={currency} onValueChange={setCurrency}>
                                        <SelectTrigger className="bg-muted/30 border-border/50 text-sm h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                            <SelectItem value="GBP">GBP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Stripe toggle */}
                            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                                <div><p className="text-sm font-medium">Stripe</p><p className="text-xs text-muted-foreground">Card payments via Stripe Connect</p></div>
                                <button onClick={() => setStripe(s => !s)} className={`w-10 h-5 rounded-full transition-colors relative ${stripeEnabled ? 'bg-primary' : 'bg-muted'}`}>
                                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${stripeEnabled ? 'translate-x-5' : ''}`} />
                                </button>
                            </div>

                            {/* Crypto toggle */}
                            <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div><p className="text-sm font-medium">Crypto Wallet</p><p className="text-xs text-muted-foreground">Buyer pays to your wallet</p></div>
                                    <button onClick={() => { setCrypto(c => !c); if (cryptoEnabled) setSelected(null); }}
                                        className={`w-10 h-5 rounded-full transition-colors relative ${cryptoEnabled ? 'bg-primary' : 'bg-muted'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${cryptoEnabled ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>
                                {cryptoEnabled && (
                                    saved.crypto.length === 0 ? (
                                        <div className="flex items-center justify-between rounded-lg border border-dashed border-border/60 bg-background/50 px-3 py-2">
                                            <p className="text-xs text-muted-foreground">No saved wallets. Add in Settings.</p>
                                            <Link href="/settings"><span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"><Settings className="w-3 h-3" /> Settings</span></Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {saved.crypto.map((w, i) => (
                                                <button key={i} onClick={() => setSelected(i === selectedCrypto ? null : i)}
                                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-colors ${selectedCrypto === i ? 'border-primary bg-primary/8' : 'border-border/50 hover:bg-muted/30 text-muted-foreground'}`}>
                                                    <div><p className="text-xs font-semibold">{w.label || `${w.network} — ${w.asset}`}</p><p className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">{w.walletAddress}</p></div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">{w.network} · {w.asset}</span>
                                                        {selectedCrypto === i && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                                                    </div>
                                                </button>
                                            ))}
                                            {selectedCrypto !== null && (
                                                <div>
                                                    <label className="text-xs text-muted-foreground mb-1 block">Amount in {wallet?.asset}</label>
                                                    <Input type="number" placeholder={`Amount in ${wallet?.asset}`} value={cryptoAmount} onChange={e => setCryptoAmt(e.target.value)} className="bg-muted/40 border-border/50 text-sm h-8" />
                                                </div>
                                            )}
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    <Button onClick={handlePublish} disabled={isPublishing || !agentId} className="w-full" size="sm">
                        {isPublishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Store className="h-4 w-4 mr-2" />}
                        {isPublishing ? 'Publishing…' : 'Publish to Marketplace'}
                    </Button>
                </div>
            )}
        </div>
    );
}
