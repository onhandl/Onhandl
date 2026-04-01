'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/forms/input';
import { Copy, Check, Code2, Loader2 } from 'lucide-react';

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            title="Copy" className="absolute top-2 right-2 p-1.5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
    );
}

function CodeBlock({ code, label }: { code: string; label: string }) {
    return (
        <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <div className="relative">
                <pre className="bg-zinc-950 text-green-400 text-xs p-3 pr-10 rounded-lg overflow-x-auto font-mono border border-border/50 leading-relaxed whitespace-pre-wrap break-all">{code}</pre>
                <CopyButton text={code} />
            </div>
        </div>
    );
}

interface EmbedTabProps {
    agentId: string;
}

export function EmbedTab({ agentId }: EmbedTabProps) {
    const [embedData, setEmbedData] = useState<{ embedUrl: string; iframeSnippet: string; scriptSnippet: string } | null>(null);
    const [isEnabling, setIsEnabling] = useState(false);
    const [allowedDomains, setAllowedDomains] = useState('');
    const [allowedIPs, setAllowedIPs] = useState('');

    const handleEnable = async () => {
        setIsEnabling(true);
        try {
            const { agentApi } = await import('@/api/agent-api');
            const { toast } = await import('@/components/ui');
            const domains = allowedDomains.split(',').map((s) => s.trim()).filter(Boolean);
            const ips = allowedIPs.split(',').map((s) => s.trim()).filter(Boolean);
            const data = await agentApi.exportEmbed(agentId, { allowedDomains: domains, allowedIPs: ips, theme: 'dark' });
            setEmbedData(data);
            toast({ title: 'Embed Enabled', description: 'Your embed snippets are ready.' });
        } catch {
            const { toast } = await import('@/components/ui');
            toast({ title: 'Failed to enable embed', variant: 'destructive' });
        } finally {
            setIsEnabling(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Generate a public embed URL. Restrict access by domain and/or IP in production.</p>
            <div className="space-y-3">
                <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Allowed Domains <span className="opacity-60">(comma-separated, leave empty to allow all)</span></label>
                    <Input placeholder="myapp.com, dashboard.io" value={allowedDomains} onChange={(e) => setAllowedDomains(e.target.value)} className="bg-muted/30 border-border/50 text-sm" />
                </div>
                <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Allowed IPs <span className="opacity-60">(comma-separated, leave empty to allow all)</span></label>
                    <Input placeholder="192.168.1.1, 41.139.20.5" value={allowedIPs} onChange={(e) => setAllowedIPs(e.target.value)} className="bg-muted/30 border-border/50 text-sm" />
                </div>
            </div>
            {!embedData ? (
                <Button onClick={handleEnable} disabled={isEnabling} className="w-full">
                    {isEnabling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Code2 className="h-4 w-4 mr-2" />}
                    Generate Embed Snippets
                </Button>
            ) : (
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Embed URL</p>
                        <div className="relative">
                            <code className="block bg-muted/40 text-xs px-3 py-2 pr-10 rounded-lg border border-border/50 break-all font-mono">{embedData.embedUrl}</code>
                            <CopyButton text={embedData.embedUrl} />
                        </div>
                    </div>
                    <CodeBlock label="iframe snippet" code={embedData.iframeSnippet} />
                    <CodeBlock label="Script tag snippet" code={embedData.scriptSnippet} />
                    <Button variant="outline" size="sm" onClick={handleEnable} disabled={isEnabling}>
                        {isEnabling && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                        Regenerate
                    </Button>
                </div>
            )}
        </div>
    );
}
