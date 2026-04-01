'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/overlays/dialog';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/forms/input';
import { Textarea } from '@/components/ui/forms/textarea';
import { Label } from '@/components/ui/forms/label';
import { Sparkles, Loader2 } from 'lucide-react';
import { agentApi } from '@/api/agent-api';
import { useToast } from '@/components/ui/notifications/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/select';
import { useEffect } from 'react';

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
            toast({
                title: 'Missing fields',
                description: 'Please provide both a name and a persona summary.',
                variant: 'destructive',
            });
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
        } catch (error: any) {
            toast({
                title: 'Expansion Failed',
                description: error.message || 'The AI failed to expand your persona. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        setIsLoading(true);
        try {
            // Send the pre-expanded character with the selected chain for auto-provisioning
            const agent = await agentApi.saveAgent(
                name,
                undefined,
                persona,
                undefined,
                true,
                provider,
                apiKey,
                enhancedData,
                agentType,
                selectedChain
            );
            toast({
                title: 'Agent Created',
                description: 'Your agent has been initialized with the reviewed persona.',
            });
            if (onComplete) onComplete(agent._id);
            onClose();
            setStep(1);
            setEnhancedData(null);
            setName('');
            setPersona('');
            router.push(`/sandbox?agentId=${agent._id}`);
        } catch (error: any) {
            toast({
                title: 'Creation Failed',
                description: error.message || 'Something went wrong while creating your agent.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col border-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl">
                <DialogHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
                        <Sparkles className="text-primary h-6 w-6" />
                    </div>
                    <DialogTitle className="text-2xl font-extrabold tracking-tight">
                        {step === 1 ? 'Create AI Agent' : 'Review Agent Persona'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {step === 1
                            ? 'Give your agent a name and a brief persona. Our AI will expand this into a comprehensive character.'
                            : 'Review the AI-generated character traits and instructions before finalizing.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0 py-4">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-bold uppercase tracking-wider opacity-70">Agent Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Satoshi, Trading Bot, Fiber Guide"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-black/20 text-white border-border/50 focus:border-primary/50 transition-all rounded-xl h-12 placeholder:text-white/40"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="persona" className="text-sm font-bold uppercase tracking-wider opacity-70">Persona Summary</Label>
                                <Textarea
                                    id="persona"
                                    placeholder="e.g. A helpful assistant that specialized in CKB transactions and Fiber network payments."
                                    value={persona}
                                    onChange={(e) => setPersona(e.target.value)}
                                    className="bg-black/20 text-white border-border/50 focus:border-primary/50 min-h-[120px] transition-all rounded-xl py-3 placeholder:text-white/40"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label className="text-sm font-bold uppercase tracking-wider opacity-70">Target Blockchain (Auto-Wallet)</Label>
                                    <Select value={selectedChain} onValueChange={setSelectedChain}>
                                        <SelectTrigger className="bg-black/20 text-white border-border/50 focus:border-primary/50 rounded-xl h-12">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ckb-testnet">Nervos CKB (Testnet)</SelectItem>
                                            <SelectItem value="ethereum">Ethereum (Managed)</SelectItem>
                                            <SelectItem value="polygon">Polygon (Managed)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <Label className="text-sm font-bold uppercase tracking-wider opacity-70">Agent Class (Schema Profile)</Label>
                                    <Select value={agentType} onValueChange={setAgentType}>
                                        <SelectTrigger className="bg-black/20 text-white border-border/50 focus:border-primary/50 rounded-xl h-12">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="operational_agent">Operational Agent (Workflows & Default)</SelectItem>
                                            <SelectItem value="financial_agent">Financial Agent (High Security & Balances)</SelectItem>
                                            <SelectItem value="social_agent">Social Agent (Community & Platforms)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-bold uppercase tracking-wider opacity-70">AI Provider</Label>
                                    <Select value={provider} onValueChange={setProvider}>
                                        <SelectTrigger className="bg-black/20 text-white border-border/50 focus:border-primary/50 rounded-xl h-12">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ollama">Ollama (Local)</SelectItem>
                                            <SelectItem value="gemini">Google Gemini</SelectItem>
                                            <SelectItem value="openai">OpenAI</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="apiKey" className="text-sm font-bold uppercase tracking-wider opacity-70">
                                        {provider === 'ollama' ? 'Ollama Base URL' : 'API Key (Optional)'}
                                    </Label>
                                    <Input
                                        id="apiKey"
                                        type={provider === 'ollama' ? 'text' : 'password'}
                                        placeholder={provider === 'ollama' ? 'http://localhost:11434' : 'Optional SDK Key'}
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="bg-black/20 text-white border-border/50 focus:border-primary/50 transition-all rounded-xl h-12 placeholder:text-white/40"
                                    />
                                </div>

                                {provider === 'ollama' && (
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="model" className="text-sm font-bold uppercase tracking-wider opacity-70">Ollama Model</Label>
                                        <Input
                                            id="model"
                                            placeholder="e.g. qwen2.5:3b, llama3, etc."
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                            className="bg-black/20 text-white border-border/50 focus:border-primary/50 transition-all rounded-xl h-12 placeholder:text-white/40"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20">
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Expanded Bio</h4>
                                    <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                                </div>
                                <p className="text-sm leading-relaxed italic opacity-90">"{enhancedData?.bio}"</p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">System Instructions</h4>
                                <div className="space-y-1">
                                    {enhancedData?.instructions?.map((inst: string, idx: number) => (
                                        <div key={idx} className="p-3 text-xs bg-muted/30 border border-border/50 rounded-lg flex gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1 shrink-0" />
                                            <span>{inst}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Personality</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {enhancedData?.traits?.personality?.map((t: string, idx: number) => (
                                            <span key={idx} className="px-2 py-1 text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-md capitalize">{t}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Knowledge</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {enhancedData?.traits?.knowledge?.map((t: string, idx: number) => (
                                            <span key={idx} className="px-2 py-1 text-[10px] bg-secondary/10 text-secondary border border-secondary/20 rounded-md capitalize">{t}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-4 gap-2 border-t border-border/50">
                    {step === 1 ? (
                        <>
                            <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
                            <Button
                                onClick={handleNext}
                                disabled={isLoading}
                                className="rounded-xl font-bold px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 flex gap-2 transition-all transform active:scale-95"
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                Expand Persona
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => setStep(1)} className="rounded-xl font-bold">Back</Button>
                            <Button
                                onClick={handleCreate}
                                disabled={isLoading}
                                className="rounded-xl font-bold px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 flex gap-2 transition-all transform active:scale-95"
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                Finalize & Create
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
