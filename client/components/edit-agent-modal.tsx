'use client';

import { useState, useEffect } from 'react';
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
import { Settings2, Loader2, Save } from 'lucide-react';
import { agentApi } from '@/api/agent-api';
import { useToast } from '@/components/ui/notifications/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/select';

interface EditAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    agent: {
        _id: string;
        name: string;
        persona?: string;
    } | null;
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
        if (agent) {
            setName(agent.name);
            setPersona(agent.persona || '');
            // Can't easily reload provider from agent since we don't fetch modelProvider here,
            // but we can load key from storage when provider changes.
        }
    }, [agent]);

    // Load key from storage when provider changes
    useEffect(() => {
        const storedKey = localStorage.getItem(`${provider}_api_key`) || '';
        setApiKey(storedKey);
    }, [provider]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agent) return;

        setIsLoading(true);
        try {
            if (apiKey) {
                localStorage.setItem(`${provider}_api_key`, apiKey);
            }
            const updated = await agentApi.updateAgent(agent._id, {
                name,
                persona,
                provider,
                apiKey
            });
            toast({
                title: 'Agent Updated',
                description: 'Changes saved and persona re-enhanced by AI.',
            });
            onSuccess(updated);
            onClose();
        } catch (error: any) {
            toast({
                title: 'Update Failed',
                description: error.message || 'Failed to update agent details.',
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
                        <Settings2 className="text-primary h-6 w-6" />
                    </div>
                    <DialogTitle className="text-2xl font-extrabold tracking-tight">Edit Agent Details</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Update your agent's identity. Changing the persona summary will re-trigger AI enhancement.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleUpdate} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name" className="text-sm font-bold uppercase tracking-wider opacity-70">Agent Name</Label>
                        <Input
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-muted/30 border-border/50 focus:border-primary/50 transition-all rounded-xl h-12"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-persona" className="text-sm font-bold uppercase tracking-wider opacity-70">Persona Summary</Label>
                        <Textarea
                            id="edit-persona"
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
                            <Label htmlFor="edit-apiKey" className="text-sm font-bold uppercase tracking-wider opacity-70">API Key (Optional)</Label>
                            <Input
                                id="edit-apiKey"
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
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
