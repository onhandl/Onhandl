'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { agentApi } from '@/api/agent-api';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/forms/input';
import { toast } from '@/components/ui';
import { ShoppingCart, Loader2, Copy, Check, ExternalLink } from 'lucide-react';

interface PurchaseSidebarProps {
    agentId: string;
    agent: any;
}

export function PurchaseSidebar({ agentId, agent }: PurchaseSidebarProps) {
    const router = useRouter();
    const [buyStep, setBuyStep] = useState<'idle' | 'choosing' | 'stripe' | 'crypto' | 'done'>('idle');
    const [txHash, setTxHash] = useState('');
    const [isProcessing, setProcessing] = useState(false);
    const [copiedWallet, setCopiedWallet] = useState(false);
    const [proxyAgentId, setProxyAgentId] = useState<string | null>(null);

    const mkt = agent?.marketplace || {};
    const isFree = mkt.pricing?.type !== 'paid';
    const stripeEnabled = mkt.paymentMethods?.stripe?.enabled;
    const cryptoEnabled = mkt.paymentMethods?.crypto?.enabled;
    const crypto = mkt.paymentMethods?.crypto || {};

    const handleUseAgent = async () => {
        setProcessing(true);
        try {
            const { proxyAgent } = await agentApi.useMarketplaceAgent(agentId);
            setProxyAgentId(proxyAgent._id);
            setBuyStep('done');
            toast({ title: 'Agent copy created!', description: 'Your personal copy is ready in the sandbox.' });
        } catch (e: any) {
            if (e.message?.includes('already have a copy')) {
                setBuyStep('done');
            } else {
                toast({ title: 'Failed to copy agent', description: e.message, variant: 'destructive' });
            }
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
            toast({ title: 'Transaction submitted', description: 'Pending on-chain verification.' });
        } catch (e: any) {
            toast({ title: 'Submission failed', description: e.message, variant: 'destructive' });
        } finally { setProcessing(false); }
    };

    const copyWallet = async () => {
        await navigator.clipboard.writeText(crypto.walletAddress || '');
        setCopiedWallet(true);
        setTimeout(() => setCopiedWallet(false), 2000);
    };

    return (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4 sticky top-6">
            <div>
                <p className="text-xs text-zinc-500 mb-1">Price</p>
                <p className={`text-3xl font-bold ${isFree ? 'text-[#9AB17A]' : 'text-[#FBE8CE]'}`}>
                    {isFree ? 'Free' : `${mkt.pricing?.currency} ${mkt.pricing?.price}`}
                </p>
            </div>

            {buyStep === 'idle' && (
                <Button className="w-full bg-[#9AB17A] hover:bg-[#8aa06a] text-zinc-900 font-semibold"
                    onClick={() => isFree ? handleUseAgent() : setBuyStep('choosing')}
                    disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
                    {isFree ? 'Use Agent' : 'Buy Agent'}
                </Button>
            )}

            {buyStep === 'choosing' && (
                <div className="space-y-2">
                    <p className="text-xs text-zinc-400 font-medium">Choose payment method</p>
                    {stripeEnabled && (
                        <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-sm" onClick={handleStripeCheckout} disabled={isProcessing}>
                            {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Pay with Card (Stripe)
                        </Button>
                    )}
                    {cryptoEnabled && (
                        <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-sm" onClick={() => setBuyStep('crypto')}>
                            Pay with Crypto
                        </Button>
                    )}
                    <Button variant="ghost" className="w-full text-xs text-zinc-500" onClick={() => setBuyStep('idle')}>Cancel</Button>
                </div>
            )}

            {buyStep === 'crypto' && (
                <div className="space-y-3">
                    <p className="text-xs text-zinc-400 font-medium">Send payment to:</p>
                    <div className="bg-zinc-800 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500">Network</span><span className="font-medium">{crypto.network}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500">Asset</span><span className="font-medium">{crypto.asset}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500">Amount</span>
                            <span className="font-bold text-[#FBE8CE]">{crypto.amount} {crypto.asset}</span>
                        </div>
                        <div className="pt-1">
                            <p className="text-xs text-zinc-500 mb-1">Wallet address</p>
                            <div className="relative">
                                <code className="text-xs break-all bg-zinc-900 rounded px-2 py-1.5 block pr-8">{crypto.walletAddress}</code>
                                <button onClick={copyWallet} className="absolute top-1 right-1 p-1 rounded bg-zinc-700 hover:bg-zinc-600">
                                    {copiedWallet ? <Check className="h-3 w-3 text-[#9AB17A]" /> : <Copy className="h-3 w-3" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-zinc-500">After sending, paste your transaction hash below:</p>
                    <Input placeholder="0x..." value={txHash} onChange={(e) => setTxHash(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-xs font-mono" />
                    <Button className="w-full bg-[#9AB17A] hover:bg-[#8aa06a] text-zinc-900 font-semibold text-sm"
                        onClick={handleCryptoSubmit} disabled={!txHash.trim() || isProcessing}>
                        {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Submit Transaction
                    </Button>
                    <Button variant="ghost" className="w-full text-xs text-zinc-500" onClick={() => setBuyStep('choosing')}>Back</Button>
                </div>
            )}

            {buyStep === 'done' && (
                <div className="text-center py-4 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#9AB17A]/20 flex items-center justify-center mx-auto">
                        <Check className="h-6 w-6 text-[#9AB17A]" />
                    </div>
                    <p className="font-semibold text-[#9AB17A]">{isFree ? 'Ready to use!' : 'Payment submitted!'}</p>
                    {!isFree && <p className="text-xs text-zinc-500">We'll verify your payment and grant access shortly.</p>}
                    {isFree && proxyAgentId && (
                        <Button
                            className="w-full bg-[#9AB17A]/20 hover:bg-[#9AB17A]/30 text-[#9AB17A] font-semibold text-sm border border-[#9AB17A]/30"
                            onClick={() => router.push(`/sandbox?agentId=${proxyAgentId}`)}
                        >
                            Open My Copy in Sandbox
                        </Button>
                    )}
                </div>
            )}

            <Link href={`/sandbox?agentId=${agent._id}`}
                className="flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                <ExternalLink className="h-3 w-3" /> Open in Sandbox
            </Link>
        </div>
    );
}
