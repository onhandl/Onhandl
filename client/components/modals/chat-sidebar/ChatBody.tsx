'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/layout/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/data-display/avatar';
import { Button } from '@/components/ui/buttons/button';
import { Input } from '@/components/ui/forms/input';
import { Send, Loader2, User, Bot, Sparkles, Maximize2, Minimize2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { mdComponents } from './mdComponents';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatBodyProps {
    agent: any;
    messages: Message[];
    isTyping: boolean;
    isFullscreen: boolean;
    input: string;
    scrollRef: React.RefObject<HTMLDivElement>;
    onInputChange: (val: string) => void;
    onSend: () => void;
    onToggleFullscreen: () => void;
    onClose: () => void;
}

export function ChatBody({
    agent, messages, isTyping, isFullscreen,
    input, scrollRef,
    onInputChange, onSend, onToggleFullscreen, onClose,
}: ChatBodyProps) {
    return (
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
                    <button type="button" onClick={(e) => { e.stopPropagation(); onToggleFullscreen(); }}
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0"
                        title={isFullscreen ? 'Collapse' : 'Expand'}>
                        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0"
                        title="Close">
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
                                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed overflow-hidden min-w-0 shadow-sm
                                    ${msg.role === 'user'
                                        ? 'bg-purple-600 text-white rounded-tr-none'
                                        : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none'}`}>
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
                                    <AvatarFallback className="bg-purple-600"><Bot className="h-4 w-4" /></AvatarFallback>
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
                    <form onSubmit={(e) => { e.preventDefault(); onSend(); }} className="flex gap-2">
                        <Input
                            placeholder="Type your message..."
                            value={input}
                            onChange={(e) => onInputChange(e.target.value)}
                            className="bg-zinc-900 border-zinc-700 focus-visible:ring-purple-500 h-11 text-zinc-100 placeholder:text-zinc-500 shadow-inner"
                        />
                        <Button type="submit" size="icon" disabled={isTyping || !input.trim()}
                            className="h-11 w-11 shrink-0 bg-purple-600 hover:bg-purple-500 shadow-md transition-all active:scale-95">
                            {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
