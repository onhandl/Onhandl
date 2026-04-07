'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/overlays/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/navigation/tabs';
import { Button } from '@/components/ui/buttons/button';
import { agentApi } from '@/api/agent-api';
import { toast } from '@/components/ui';
import { Download, ExternalLink, Loader2, Smartphone, Code2, Server } from 'lucide-react';
import { buildPwaZip } from './export-agent/pwa-builders';
import { EmbedTab } from './export-agent/EmbedTab';
import { McpTab } from './export-agent/McpTab';

interface ExportAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    agentId: string;
    agentName: string;
}

export default function ExportAgentModal({ isOpen, onClose, agentId, agentName }: ExportAgentModalProps) {
    const [isDownloadingPwa, setIsDownloadingPwa] = useState(false);

    const handleDownloadPwa = async () => {
        setIsDownloadingPwa(true);
        try {
            const { agentConfig, agentName: name } = await agentApi.exportPwa(agentId);
            const zip = await buildPwaZip(agentConfig, name);
            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name.toLowerCase().replace(/\s+/g, '-')}-pwa.zip`;
            a.click();
            URL.revokeObjectURL(url);
            toast({ title: 'PWA Downloaded', description: `${name}-pwa.zip ready.` });
        } catch {
            toast({ title: 'PWA Download Failed', variant: 'destructive' });
        } finally {
            setIsDownloadingPwa(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto border-border/60 bg-card shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-primary" /> Export Agent
                    </DialogTitle>
                    <DialogDescription>
                        Share <strong>{agentName}</strong> as a widget, standalone PWA app, or MCP server.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="embed" className="mt-2">
                    <TabsList className="grid w-full grid-cols-3 bg-muted/40">
                        <TabsTrigger value="embed" className="flex items-center gap-1.5 data-[state=active]:bg-background">
                            <Code2 className="h-3.5 w-3.5" /> Embed
                        </TabsTrigger>
                        <TabsTrigger value="pwa" className="flex items-center gap-1.5 data-[state=active]:bg-background">
                            <Smartphone className="h-3.5 w-3.5" /> PWA
                        </TabsTrigger>
                        <TabsTrigger value="mcp" className="flex items-center gap-1.5 data-[state=active]:bg-background">
                            <Server className="h-3.5 w-3.5" /> MCP Server
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="embed" className="mt-4">
                        <EmbedTab agentId={agentId} />
                    </TabsContent>

                    <TabsContent value="mcp" className="mt-4">
                        <McpTab agentId={agentId} agentName={agentName} />
                    </TabsContent>

                    <TabsContent value="pwa" className="space-y-4 mt-4">
                        <p className="text-sm text-muted-foreground">
                            Download a self-contained PWA that wraps this agent. Installs as a standalone app on any device.
                        </p>
                        <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-2 text-sm">
                            <p className="font-medium text-sm">Package contents</p>
                            <ul className="text-muted-foreground space-y-1 text-xs list-disc list-inside">
                                <li><code>index.html</code> — standalone chat UI</li>
                                <li><code>manifest.json</code> — app name, icon, display: standalone</li>
                                <li><code>sw.js</code> — service worker for offline shell caching</li>
                                <li><code>agent-config.json</code> — full agent definition</li>
                            </ul>
                        </div>
                        <Button onClick={handleDownloadPwa} disabled={isDownloadingPwa} className="w-full">
                            {isDownloadingPwa
                                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                : <Download className="h-4 w-4 mr-2" />}
                            {isDownloadingPwa ? 'Packaging…' : `Download ${agentName} PWA`}
                        </Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
