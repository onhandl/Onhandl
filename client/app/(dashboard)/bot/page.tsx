'use client';

import { useState } from 'react';
import { Bot, MessageSquare } from 'lucide-react';
import { AssistantChat } from './components/AssistantChat';
import { AgentChats } from './components/AgentChats';

const TABS = [
    { id: 'assistant', label: 'Assistant', icon: Bot },
    { id: 'agents', label: 'Agent Chats', icon: MessageSquare },
] as const;

type Tab = typeof TABS[number]['id'];

export default function BotPage() {
    const [tab, setTab] = useState<Tab>('assistant');

    return (
        <div className="flex flex-col h-[calc(100vh-56px)] max-w-3xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5 flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="font-bold text-[15px] leading-tight">Onhandl Assistant</h1>
                    <p className="text-[11px] text-muted-foreground">Platform help & inter-agent messages</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full ml-auto">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                </span>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 bg-muted/40 rounded-xl p-1 mb-5 flex-shrink-0">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setTab(id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${tab === id
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}>
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {tab === 'assistant' && <AssistantChat />}
            {tab === 'agents' && <AgentChats />}
        </div>
    );
}
