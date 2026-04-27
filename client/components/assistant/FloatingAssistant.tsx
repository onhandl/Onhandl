'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Sparkles, Bot, Zap } from 'lucide-react';
import { AssistantChat } from '@/app/(dashboard)/bot/components/AssistantChat';
import { cn } from '@/lib/utils';

export function FloatingAssistant() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-[90vw] sm:w-[400px] h-[600px] max-h-[80vh] flex flex-col rounded-3xl border border-border/50 bg-background/80 backdrop-blur-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-border/50 flex items-center justify-between bg-primary/5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                    <Sparkles size={18} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-sm font-black tracking-tight flex items-center gap-2">
                                        Onhandl Assistant
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    </h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Always Active</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-hidden p-4 flex flex-col">
                            <AssistantChat />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 group relative overflow-hidden",
                    isOpen
                        ? "bg-muted text-foreground border border-border"
                        : "bg-primary text-white shadow-primary/30"
                )}
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                            <X size={24} />
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="relative">
                            <Bot size={28} className="group-hover:translate-y-[-2px] transition-transform duration-300" />
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-primary shadow-sm"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
}
