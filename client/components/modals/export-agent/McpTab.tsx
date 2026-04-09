'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/buttons/button';
import { Check, Copy, Loader2, Server } from 'lucide-react';

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={async () => {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }}
            title="Copy"
            className="absolute top-2 right-2 p-1.5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
    );
}

function CodeBlock({ code, label }: { code: string; label: string }) {
    return (
        <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <div className="relative">
                <pre className="bg-zinc-950 text-green-400 text-xs p-3 pr-10 rounded-lg overflow-x-auto font-mono border border-border/50 leading-relaxed whitespace-pre-wrap break-all">
                    {code}
                </pre>
                <CopyButton text={code} />
            </div>
        </div>
    );
}

interface McpTabProps {
    agentId: string;
    agentName: string;
}

export function McpTab({ agentId, agentName }: McpTabProps) {
    const [mcpEndpoint, setMcpEndpoint] = useState<string | null>(null);
    const [isEnabling, setIsEnabling] = useState(false);

    const safeName = agentName.toLowerCase().replace(/\s+/g, '-');

    const handleEnable = async () => {
        setIsEnabling(true);
        try {
            const { agentApi } = await import('@/api/agent-api');
            const { toast } = await import('@/components/ui');
            const data = await agentApi.exportMcp(agentId);
            setMcpEndpoint(data.mcpEndpoint);
            toast({ title: 'MCP Server Enabled', description: 'Your MCP endpoint is ready.' });
        } catch {
            const { toast } = await import('@/components/ui');
            toast({ title: 'Failed to enable MCP server', variant: 'destructive' });
        } finally {
            setIsEnabling(false);
        }
    };

    const claudeDesktopConfig = mcpEndpoint
        ? JSON.stringify(
              {
                  mcpServers: {
                      [safeName]: {
                          url: mcpEndpoint,
                          type: 'http',
                      },
                  },
              },
              null,
              2
          )
        : '';

    const cursorConfig = mcpEndpoint
        ? JSON.stringify(
              {
                  mcpServers: {
                      [safeName]: {
                          url: mcpEndpoint,
                          type: 'http',
                      },
                  },
              },
              null,
              2
          )
        : '';

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Expose <strong>{agentName}</strong> as an MCP server. Any MCP-compatible client (Claude Desktop, Cursor, Zed, etc.) can
                connect to your agent using the endpoint below.
            </p>

            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-2 text-sm">
                <p className="font-medium text-sm">What gets exposed</p>
                <ul className="text-muted-foreground space-y-1 text-xs list-disc list-inside">
                    <li>Tool: <code>chat</code> — send messages, get streamed replies</li>
                    <li>Session continuity via optional <code>sessionId</code> param</li>
                    <li>Compatible with MCP Streamable HTTP transport (2025-03-26)</li>
                </ul>
            </div>

            {!mcpEndpoint ? (
                <Button onClick={handleEnable} disabled={isEnabling} className="w-full">
                    {isEnabling ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Server className="h-4 w-4 mr-2" />
                    )}
                    {isEnabling ? 'Enabling…' : 'Enable MCP Server'}
                </Button>
            ) : (
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">MCP Endpoint</p>
                        <div className="relative">
                            <code className="block bg-muted/40 text-xs px-3 py-2 pr-10 rounded-lg border border-border/50 break-all font-mono">
                                {mcpEndpoint}
                            </code>
                            <CopyButton text={mcpEndpoint} />
                        </div>
                    </div>

                    <CodeBlock label="Claude Desktop — claude_desktop_config.json" code={claudeDesktopConfig} />
                    <CodeBlock label="Cursor — .cursor/mcp.json" code={cursorConfig} />

                    <p className="text-xs text-muted-foreground">
                        Paste the config snippet into your client&apos;s MCP settings file, then restart the client.
                    </p>

                    <Button variant="outline" size="sm" onClick={handleEnable} disabled={isEnabling}>
                        {isEnabling && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                        Regenerate
                    </Button>
                </div>
            )}
        </div>
    );
}
