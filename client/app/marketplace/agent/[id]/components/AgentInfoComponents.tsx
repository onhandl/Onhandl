'use client';

import { useState } from 'react';
import {
    IconCode, IconChevronDown, IconChevronUp, IconCopy, IconCheck,
    IconShieldCheck, IconShieldX,
} from '@tabler/icons-react';

export function JsonViewer({ data, label }: { data: any; label: string }) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const json = JSON.stringify(data, null, 2);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(json);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-2.5">
                    <IconCode className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">{label}</span>
                </div>
                {open
                    ? <IconChevronUp className="h-4 w-4 text-muted-foreground" />
                    : <IconChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {open && (
                <div className="border-t border-border">
                    <div className="relative">
                        <pre className="text-[11px] leading-relaxed font-mono text-primary bg-muted/30 p-4 overflow-x-auto max-h-[400px] overflow-y-auto">
                            {json}
                        </pre>
                        <button onClick={handleCopy}
                            className="absolute top-3 right-3 p-1.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy JSON">
                            {copied
                                ? <IconCheck className="h-3.5 w-3.5 text-emerald-500" />
                                : <IconCopy className="h-3.5 w-3.5" />}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export function ConstraintList({ items, allowed }: { items: string[]; allowed: boolean }) {
    if (!items?.length) return null;
    return (
        <ul className="space-y-1.5">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                    {allowed
                        ? <IconShieldCheck className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        : <IconShieldX className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />}
                    <span className="text-foreground leading-snug">{item}</span>
                </li>
            ))}
        </ul>
    );
}
