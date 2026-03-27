'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from '@/components/ui/overlays/sheet';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/forms/input';
import { ScrollArea } from '@/components/ui/layout/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/data-display/avatar';
import { Send, Loader2, User, Bot, Sparkles, Maximize2, Minimize2, X } from 'lucide-react';
import { useAgentManager } from '@/hooks';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    agentId: string | null;
}

/** Shared markdown components for ReactMarkdown */
const mdComponents: any = {
    a: ({ node, ...props }: any) => (
        <a {...props} target="_blank" rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline break-all" />
    ),
    code: ({ node, ...props }: any) => (
        <code {...props} className="bg-zinc-800 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs break-all" />
    ),
    pre: ({ node, ...props }: any) => (
        <pre {...props} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 my-2 overflow-x-auto text-xs" />
    ),
    table: ({ node, ...props }: any) => (
        <div className="overflow-x-auto my-2 w-full">
            <table {...props} className="border-collapse text-xs w-full min-w-full" />
        </div>
    ),
    th: ({ node, ...props }: any) => (
        <th {...props} className="border border-zinc-700 px-3 py-1.5 bg-zinc-800 text-left text-zinc-200 whitespace-nowrap" />
    ),
    td: ({ node, ...props }: any) => (
        <td {...props} className="border border-zinc-800 px-3 py-1.5 text-zinc-300" />
    ),
    p: ({ node, ...props }: any) => (
        <p {...props} className="my-1 break-words leading-relaxed" />
    ),
    strong: ({ node, ...props }: any) => (
        <strong {...props} className="text-white font-semibold" />
    ),
};

