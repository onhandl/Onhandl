'use client';

import { useState } from 'react';
import { Code2, ChevronDown, ChevronUp, Copy, Check, ShieldCheck, ShieldX } from 'lucide-react';

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
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <button onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-zinc-800/40 transition-colors">
                <div className="flex items-center gap-2.5">
                    <Code2 className="h-4 w-4 text-[#9AB17A]" />
                    <span className="text-sm font-semibold">{label}</span>
                </div>
                {open ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
            </button>
            {open && (
                <div className="border-t border-zinc-800">
                    <div className="relative">
                        <pre className="text-[11px] leading-relaxed font-mono text-[#C3CC9B] bg-zinc-950 p-4 overflow-x-auto max-h-[400px] overflow-y-auto">
                            {json}
                        </pre>
                        <button onClick={handleCopy}
                            className="absolute top-3 right-3 p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                            title="Copy JSON">
                            {copied ? <Check className="h-3.5 w-3.5 text-[#9AB17A]" /> : <Copy className="h-3.5 w-3.5" />}
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
                        ? <ShieldCheck className="h-3.5 w-3.5 text-[#9AB17A] mt-0.5 shrink-0" />
                        : <ShieldX className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />}
                    <span className="text-zinc-300 leading-snug">{item}</span>
                </li>
            ))}
        </ul>
    );
}
