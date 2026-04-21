import React, { useState, useRef, useEffect } from 'react';
import { Box, Text, Newline, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import { executeCommand } from '../commands/index.js';
import { chatMessageCommand } from '../commands/chat/index.js';
import { TerminalSession } from '../types.js';

type ChatMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

// Simple history entry type
type HistoryEntry = {
    command: string;
    output: React.ReactNode;
    agentName?: string;
};

export const Repl = ({ session, setSession }: { session: TerminalSession | null, setSession: any }) => {
    const { exit } = useApp();
    const [inputValue, setInputValue] = useState('');
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [chatAgent, setChatAgent] = useState<{ id: string, name: string } | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

    // Intercept Ctrl+C to exit chat mode first
    useInput((input, key) => {
        if (input === 'c' && key.ctrl) {
            if (chatAgent) {
                setChatAgent(null);
                setChatHistory([]);
                setHistory(prev => [...prev, { command: '^C', output: <Text color="yellow">Session interrupted. Left chat.</Text> }]);
            } else {
                exit();
            }
        }
    });

    const handleSubmit = async (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return;

        // Special handling for chat mode exit
        if (chatAgent && (trimmed === '/exit' || trimmed === 'exit' || trimmed === 'quit')) {
            setChatAgent(null);
            setHistory(prev => [...prev, { command: trimmed, output: <Text color="yellow">Left chat with {chatAgent.name}.</Text> }]);
            setInputValue('');
            return;
        }

        let outputNode: React.ReactNode = null;
        try {
            if (chatAgent) {
                if (trimmed === '/help') {
                    outputNode = (
                        <Box flexDirection="column">
                            <Text bold color="yellow">Chat Mode Help</Text>
                            <Newline />
                            <Text>- Any text: Sent to agent</Text>
                            <Text>- /exit: Leave chat mode</Text>
                            <Text>- /help: Show this help</Text>
                        </Box>
                    );
                } else {
                    const currentHistory = [...chatHistory, { role: 'user', content: trimmed } as ChatMessage];
                    outputNode = await chatMessageCommand([chatAgent.id], {
                        session,
                        setChatAgent,
                        messages: currentHistory,
                        exit,
                        onDone: (fullContent: string) => {
                            setChatHistory(prev => [...prev, { role: 'user', content: trimmed }, { role: 'assistant', content: fullContent }]);
                        }
                    });
                }
            } else {
                outputNode = await executeCommand(trimmed, { session, setSession, setChatAgent, exit });
            }

            setHistory(prev => [...prev, {
                command: trimmed,
                output: outputNode,
                agentName: chatAgent?.name
            }]);
        } catch (err: any) {
            setHistory(prev => [...prev, { command: trimmed, output: <Text color="red">{err.message}</Text> }]);
        } finally {
            setInputValue('');
        }
    };

    const promptLabel = chatAgent ? `${chatAgent.name.toLowerCase()} ❯` : 'onhandl ❯';

    return (
        <Box flexDirection="column">
            {history.map((entry, idx) => (
                <Box key={idx} flexDirection="column">
                    <Box>
                        <Text color="cyan">{entry.agentName ? `${entry.agentName.toLowerCase()} ❯ ` : 'onhandl ❯ '}</Text>
                        <Text>{entry.command}</Text>
                    </Box>
                    {entry.output && <Box paddingLeft={2}>{entry.output}</Box>}
                </Box>
            ))}
            <Box>
                <Box marginRight={1}>
                    <Text color="cyan">{promptLabel}</Text>
                </Box>
                <TextInput
                    value={inputValue}
                    onChange={setInputValue}
                    onSubmit={handleSubmit}
                />
            </Box>
        </Box>
    );
};
