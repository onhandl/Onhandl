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
}

export default function CreateAgentModal({ isOpen, onClose }: CreateAgentModalProps) {
    const [name, setName] = useState('');
    const [persona, setPersona] = useState('');
    const [provider, setProvider] = useState('gemini');
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    // Load key from storage when provider changes
    useEffect(() => {
        const storedKey = localStorage.getItem(`${provider}_api_key`) || '';
        setApiKey(storedKey);
    }, [provider]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
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
            if (apiKey) {
                localStorage.setItem(`${provider}_api_key`, apiKey);
            }
            const agent = await agentApi.saveAgent(name, undefined, persona, undefined, true, provider, apiKey);
            toast({
                title: 'Agent Created',
                description: 'Your agent has been initialized with an AI-enhanced persona.',
            });
            router.push(`/sandbox?agentId=${agent._id}`);
            onClose();
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
            <DialogContent className="sm:max-w-[500px] border-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl">
                <DialogHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
                        <Sparkles className="text-primary h-6 w-6" />
                    </div>
                    <DialogTitle className="text-2xl font-extrabold tracking-tight">Create AI Agent</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Give your agent a name and a brief persona. Our AI will expand this into a comprehensive character schema.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreate} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-bold uppercase tracking-wider opacity-70">Agent Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Satoshi, Trading Bot, Fiber Guide"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-muted/30 border-border/50 focus:border-primary/50 transition-all rounded-xl h-12"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="persona" className="text-sm font-bold uppercase tracking-wider opacity-70">Persona Summary</Label>
                        <Textarea
                            id="persona"
                            placeholder="e.g. A helpful assistant that specialized in CKB transactions and Fiber network payments. Highly technical but friendly."
                            value={persona}
                            onChange={(e) => setPersona(e.target.value)}
                            className="bg-muted/30 border-border/50 focus:border-primary/50 min-h-[120px] transition-all rounded-xl py-3"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold uppercase tracking-wider opacity-70">AI Model Provider</Label>
                            <Select value={provider} onValueChange={setProvider}>
                                <SelectTrigger className="bg-muted/30 border-border/50 focus:border-primary/50 rounded-xl h-12">
                                    <SelectValue placeholder="Select Provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gemini">Google Gemini</SelectItem>
                                    <SelectItem value="openai">OpenAI</SelectItem>
                                    <SelectItem value="anthropic">Anthropic</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="apiKey" className="text-sm font-bold uppercase tracking-wider opacity-70">API Key (Optional)</Label>
                            <Input
                                id="apiKey"
                                type="password"
                                placeholder={`Your ${provider.charAt(0).toUpperCase() + provider.slice(1)} API Key`}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="bg-muted/30 border-border/50 focus:border-primary/50 transition-all rounded-xl h-12"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">Leave empty to use system default keys</p>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="rounded-xl font-bold hover:bg-muted"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="rounded-xl font-bold px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 flex gap-2 transition-all transform active:scale-95"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    Create Agent
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
