'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Trash2, Zap, Sparkles, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api-client';
import CreateAgentModal from '@/components/create-agent-modal';

type Message = { id: string; content: string; role: 'user' | 'assistant' };

const SUGGESTED = [
    'How do I create my first agent?',
    'What are the pricing plans?',
    'How does the token system work?',
    'What blockchain features are available?',
];

export function AssistantChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

    const send = async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || loading) return;

        const userMsg: Message = { id: Date.now().toString(), content: trimmed, role: 'user' };
        const history = messages.map(m => ({ role: m.role, content: m.content }));

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const data = await apiFetch('/bots/chat', { method: 'POST', body: JSON.stringify({ message: trimmed, history }) });
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), content: data.reply || 'No response.', role: 'assistant' }]);
        } catch (err: any) {
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), content: err.message || 'Something went wrong.', role: 'assistant' }]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    const isEmpty = messages.length === 0;
    const agentPrompt = useMemo(() => {
        return messages
            .map((message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`)
            .join('\n\n')
            .slice(0, 4000);
    }, [messages]);

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
                {!isEmpty && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs font-bold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5"
                    >
                        <Bot className="h-3.5 w-3.5 text-primary" />
                        Convert to Agent
                    </button>
                )}
                {!isEmpty && (
                    <button onClick={() => setMessages([])} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto">
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1">
                <AnimatePresence initial={false}>
                    {isEmpty && (
                        <motion.div key="empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-full text-center gap-6 py-12">
                            <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg mb-1">Hi, I'm Onhandl Assistant</h2>
                                <p className="text-sm text-muted-foreground max-w-xs">Ask me about features, pricing, how to build agents, or anything else.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm">
                                {SUGGESTED.map(s => (
                                    <button key={s} onClick={() => send(s)}
                                        className="text-left text-xs px-3.5 py-2.5 rounded-xl border border-border/60 bg-card hover:border-primary/30 hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {messages.map(msg => (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center mr-2.5 flex-shrink-0 mt-0.5">
                                    <Zap className="w-3.5 h-3.5 text-primary" />
                                </div>
                            )}
                            <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}
                                style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                        </motion.div>
                    ))}

                    {loading && (
                        <motion.div key="loading" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center mr-2.5 flex-shrink-0 mt-0.5">
                                <Zap className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3.5 flex items-center gap-1.5">
                                {[0, 150, 300].map(d => (
                                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>

            <form onSubmit={e => { e.preventDefault(); send(input); }}
                className="flex-shrink-0 mt-4 flex gap-2 items-center bg-card border border-border/60 rounded-2xl px-4 py-2.5 focus-within:border-primary/40 transition-colors shadow-sm">
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                    placeholder="Ask me anything about Onhandl…" disabled={loading}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 disabled:opacity-50" />
                <button type="submit" disabled={!input.trim() || loading}
                    className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white disabled:opacity-30 hover:bg-primary/90 transition-all disabled:cursor-not-allowed flex-shrink-0">
                    <Send className="w-3.5 h-3.5" />
                </button>
            </form>

            <CreateAgentModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                initialPrompt={agentPrompt}
            />
        </div>
    );
}