export default function ChatSidebar({ isOpen, onClose, agentId }: ChatSidebarProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [agent, setAgent] = useState<any>(null);
    const [sessionId, setSessionId] = useState<string>('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { loadAgentById, chatWithAgentStream } = useAgentManager();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && agentId) {
            if (!sessionId) {
                setSessionId(`session_${agentId}_${Date.now()}`);
            }
            loadAgentById(agentId).then(data => {
                setAgent(data);
                if (messages.length === 0) {
                    const greeting = data?.character?.bio
                        ? `Hello! I'm ${data.name}. ${data.character.bio}`
                        : `Hello! I'm ${data?.name || 'your assistant'}. How can I help you today?`;
                    setMessages([{ role: 'assistant', content: greeting, timestamp: new Date() }]);
                }
            });
        }
    }, [isOpen, agentId, loadAgentById, messages.length]);

    // Scroll to bottom when messages or typing state changes
    useEffect(() => {
        if (scrollRef.current) {
            // Find the viewport inside the ScrollArea
            const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            } else {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }
    }, [messages, isTyping, isFullscreen]);

    // Cleanup fullscreen state if chat is closed
    useEffect(() => {
        if (!isOpen) {
            setIsFullscreen(false);
        }
    }, [isOpen]);

    // Prevent body scroll in fullscreen
    useEffect(() => {
        if (isFullscreen && isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isFullscreen, isOpen]);

    const handleSendMessage = async () => {
        if (!input.trim() || isTyping || !agent) return;

        const userMsg: Message = { role: 'user', content: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const instructions = agent.character?.instructions?.join('\n') || '';
            const personality = agent.character?.traits?.personality?.join(', ') || '';
            const systemPrompt = `
                You are ${agent.name}.
                Description: ${agent.description || ''}
                Bio: ${agent.character?.bio || ''}
                Personality: ${personality}
                Instructions: ${instructions}
                Always stay in character.
            `.trim();

            const reader = await chatWithAgentStream(
                agent.modelProvider || 'ollama',
                agent.modelConfig?.modelName || 'qwen2.5:3b',
                [
                    { role: 'system', content: systemPrompt },
                    ...messages.map(m => ({ role: m.role, content: m.content })),
                    { role: 'user', content: input }
                ],
                undefined,
                agentId || undefined,
                sessionId
            );

            if (!reader) throw new Error('Failed to open stream reader');

            setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);

            const decoder = new TextDecoder();
            let accumulatedContent = '';
            let buffer = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const events = buffer.split('\n\n');
                    buffer = events.pop() || '';
                    for (const event of events) {
                        if (event.startsWith('data: ')) {
                            try {
                                const json = JSON.parse(event.substring(6));
                                if (json.content) {
                                    accumulatedContent += json.content;
                                    let displayMessage = accumulatedContent;
                                    try {
                                        const match = accumulatedContent.match(/\{[\s\S]*\}/);
                                        if (match) {
                                            const parsed = JSON.parse(match[0]);
                                            if (parsed.message) displayMessage = parsed.message;
                                        }
                                    } catch (e) { /* partial JSON */ }
                                    setMessages(prev => {
                                        const next = [...prev];
                                        const last = next[next.length - 1];
                                        if (last && last.role === 'assistant') last.content = displayMessage;
                                        return next;
                                    });
                                }
                            } catch (e) { console.warn('SSE parse error:', event); }
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }
        } catch (error) {
            console.error('Chat failed:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    // ── Shared UI Renderers ──────────────────────────────────────────────────

    const renderChatBody = () => (
        <div className="flex-1 flex flex-col min-h-0 bg-transparent">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-zinc-800/60 shrink-0">
                <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-purple-500/30">
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white font-bold">
                            {agent?.name?.charAt(0) || 'A'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-zinc-950 rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-base font-bold text-white flex items-center gap-2 truncate">
                        {agent?.name || 'Agent Chat'}
                        <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
                    </div>
                    <div className="text-zinc-500 text-xs truncate uppercase tracking-tighter">
                        {agent?.isDraft ? 'Draft' : 'Live'} • {agent?.modelProvider || 'Ollama'}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setIsFullscreen(!isFullscreen); }}
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0"
                        title={isFullscreen ? 'Collapse' : 'Expand'}
                    >
                        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0"
                        title="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1" ref={scrollRef}>
                <div className={`p-4 space-y-4 ${isFullscreen ? 'max-w-4xl mx-auto w-full' : ''}`}>
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-3 w-full ${isFullscreen ? 'max-w-[70%]' : 'max-w-[92%]'} ${msg.role === 'user' ? 'flex-row-reverse ml-auto' : 'mr-auto'}`}>
                                <Avatar className="h-8 w-8 shrink-0 mt-1 shadow-md">
                                    <AvatarFallback className={msg.role === 'user' ? 'bg-zinc-700' : 'bg-purple-600'}>
                                        {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={`
                                    px-4 py-3 rounded-2xl text-sm leading-relaxed overflow-hidden min-w-0 shadow-sm
                                    ${msg.role === 'user'
                                        ? 'bg-purple-600 text-white rounded-tr-none'
                                        : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none'}
                                `}>
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-invert prose-sm max-w-none break-words overflow-wrap-anywhere overflow-hidden">
                                            <ReactMarkdown components={mdComponents}>{msg.content}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="break-words">{msg.content}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="flex gap-3">
                                <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarFallback className="bg-purple-600">
                                        <Bot className="h-4 w-4" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-none">
                                    <div className="flex gap-1 items-center h-4">
                                        <span className="h-1.5 w-1.5 bg-zinc-500 rounded-full animate-bounce" />
                                        <span className="h-1.5 w-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <span className="h-1.5 w-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input */}
            <div className={`p-4 border-t border-zinc-800/60 bg-zinc-950/40 shrink-0 ${isFullscreen ? 'w-full' : ''}`}>
                <div className={isFullscreen ? 'max-w-4xl mx-auto' : ''}>
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                        className="flex gap-2"
                    >
                        <Input
                            placeholder="Type your message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="bg-zinc-900 border-zinc-700 focus-visible:ring-purple-500 h-11 text-zinc-100 placeholder:text-zinc-500 shadow-inner"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={isTyping || !input.trim()}
                            className="h-11 w-11 shrink-0 bg-purple-600 hover:bg-purple-500 shadow-md transition-all active:scale-95"
                        >
                            {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );

    if (!isOpen) return null;

    if (isFullscreen) {
        return createPortal(
            <div
                className="fixed inset-0 z-[9999] bg-zinc-950 text-zinc-100 flex flex-col items-stretch animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {renderChatBody()}
            </div>,
            document.body
        );
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="right"
                className="p-0 flex flex-col bg-zinc-950/95 backdrop-blur-xl border-zinc-800 text-zinc-100 w-[440px] sm:w-[560px] overflow-hidden"
            >
                <SheetHeader className="sr-only">
                    <SheetTitle>Chat with {agent?.name || 'Agent'}</SheetTitle>
                    <SheetDescription>Interact with your AI agent</SheetDescription>
                </SheetHeader>
                {renderChatBody()}
            </SheetContent>
        </Sheet>
    );
}
