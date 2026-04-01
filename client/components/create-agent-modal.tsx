'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/overlays/dialog';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/forms/input';
import { Textarea } from '@/components/ui/forms/textarea';
import { Label } from '@/components/ui/forms/label';
import { Cpu, Wand2, Loader2, Check, ChevronRight } from 'lucide-react';
import { agentApi } from '@/api/agent-api';
import { useToast } from '@/components/ui/notifications/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/select';

interface CreateAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: (agentId: string) => void;
}

export default function CreateAgentModal({ isOpen, onClose, onComplete }: CreateAgentModalProps) {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [persona, setPersona] = useState('');
    const [provider, setProvider] = useState<string>('ollama');
    const [model, setModel] = useState<string>('qwen2.5:3b');
    const [apiKey, setApiKey] = useState<string>('');
    const [agentType, setAgentType] = useState<string>('operational_agent');
    const [selectedChain, setSelectedChain] = useState<string>('ckb-testnet');
    const [enhancedData, setEnhancedData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (provider === 'ollama') {
            setApiKey(localStorage.getItem('ollama_base_url') || 'http://localhost:11434');
            setModel(localStorage.getItem('ollama_model') || 'qwen2.5:3b');
        } else {
            setApiKey(localStorage.getItem(`${provider}_api_key`) || '');
        }
    }, [provider]);

    const handleNext = async () => {
        if (!name || !persona) {
            toast({ title: 'Missing fields', description: 'Provide both a name and a persona.', variant: 'destructive' });
            return;
        }
        setIsLoading(true);
        try {
            if (provider === 'ollama') {
                localStorage.setItem('ollama_base_url', apiKey);
                localStorage.setItem('ollama_model', model);
            } else if (apiKey) {
                localStorage.setItem(`${provider}_api_key`, apiKey);
            }
            const data = await agentApi.enhancePersona(name, persona, provider, apiKey, model, agentType);
            setEnhancedData(data);
            setStep(2);
        } catch (err: any) {
            toast({ title: 'Expansion failed', description: err.message || 'AI failed to expand persona.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        setIsLoading(true);
        try {
            const agent = await agentApi.saveAgent(
                name, undefined, persona, undefined, true,
                provider, apiKey, enhancedData, agentType, selectedChain
            );
            toast({ title: 'Agent created' });
            if (onComplete) onComplete(agent._id);
            onClose();
            setStep(1); setEnhancedData(null); setName(''); setPersona('');
            router.push(`/sandbox?agentId=${agent._id}`);
        } catch (err: any) {
            toast({ title: 'Creation failed', description: err.message || 'Something went wrong.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col bg-card border-border/60 shadow-xl p-0 overflow-hidden gap-0">
                <div className="h-px w-full bg-gradient-to-r from-primary/70 to-primary/10" />

                {/* Header */}
                <div className="px-6 pt-5 pb-4 border-b border-border/50">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                                <Cpu className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-base font-bold leading-snug">
                                    {step === 1 ? 'Create AI Agent' : 'Review Persona'}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground leading-snug mt-0">
                                    {step === 1
                                        ? 'Name your agent and describe its persona — AI expands the rest.'
                                        : 'Review the AI-generated character before finalizing.'}
                                </DialogDescription>
                            </div>
                            {/* Step indicator */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                {[1, 2].map((s) => (
                                    <div key={s} className={`h-1.5 rounded-full transition-all ${s === step ? 'w-6 bg-primary' : s < step ? 'w-3 bg-primary/40' : 'w-3 bg-border'}`} />
                                ))}
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {step === 1 ? (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Agent Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Satoshi, Trading Bot, Fiber Guide"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-10 rounded-xl bg-background border-border/60 focus-visible:ring-primary/30 text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="persona" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Persona Summary</Label>
                                <Textarea
                                    id="persona"
                                    placeholder="e.g. A helpful assistant specialized in CKB transactions and Fiber network payments."
                                    value={persona}
                                    onChange={(e) => setPersona(e.target.value)}
                                    className="min-h-[96px] rounded-xl bg-background border-border/60 focus-visible:ring-primary/30 text-sm resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5 col-span-2">
                                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Blockchain Network</Label>
                                    <Select value={selectedChain} onValueChange={setSelectedChain}>
                                        <SelectTrigger className="h-10 rounded-xl bg-background border-border/60 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ckb-testnet">Nervos CKB (Testnet)</SelectItem>
                                            <SelectItem value="ethereum">Ethereum (Managed)</SelectItem>
                                            <SelectItem value="polygon">Polygon (Managed)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5 col-span-2">
                                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Agent Class</Label>
                                    <Select value={agentType} onValueChange={setAgentType}>
                                        <SelectTrigger className="h-10 rounded-xl bg-background border-border/60 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="operational_agent">Operational — Workflows & Default</SelectItem>
                                            <SelectItem value="financial_agent">Financial — High Security & Balances</SelectItem>
                                            <SelectItem value="social_agent">Social — Community & Platforms</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">AI Provider</Label>
                                    <Select value={provider} onValueChange={setProvider}>
                                        <SelectTrigger className="h-10 rounded-xl bg-background border-border/60 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ollama">Ollama (Local)</SelectItem>
                                            <SelectItem value="gemini">Google Gemini</SelectItem>
                                            <SelectItem value="openai">OpenAI</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="apiKey" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        {provider === 'ollama' ? 'Ollama URL' : 'API Key'}
                                    </Label>
                                    <Input
                                        id="apiKey"
                                        type={provider === 'ollama' ? 'text' : 'password'}
                                        placeholder={provider === 'ollama' ? 'http://localhost:11434' : 'Optional'}
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="h-10 rounded-xl bg-background border-border/60 focus-visible:ring-primary/30 text-sm"
                                    />
                                </div>

                                {provider === 'ollama' && (
                                    <div className="space-y-1.5 col-span-2">
                                        <Label htmlFor="model" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ollama Model</Label>
                                        <Input
                                            id="model"
                                            placeholder="e.g. qwen2.5:3b, llama3"
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                            className="h-10 rounded-xl bg-background border-border/60 focus-visible:ring-primary/30 text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">AI-Expanded Bio</p>
                                <p className="text-sm leading-relaxed text-foreground/90">"{enhancedData?.bio}"</p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">System Instructions</p>
                                <div className="space-y-1.5">
                                    {enhancedData?.instructions?.map((inst: string, idx: number) => (
                                        <div key={idx} className="flex gap-2.5 p-3 rounded-lg bg-muted/30 border border-border/40 text-xs">
                                            <div className="w-1 h-1 rounded-full bg-primary/50 mt-1.5 shrink-0" />
                                            <span className="text-foreground/80 leading-relaxed">{inst}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Personality', items: enhancedData?.traits?.personality, color: 'bg-primary/8 text-primary border-primary/15' },
                                    { label: 'Knowledge', items: enhancedData?.traits?.knowledge, color: 'bg-emerald-500/8 text-emerald-600 border-emerald-500/15' },
                                ].map(({ label, items, color }) => (
                                    <div key={label} className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {items?.map((t: string, i: number) => (
                                                <span key={i} className={`px-2 py-0.5 text-[10px] font-medium border rounded-md capitalize ${color}`}>{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border/50 flex items-center justify-end gap-2">
                    {step === 1 ? (
                        <>
                            <Button variant="ghost" onClick={onClose} className="h-9 px-4 rounded-xl text-sm">Cancel</Button>
                            <Button
                                onClick={handleNext}
                                disabled={isLoading}
                                className="h-9 px-5 rounded-xl text-sm bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
                            >
                                {isLoading
                                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Expanding…</>
                                    : <><Wand2 className="h-3.5 w-3.5 mr-1.5" />Expand Persona<ChevronRight className="h-3.5 w-3.5 ml-0.5" /></>}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => setStep(1)} className="h-9 px-4 rounded-xl text-sm">Back</Button>
                            <Button
                                onClick={handleCreate}
                                disabled={isLoading}
                                className="h-9 px-5 rounded-xl text-sm bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
                            >
                                {isLoading
                                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Creating…</>
                                    : <><Check className="h-3.5 w-3.5 mr-1.5" />Finalize & Create</>}
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
