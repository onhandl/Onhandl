import React from 'react';
import { Box, Text, Newline } from 'ink';
import { apiClient } from '../../services/api.js';

export const whoamiCommand = async (args: string[], context: any): Promise<React.ReactNode> => {
    const { session } = context;

    if (!session) {
        return <Text color="yellow">! You are not currently logged in. Run `login` to authenticate.</Text>;
    }

    let profile = {
        username: session.user.username || 'Unknown',
        plan: 'free',
        tokens: 0,
        workspaceId: session.workspace?.id || '',
        workspaceName: session.workspace?.name || 'Default Workspace',
    };
    let agentsCount = 0;

    try {
        const [meRes, agentsRes] = await Promise.all([
            apiClient.get('/terminal/ops/me'),
            apiClient.get('/terminal/ops/agents')
        ]);

        profile = {
            username: meRes.data.username || meRes.data.email || session.user.username || 'Unknown',
            plan: meRes.data.plan || 'free',
            tokens: meRes.data.tokens ?? 0,
            workspaceId: meRes.data.workspaceId || session.workspace?.id || '',
            workspaceName: session.workspace?.name || 'Default Workspace',
        };
        agentsCount = agentsRes.data.agents?.length ?? 0;
    } catch (err) {
        // Use fallback session data if either call fails
    }

    return (
        <Box flexDirection="column" paddingLeft={1}>
            <Text color="green" bold underline>WHOAMI (Session Info)</Text>
            <Newline />
            <Box>
                <Box width={16}><Text bold>User ID:</Text></Box>
                <Text color="cyan">{session.user.id}</Text>
            </Box>
            <Box>
                <Box width={16}><Text bold>Username:</Text></Box>
                <Text color="cyan">{profile.username}</Text>
            </Box>
            <Box>
                <Box width={16}><Text bold>Workspace:</Text></Box>
                <Text color="cyan">{profile.workspaceName} ({profile.workspaceId})</Text>
            </Box>
            <Box>
                <Box width={16}><Text bold>Plan:</Text></Box>
                <Text color="yellow" bold>{profile.plan.toUpperCase()}</Text>
            </Box>
            <Box>
                <Box width={16}><Text bold>Total Agents:</Text></Box>
                <Text color="magenta">{agentsCount}</Text>
            </Box>
            <Box>
                <Box width={16}><Text bold>Tokens Left:</Text></Box>
                <Text color="green">{profile.tokens.toLocaleString()}</Text>
            </Box>
            <Box>
                <Box width={16}><Text bold>Expires At:</Text></Box>
                <Text color="gray">{new Date(session.expiresAt).toLocaleString()}</Text>
            </Box>
        </Box>
    );
};
