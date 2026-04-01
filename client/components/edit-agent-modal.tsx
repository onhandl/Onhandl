'use client';

import { useState, useEffect } from 'react';
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
import { SlidersHorizontal, Loader2, Check } from 'lucide-react';
import { agentApi } from '@/api/agent-api';
import { useToast } from '@/components/ui/notifications/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/select';

interface EditAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    agent: { _id: string; name: string; persona?: string } | null;
    onSuccess: (updatedAgent: any) => void;
}

export default function EditAgentModal({ isOpen, onClose, agent, onSuccess }: EditAgentModalProps) {
    const [name, setName] = useState('');
    const [persona, setPersona] = useState('');
    const [provider, setProvider] = useState('gemini');
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (agent) { setName(agent.name); setPersona(agent.persona || ''); }
    }, [agent]);

    useEffect(() => {
        setApiKey(localStorage.getItem(`${provider}_api_key`) || '');
    }, [provider]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agent) return;
        setIsLoading(true);
        try {
            if (apiKey) localStorage.setItem(`${provider}_api_key`, apiKey);
            const updated = await agentApi.updateAgent(agent._id, { name, persona, provider, apiKey });
            toast({ title: 'Agent updated', description: 'Persona re-enhanced by AI.' });
            onSuccess(updated);
            onClose();
        } catch (err: any) {
            toast({ title: 'Update failed', description: err.message || 'Something went wrong.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-card border-border/60 shadow-xl p-0 overflow-hidden gap-0">
                <div className="h-px w-full bg-gradient-to-r from-primary/70 to-primary/10" />

                <div className="px-6 pt-5 pb-4">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                                <SlidersHorizontal className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold leading-snug">Edit Agent</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground leading-snug mt-0">
                                    Persona changes trigger AI re-enhancement.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <form onSubmit={handleUpdate} className="px-6 pb-6 space-y-4 border-t border-border/50 pt-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-name" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Agent Name
                        </Label>
                        <Input
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-10 rounded-xl bg-background border-border/60 focus-visible:ring-primary/30 text-sm"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="edit-persona" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Persona Summary
                        </Label>
                        <Textarea
                            id="edit-persona"
                            value={persona}
                            onChange={(e) => setPersona(e.target.value)}
                            className="min-h-[96px] rounded-xl bg-background border-border/60 focus-visible:ring-primary/30 text-sm resize-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Provider
                            </Label>
                            <Select value={provider} onValueChange={setProvider}>
                                <SelectTrigger className="h-10 rounded-xl bg-background border-border/60 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gemini">Google Gemini</SelectItem>
                                    <SelectItem value="openai">OpenAI</SelectItem>
                                    <SelectItem value="anthropic">Anthropic</SelectItem>
                                    <SelectItem value="ollama">Ollama</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-apiKey" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                API Key
                            </Label>
                            <Input
                                id="edit-apiKey"
                                type="password"
                                placeholder="Uses system default"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="h-10 rounded-xl bg-background border-border/60 focus-visible:ring-primary/30 text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={onClose} className="h-9 px-4 rounded-xl text-sm">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="h-9 px-5 rounded-xl text-sm bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
                        >
                            {isLoading
                                ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Saving…</>
                                : <><Check className="h-3.5 w-3.5 mr-1.5" />Save Changes</>}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
