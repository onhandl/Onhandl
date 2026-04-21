import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { apiClient } from '../../services/api.js';

export const chatCommand = async (args: string[], context: any): Promise<React.ReactNode> => {
    return (
        <Box flexDirection="column" marginTop={1}>
            <Text color="yellow">The 'chat' command has been improved! Use the <Text bold color="cyan">agent</Text> command instead.</Text>
            <Text>Example: <Text color="green">agent list</Text> will show your agents.</Text>
            <Text>Example: <Text color="green">agent 1</Text> will start chatting with your first agent.</Text>
        </Box>
    );
};

export const chatMessageCommand = async (args: string[], context: any): Promise<React.ReactNode> => {
    const agentId = args[0];
    const { session, messages, onDone } = context;

    return <ChatStream agentId={agentId} messages={messages} session={session} onDone={onDone} />;
};

const ChatStream = ({ agentId, messages, session, onDone }: { agentId: string, messages: any[], session: any, onDone?: (c: string) => void }) => {
    const [fullContent, setFullContent] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'streaming' | 'done'>('streaming');

    useEffect(() => {
        const controller = new AbortController();
        const startChat = async () => {
            const API_BASE_URL = process.env.ONHANDL_API_URL || 'http://localhost:3001/api';

            try {
                const response = await fetch(`${API_BASE_URL}/terminal/ops/agents/${agentId}/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.accessToken}`
                    },
                    body: JSON.stringify({ messages }),
                    signal: controller.signal
                });

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const reader = response.body?.getReader();
                if (!reader) throw new Error('ReadableStream not supported');

                const decoder = new TextDecoder();
                let buffer = '';
                let accumulated = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.trim().startsWith('data: ')) {
                            try {
                                const jsonStr = line.replace('data: ', '').trim();
                                if (!jsonStr) continue;
                                const data = JSON.parse(jsonStr);

                                if (data.content) {
                                    setFullContent(prev => prev + data.content);
                                    accumulated += data.content;
                                }
                                if (data.error) setError(data.error);
                            } catch (e) { }
                        }
                    }
                }
                setStatus('done');
                if (onDone) onDone(accumulated);
            } catch (err: any) {
                if (err.name !== 'AbortError') setError(err.message);
            }
        };

        startChat();
        return () => controller.abort();
    }, [agentId, messages, session]);

    if (error) return <Text color="red">Execution Error: {error}</Text>;

    return (
        <Box flexDirection="column">
            <Text>{fullContent}</Text>
            {status === 'streaming' && <Text color="gray">... (agent typing)</Text>}
        </Box>
    );
};
