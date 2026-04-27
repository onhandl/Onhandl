'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Label } from '@/components/ui';
import { Button } from '@/components/ui/buttons/button';
import { KeyRound, Eye, EyeOff, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKeyField {
    key: string;
    label: string;
    placeholder: string;
    isUrl?: boolean;
}

const FIELDS: ApiKeyField[] = [
    { key: 'gemini', label: 'Gemini API Key', placeholder: 'AIza...' },
    { key: 'openai', label: 'OpenAI API Key', placeholder: 'sk-...' },
    { key: 'openaiBaseUrl', label: 'OpenAI Base URL', placeholder: 'https://api.openai.com/v1', isUrl: true },
    { key: 'openaiModel', label: 'OpenAI Model', placeholder: 'gpt-4o-mini', isUrl: true },
    { key: 'ollamaBaseUrl', label: 'Ollama Base URL', placeholder: 'http://localhost:11434', isUrl: true },
    { key: 'ollamaModel', label: 'Ollama Model', placeholder: 'qwen2.5:3b', isUrl: true },
];

export function ApiKeysCard() {
    const [keys, setKeys] = useState<Record<string, string>>({});
    const [visibility, setVisibility] = useState<Record<string, boolean>>({});
    const [serverStatus, setServerStatus] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);


    useEffect(() => {
        apiFetch('/users/api-keys').then((data: any) => {
            setServerStatus({ gemini: data.hasGemini, openai: data.hasOpenai, ollama: data.hasOllama });
            // Pre-fill non-secret fields
            setKeys({
                openaiBaseUrl: data.openaiBaseUrl || '',
                openaiModel: data.openaiModel || '',
                ollamaBaseUrl: data.ollamaBaseUrl || '',
                ollamaModel: data.ollamaModel || '',
            });
        }).catch(() => { });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            // Only send fields that have been touched (non-empty)
            const payload: Record<string, string> = {};
            for (const { key } of FIELDS) {
                if (keys[key] !== undefined && keys[key] !== '') payload[key] = keys[key];
            }
            await apiFetch('/users/api-keys', { method: 'PUT', body: JSON.stringify(payload) });
            // Also persist to localStorage for in-browser use
            if (keys.gemini) localStorage.setItem('gemini_api_key', keys.gemini);
            if (keys.openai) localStorage.setItem('openai_api_key', keys.openai);
            if (keys.ollamaBaseUrl) localStorage.setItem('ollama_base_url', keys.ollamaBaseUrl);
            setSaved(true);
            toast.success('API keys saved');
            setTimeout(() => setSaved(false), 3000);
        } catch (e: any) {
            toast.error('Failed to save API keys', {
                description: e.message,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="border-border shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="border-b border-border/50 bg-muted/5">
                <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-primary" />
                    AI Provider Keys
                </CardTitle>
                <CardDescription>
                    Save your keys once — click to reuse them when building agents. Keys are stored securely.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {FIELDS.map(({ key, label, placeholder, isUrl }) => {
                        const hasServer = key === 'gemini' ? serverStatus.gemini
                            : key === 'openai' ? serverStatus.openai
                                : key === 'ollamaBaseUrl' ? serverStatus.ollama
                                    : false;
                        const show = !!visibility[key];
                        return (
                            <div key={key} className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium">{label}</Label>
                                    {hasServer && (
                                        <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                                            Saved
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <Input
                                        type={isUrl ? 'text' : show ? 'text' : 'password'}
                                        value={keys[key] ?? ''}
                                        onChange={(e) => setKeys({ ...keys, [key]: e.target.value })}
                                        placeholder={hasServer ? '••••••••••••' : placeholder}
                                        className="pr-9 bg-background border-border text-sm font-mono"
                                    />
                                    {!isUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setVisibility({ ...visibility, [key]: !show })}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <p className="text-xs text-muted-foreground">
                    Leave a field blank to keep the existing saved key. Keys are also synced to local browser storage for instant access.
                </p>
            </CardContent>
            <CardFooter className="border-t border-border/50 pt-5 flex justify-end bg-muted/5">
                <Button onClick={handleSave} disabled={saving} className="rounded-full px-6">
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                        : saved ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Saved!</>
                            : <><Save className="mr-2 h-4 w-4" /> Save Keys</>}
                </Button>
            </CardFooter>
        </Card>
    );
}