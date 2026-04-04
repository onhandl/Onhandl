'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { agentApi } from '@/api/agent-api';
import { apiFetch } from '@/api/api-client';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/forms/input';
import { toast } from '@/components/ui';
import {
    IconShoppingCart, IconLoader2, IconCopy, IconCheck,
    IconExternalLink, IconBolt,
} from '@tabler/icons-react';

interface PurchaseSidebarProps { agentId: string; agent: any }

function NetworkPricingSelector({ networkPricing, selected, onSelect }: {
    networkPricing: any[]; selected: any; onSelect: (p: any) => void;
}) {
    return (
        <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Pay with network</p>
            <div className="grid grid-cols-2 gap-2">
                {networkPricing.map((p: any) => (
                    <button key={p.network} onClick={() => onSelect(p)}
                        className={`rounded-xl border p-2.5 text-left transition-colors ${selected?.network === p.network ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                        <div className="text-xs font-semibold text-foreground">{p.network}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{p.price} {p.asset}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}

export function PurchaseSidebar({ agentId, agent }: PurchaseSidebarProps) {
    const router = useRouter();
    const [buyStep, setBuyStep] = useState<'idle' | 'choosing' | 'network' | 'stripe' | 'crypto' | 'fiber' | 'done'>('idle');
    const [txHash, setTxHash]   = useState('');
    const [fromAgentId, setFromAgentId] = useState('');
    const [selectedNetPrice, setSelectedNetPrice] = useState<any>(null);
    const [isProcessing, setProcessing] = useState(false);
    const [copiedWallet, setCopiedWallet] = useState(false);
    const [proxyAgentId, setProxyAgentId] = useState<string | null>(null);

    const mkt            = agent?.marketplace || {};
    const isFree         = mkt.pricing?.type !== 'paid';
    const stripeEnabled  = mkt.paymentMethods?.stripe?.enabled;
    const cryptoEnabled  = mkt.paymentMethods?.crypto?.enabled;
    const crypto         = mkt.paymentMethods?.crypto || {};
    const networkPricing: any[] = mkt.networkPricing || [];

    const handleUseAgent = async () => {
        setProcessing(true);
        try {
            const { proxyAgent } = await agentApi.useMarketplaceAgent(agentId);
            setProxyAgentId(proxyAgent._id); setBuyStep('done');
            toast({ title: 'Agent copy created!' });
        } catch (e: any) {
            if (e.message?.includes('already have a copy')) { setBuyStep('done'); }
            else toast({ title: 'Failed', description: e.message, variant: 'destructive' });
        } finally { setProcessing(false); }
    };

    const handleStripeCheckout = async () => {
        setProcessing(true);
        try {
            const { sessionUrl } = await agentApi.createStripeCheckout(agentId);
            window.location.href = sessionUrl;
        } catch (e: any) {
            toast({ title: 'Checkout failed', description: e.message, variant: 'destructive' });
        } finally { setProcessing(false); }
    };

    const handleCryptoSubmit = async () => {
        if (!txHash.trim()) return;
        setProcessing(true);
        try {
            await agentApi.submitCryptoPurchase(agentId, txHash.trim(), crypto.network);
            setBuyStep('done');
            toast({ title: 'Transaction submitted', description: 'Pending verification.' });
        } catch (e: any) {
            toast({ title: 'Submission failed', description: e.message, variant: 'destructive' });
        } finally { setProcessing(false); }
    };

    const handleNetworkPurchase = async () => {
        if (!selectedNetPrice) return;
        setProcessing(true);
        try {
            await apiFetch(`/marketplace/${agentId}/network-purchase`, {
                method: 'POST',
                body: JSON.stringify({ network: selectedNetPrice.network, fromAgentId: fromAgentId || undefined, txHash: txHash || undefined }),
            });
            setBuyStep('done');
            toast({ title: 'Purchase submitted!', description: 'Pending confirmation.' });
        } catch (e: any) {
            toast({ title: 'Failed', description: e.message, variant: 'destructive' });
        } finally { setProcessing(false); }
    };

    const copyWallet = async () => {
        await navigator.clipboard.writeText(crypto.walletAddress || '');
        setCopiedWallet(true); setTimeout(() => setCopiedWallet(false), 2000);
    };

    return (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 sticky top-6">
            <div>
                <p className="text-xs text-muted-foreground mb-1">Price</p>
                <p className={`text-3xl font-bold ${isFree ? 'text-emerald-600' : 'text-foreground'}`}>
                    {isFree ? 'Free' : `${mkt.pricing?.currency} ${mkt.pricing?.price}`}
                </p>
                {networkPricing.length > 0 && !isFree && (
                    <p className="text-[10px] text-muted-foreground mt-1">Also available in {networkPricing.length} network{networkPricing.length > 1 ? 's' : ''}</p>
                )}
            </div>

            {buyStep === 'idle' && (
                <Button className="w-full font-semibold"
                    onClick={() => isFree ? handleUseAgent() : setBuyStep('choosing')} disabled={isProcessing}>
                    {isProcessing ? <IconLoader2 className="h-4 w-4 mr-2 animate-spin" /> : <IconShoppingCart className="h-4 w-4 mr-2" />}
                    {isFree ? 'Use Agent' : 'Buy Agent'}
                </Button>
            )}

            {buyStep === 'choosing' && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Choose payment method</p>
                    {stripeEnabled && (
                        <Button variant="outline" className="w-full text-sm" onClick={handleStripeCheckout} disabled={isProcessing}>
                            {isProcessing && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />} Pay with Card (Stripe)
                        </Button>
                    )}
                    {cryptoEnabled && (
                        <Button variant="outline" className="w-full text-sm" onClick={() => setBuyStep('crypto')}>
                            Pay with Crypto (tx hash)
                        </Button>
                    )}
                    {networkPricing.length > 0 && (
                        <Button variant="outline" className="w-full text-sm gap-2" onClick={() => setBuyStep('network')}>
                            <IconBolt className="h-3.5 w-3.5 text-amber-500" /> Pay via Network
                        </Button>
                    )}
                    <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => setBuyStep('idle')}>Cancel</Button>
                </div>
            )}

            {buyStep === 'network' && (
                <div className="space-y-3">
                    <NetworkPricingSelector networkPricing={networkPricing} selected={selectedNetPrice} onSelect={setSelectedNetPrice} />
                    {selectedNetPrice?.network === 'CKB' && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Pay with your agent (Fiber)</p>
                            <Input placeholder="Your Agent ID (optional)" value={fromAgentId}
                                onChange={e => setFromAgentId(e.target.value)}
                                className="text-xs font-mono" />
                        </div>
                    )}
                    {selectedNetPrice && selectedNetPrice.network !== 'CKB' && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Paste your transaction hash after sending</p>
                            <Input placeholder="0x..." value={txHash} onChange={e => setTxHash(e.target.value)}
                                className="text-xs font-mono" />
                        </div>
                    )}
                    <Button className="w-full font-semibold text-sm"
                        onClick={handleNetworkPurchase} disabled={!selectedNetPrice || isProcessing}>
                        {isProcessing && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />} Confirm Purchase
                    </Button>
                    <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => setBuyStep('choosing')}>Back</Button>
                </div>
            )}

            {buyStep === 'crypto' && (
                <div className="space-y-3">
                    <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 text-xs">
                        <div className="flex justify-between"><span className="text-muted-foreground">Network</span><span>{crypto.network}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold">{crypto.amount} {crypto.asset}</span></div>
                        <div className="mt-1">
                            <p className="text-muted-foreground mb-1">Wallet</p>
                            <div className="relative">
                                <code className="text-xs break-all bg-muted rounded px-2 py-1.5 block pr-8">{crypto.walletAddress}</code>
                                <button onClick={copyWallet} className="absolute top-1 right-1 p-1 rounded bg-muted/80 hover:bg-muted transition-colors">
                                    {copiedWallet ? <IconCheck className="h-3 w-3 text-emerald-500" /> : <IconCopy className="h-3 w-3" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <Input placeholder="Transaction hash 0x..." value={txHash} onChange={e => setTxHash(e.target.value)}
                        className="text-xs font-mono" />
                    <Button className="w-full font-semibold"
                        onClick={handleCryptoSubmit} disabled={!txHash.trim() || isProcessing}>
                        {isProcessing && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />} Submit Transaction
                    </Button>
                    <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => setBuyStep('choosing')}>Back</Button>
                </div>
            )}

            {buyStep === 'done' && (
                <div className="text-center py-4 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
                        <IconCheck className="h-6 w-6 text-emerald-600" />
                    </div>
                    <p className="font-semibold text-emerald-600">{isFree ? 'Ready to use!' : 'Purchase submitted!'}</p>
                    {isFree && proxyAgentId && (
                        <Button variant="outline" className="w-full"
                            onClick={() => router.push(`/sandbox?agentId=${proxyAgentId}`)}>
                            Open in Sandbox
                        </Button>
                    )}
                </div>
            )}

            <Link href={`/sandbox?agentId=${agent._id}`}
                className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <IconExternalLink className="h-3 w-3" /> Open in Sandbox
            </Link>
        </div>
    );
}
