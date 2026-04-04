'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/overlays/sheet';
import { useAgentManager } from '@/hooks';
import { ChatBody } from './chat-sidebar/ChatBody';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    agentId: string | null;
    isSimulating: boolean;
    onStartSimulation: () => void;
}

export default function ChatSidebar({
    isOpen, onClose, agentId, isSimulating, onStartSimulation,
}: ChatSidebarProps) {
    const [messages, setMessages]       = useState<Message[]>([]);
    const [input, setInput]             = useState('');
    const [isTyping, setIsTyping]       = useState(false);
    const [agent, setAgent]             = useState<any>(null);
    const [sessionId, setSessionId]     = useState<string>('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { loadAgentById, chatWithAgentStream } = useAgentManager();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && agentId) {
            if (!sessionId) setSessionId(`session_${agentId}_${Date.now()}`);
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
    }, [isOpen, agentId, loadAgentById, messages.length, sessionId]);

    useEffect(() => {
        if (scrollRef.current) {
            const vp = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (vp) vp.scrollTop = vp.scrollHeight;
            else scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping, isFullscreen]);

    useEffect(() => { if (!isOpen) setIsFullscreen(false); }, [isOpen]);

    useEffect(() => {
        document.body.style.overflow = (isFullscreen && isOpen) ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isFullscreen, isOpen]);

    const handleSendMessage = async () => {
        if (!input.trim() || isTyping || !agent) return;

        const userMsg: Message = { role: 'user', content: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const instructions  = agent.character?.instructions?.join('\n') || '';
            const personality   = agent.character?.traits?.personality?.join(', ') || '';
            const systemPrompt  = [
                `You are ${agent.name}.`,
                `Description: ${agent.description || ''}`,
                `Bio: ${agent.character?.bio || ''}`,
                `Personality: ${personality}`,
                `Instructions: ${instructions}`,
                'Always stay in character.',
            ].join('\n').trim();

            const reader = await chatWithAgentStream(
                agent.modelProvider || 'ollama',
                agent.modelConfig?.modelName || 'qwen2.5:3b',
                [
                    { role: 'system', content: systemPrompt },
                    ...messages.map(m => ({ role: m.role, content: m.content })),
                    { role: 'user', content: input },
                ],
                undefined, agentId || undefined, sessionId,
            );
            if (!reader) throw new Error('Failed to open stream reader');

            setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);
            const decoder = new TextDecoder();
            let accumulated = '';
            let buffer = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const events = buffer.split('\n\n');
                    buffer = events.pop() || '';
                    for (const ev of events) {
                        if (!ev.startsWith('data: ')) continue;
                        try {
                            const json = JSON.parse(ev.substring(6));
                            if (json.content) {
                                accumulated += json.content;
                                let display = accumulated;
                                try {
                                    const match = accumulated.match(/\{[\s\S]*\}/);
                                    if (match) {
                                        const parsed = JSON.parse(match[0]);
                                        if (parsed.message) display = parsed.message;
                                    }
                                } catch { /* partial JSON */ }
                                setMessages(prev => {
                                    const next = [...prev];
                                    const last = next[next.length - 1];
                                    if (last?.role === 'assistant') last.content = display;
                                    return next;
                                });
                            }
                        } catch { /* ignore */ }
                    }
                }
            } finally { reader.releaseLock(); }
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const bodyProps = {
        agent, messages, isTyping, isFullscreen, input, scrollRef,
        isSimulating, onStartSimulation,
        onInputChange: setInput,
        onSend: handleSendMessage,
        onToggleFullscreen: () => setIsFullscreen(f => !f),
        onClose,
    };

    if (!isOpen) return null;

    if (isFullscreen) {
        return createPortal(
            <div
                className="fixed inset-0 z-[9999] bg-background flex flex-col items-stretch animate-in fade-in zoom-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                <ChatBody {...bodyProps} />
            </div>,
            document.body,
        );
    }

    return (
        <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
            <SheetContent
                side="right"
                hideClose
                className="p-0 flex flex-col bg-background border-border w-[440px] sm:w-[560px] overflow-hidden"
            >
                <SheetHeader className="sr-only">
                    <SheetTitle>Chat with {agent?.name || 'Agent'}</SheetTitle>
                    <SheetDescription>Interact with your AI agent</SheetDescription>
                </SheetHeader>
                <ChatBody {...bodyProps} />
            </SheetContent>
        </Sheet>
    );
}
