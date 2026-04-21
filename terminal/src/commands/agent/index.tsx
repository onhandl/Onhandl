import React, { useEffect, useState } from 'react';
import { Box, Text, Newline } from 'ink';
import { apiClient } from '../../services/api.js';

export const agentCommand = async (args: string[], context: any): Promise<React.ReactNode> => {
    const subOrId = args[0] || 'list';

    if (subOrId === 'list' || args.length === 0) {
        return <AgentList onSelect={null} />;
    }

    // Try to select an agent by number or ID prefix
    return <AgentSelect identifier={subOrId} setChatAgent={context.setChatAgent} />;
};

// Agent row shape returned from API
type AgentRow = { id: string; name: string; agentType: string; isDraft: boolean };

const AgentList = ({ onSelect }: { onSelect: ((a: AgentRow) => void) | null }) => {
    const [agents, setAgents] = useState<AgentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        apiClient.get('/terminal/ops/agents')
            .then(res => {
                setAgents(res.data.agents || []);
                setLoading(false);
            })
            .catch(err => {
                setError(err.response?.data?.error || err.message);
                setLoading(false);
            });
    }, []);

    if (loading) return <Text color="yellow">Fetching agents...</Text>;
    if (error) return <Text color="red">Error: {error}</Text>;
    if (agents.length === 0) return <Text color="gray">No published agents found. Create one in the dashboard.</Text>;

    return (
        <Box flexDirection="column" marginTop={1}>
            <Text color="green" bold underline>YOUR AGENTS</Text>
            <Newline />
            <Box>
                <Box width={4}><Text bold color="gray">#</Text></Box>
                <Box width={26}><Text bold>ID</Text></Box>
                <Box width={22}><Text bold>NAME</Text></Box>
                <Box width={18}><Text bold>TYPE</Text></Box>
                <Text bold>STATUS</Text>
            </Box>
            <Text color="gray">{'-'.repeat(72)}</Text>
            {agents.map((agent, idx) => (
                <Box key={agent.id}>
                    <Box width={4}><Text color="gray">{idx + 1}.</Text></Box>
                    <Box width={26}><Text color="cyan">{agent.id.substring(0, 8)}…</Text></Box>
                    <Box width={22}><Text>{agent.name}</Text></Box>
                    <Box width={18}><Text color="magenta">{agent.agentType}</Text></Box>
                    <Text color={agent.isDraft ? 'yellow' : 'green'}>
                        {agent.isDraft ? 'Draft' : 'Published'}
                    </Text>
                </Box>
            ))}
            <Newline />
            <Text color="gray">Tip: <Text color="cyan">agent &lt;#&gt;</Text> or <Text color="cyan">agent &lt;id-prefix&gt;</Text> to select and start chatting</Text>
        </Box>
    );
};

const AgentSelect = ({ identifier, setChatAgent }: { identifier: string; setChatAgent: any }) => {
    const [status, setStatus] = useState<'loading' | 'found' | 'not_found' | 'error'>('loading');
    const [agent, setAgent] = useState<AgentRow | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        apiClient.get('/terminal/ops/agents')
            .then(res => {
                const agents: AgentRow[] = res.data.agents || [];
                // Try numeric index first
                const num = parseInt(identifier, 10);
                let found: AgentRow | undefined;
                if (!isNaN(num) && num >= 1 && num <= agents.length) {
                    found = agents[num - 1];
                } else {
                    // Try ID prefix or exact name match
                    found = agents.find(a =>
                        a.id.toLowerCase().startsWith(identifier.toLowerCase()) ||
                        a.id.toLowerCase() === identifier.toLowerCase() ||
                        a.name.toLowerCase() === identifier.toLowerCase()
                    );
                }

                if (found) {
                    setAgent(found);
                    setChatAgent({ id: found.id, name: found.name });
                    setStatus('found');
                } else {
                    setStatus('not_found');
                }
            })
            .catch(err => {
                setError(err.response?.data?.error || err.message);
                setStatus('error');
            });
    }, [identifier, setChatAgent]);

    if (status === 'loading') return <Text color="yellow">Looking up agent...</Text>;
    if (status === 'error') return <Text color="red">Error: {error}</Text>;
    if (status === 'not_found') return (
        <Box flexDirection="column">
            <Text color="red">Agent not found: "<Text bold>{identifier}</Text>"</Text>
            <Text color="gray">Use <Text color="cyan">agent list</Text> to see available agents and select by # or ID prefix.</Text>
        </Box>
    );

    return (
        <Box flexDirection="column">
            <Text color="green">✔ Now chatting with <Text bold color="cyan">{agent!.name}</Text></Text>
            <Text color="gray">Type your message and press Enter. Use <Text color="yellow">Ctrl+C</Text> or type <Text color="yellow">exit</Text> to leave.</Text>
        </Box>
    );
};
