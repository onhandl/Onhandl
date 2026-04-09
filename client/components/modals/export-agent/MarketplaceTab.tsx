'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/forms/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/select';
import { Store, Loader2, Settings, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import Link from 'next/link';

const CATEGORIES = ['Trading Bot', 'Analytics', 'DeFi Assistant', 'Portfolio Manager', 'Data Feed', 'Custom'];

interface SavedCrypto { label: string; network: string; walletAddress: string; asset: string }

interface MarketplaceTabProps { agentId: string; agentName: string; onClose: () => void; }

export function MarketplaceTab({ agentId, agentName, onClose }: MarketplaceTabProps) {
    const [isPublishing, setIsPublishing] = useState(false);
    const [mktCategory, setMktCategory] = useState('Custom');
    const [mktVisibility, setMktVisibility] = useState<'public' | 'unlisted'>('public');
    const [mktPricingType, setMktPricingType] = useState<'free' | 'paid'>('free');
    const [mktPrice, setMktPrice] = useState('');
    const [mktCurrency, setMktCurrency] = useState('USD');
    const [mktStripe, setMktStripe] = useState(false);
    const [mktCrypto, setMktCrypto] = useState(false);
    const [selectedCryptoIndex, setSelectedCryptoIndex] = useState<number | null>(null);
    const [mktCryptoAmount, setMktCryptoAmount] = useState('');
    const [savedMethods, setSavedMethods] = useState<{ stripe: any; crypto: SavedCrypto[] }>({ stripe: null, crypto: [] });

    useEffect(() => {
        apiFetch('/auth/payment-methods')
            .then((d: any) => setSavedMethods({ stripe: d.stripe, crypto: d.crypto || [] }))
            .catch(() => { });
    }, []);

    const selectedWallet = selectedCryptoIndex !== null ? savedMethods.crypto[selectedCryptoIndex] : null;

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const { toast } = await import('@/components/ui');
            await apiFetch(`/marketplace/${agentId}/publish`, {
                method: 'POST',
                body: JSON.stringify({
                    published: true, category: mktCategory, visibility: mktVisibility,
                    pricing: { type: mktPricingType, price: mktPricingType === 'paid' ? parseFloat(mktPrice) || 0 : 0, currency: mktCurrency },
                    paymentMethods: {
                        stripe: { enabled: mktStripe },
                        crypto: {
                            enabled: mktCrypto && selectedWallet !== null,
                            walletAddress: selectedWallet?.walletAddress || '',
                            network: selectedWallet?.network || '',
                            asset: selectedWallet?.asset || '',
                            amount: parseFloat(mktCryptoAmount) || 0,
                        },
                    },
                }),
            });
            toast({ title: 'Published!', description: `${agentName} is now on the marketplace.` });
            onClose();
            window.location.href = '/dashboard/revenue';
        } catch (e: any) {
            const { toast } = await import('@/components/ui');
            toast({ title: 'Publish failed', description: e.message, variant: 'destructive' });
        } finally { setIsPublishing(false); }
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">List this agent on the Onhandl marketplace. The agent must be published first.</p>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                    <Select value={mktCategory} onValueChange={setMktCategory}>
                        <SelectTrigger className="bg-muted/30 border-border/50 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Visibility</label>
                    <Select value={mktVisibility} onValueChange={(v) => setMktVisibility(v as any)}>
                        <SelectTrigger className="bg-muted/30 border-border/50 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="public">Public</SelectItem><SelectItem value="unlisted">Unlisted</SelectItem></SelectContent>
                    </Select>
                </div>
            </div>
            <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Pricing</label>
                <div className="flex gap-2">
                    {(['free', 'paid'] as const).map((t) => (
                        <button key={t} onClick={() => setMktPricingType(t)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${mktPricingType === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/30 border-border/50 hover:bg-muted/50'}`}>
                            {t === 'free' ? 'Free' : 'Paid'}
                        </button>
                    ))}
                </div>
            </div>

            {mktPricingType === 'paid' && (
                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Price</label>
                            <Input type="number" min="0" step="0.01" placeholder="9.99" value={mktPrice} onChange={(e) => setMktPrice(e.target.value)} className="bg-muted/30 border-border/50 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Currency</label>
                            <Select value={mktCurrency} onValueChange={setMktCurrency}>
                                <SelectTrigger className="bg-muted/30 border-border/50 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground">Payment Methods</p>

                        {/* Stripe */}
                        <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                            <div>
                                <p className="text-sm font-medium">Stripe</p>
                                <p className="text-xs text-muted-foreground">Credit / debit card via Stripe Connect</p>
                            </div>
                            <button onClick={() => setMktStripe(!mktStripe)} className={`w-10 h-5 rounded-full transition-colors relative ${mktStripe ? 'bg-primary' : 'bg-muted'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${mktStripe ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>

                        {/* Crypto — saved wallets only */}
                        <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3">
                            <div className="flex items-center justify-between">
                                <div><p className="text-sm font-medium">Crypto Wallet</p><p className="text-xs text-muted-foreground">Buyer pays directly to your wallet</p></div>
                                <button onClick={() => { setMktCrypto(!mktCrypto); if (mktCrypto) setSelectedCryptoIndex(null); }}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${mktCrypto ? 'bg-primary' : 'bg-muted'}`}>
                                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${mktCrypto ? 'translate-x-5' : ''}`} />
                                </button>
                            </div>

                            {mktCrypto && (
                                savedMethods.crypto.length === 0 ? (
                                    <div className="flex items-center justify-between rounded-lg border border-dashed border-border/60 bg-background/50 px-3 py-3">
                                        <p className="text-xs text-muted-foreground">No saved wallets. Add one in Settings first.</p>
                                        <Link href="/settings" onClick={onClose}>
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer">
                                                <Settings className="w-3 h-3" /> Settings
                                            </span>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Select a saved wallet</p>
                                        <div className="space-y-1.5">
                                            {savedMethods.crypto.map((w, i) => (
                                                <button key={i} onClick={() => setSelectedCryptoIndex(i === selectedCryptoIndex ? null : i)}
                                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-colors ${selectedCryptoIndex === i ? 'border-primary bg-primary/8 text-foreground' : 'border-border/50 bg-background/50 hover:bg-muted/30 text-muted-foreground'}`}>
                                                    <div>
                                                        <p className="text-xs font-semibold">{w.label || `${w.network} — ${w.asset}`}</p>
                                                        <p className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">{w.walletAddress}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className="text-[10px] font-medium bg-muted/50 px-1.5 py-0.5 rounded">{w.network} · {w.asset}</span>
                                                        {selectedCryptoIndex === i && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        {selectedCryptoIndex !== null && (
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Amount in {selectedWallet?.asset}</label>
                                                <Input type="number" min="0" step="0.0001" placeholder={`Amount in ${selectedWallet?.asset}`} value={mktCryptoAmount} onChange={(e) => setMktCryptoAmount(e.target.value)} className="bg-muted/40 border-border/50 text-sm h-8" />
                                            </div>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Button onClick={handlePublish} disabled={isPublishing} className="w-full">
                {isPublishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Store className="h-4 w-4 mr-2" />}
                {isPublishing ? 'Publishing…' : 'Publish to Marketplace'}
            </Button>
        </div>
    );
}
