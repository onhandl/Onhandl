'use client';

import { AssistantChat } from './components/AssistantChat';
import { Bot } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function BotPage() {
    return (
        <div className="flex flex-col h-[calc(100vh-56px)] max-w-3xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5 flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="font-bold text-[15px] leading-tight">Onhandl Assistant</h1>
                    <p className="text-[11px] text-muted-foreground">Your AI-powered platform assistant</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full ml-auto">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                </span>
            </div>

            <AssistantChat />
        </div>
    );
}
