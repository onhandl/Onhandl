import { loginCommand } from './login/index.js';
import { exitCommand } from './exit/index.js';
import { agentCommand } from './agent/index.js';
import { execCommand } from './exec/index.js';
import { chatCommand, chatMessageCommand } from './chat/index.js';
import { whoamiCommand } from './whoami/index.js';
import { helpCommand } from './help/index.js';
import { logoutCommand } from './logout/index.js';

export const COMMAND_REGISTRY: Record<string, (args: string[], context: any) => Promise<React.ReactNode> | React.ReactNode> = {
    help: helpCommand,
    login: loginCommand,
    logout: logoutCommand,
    exit: exitCommand,
    whoami: whoamiCommand,
    agent: agentCommand,
    exec: execCommand,
    chat: chatCommand
};

export const executeCommand = async (commandLine: string, context: any): Promise<React.ReactNode> => {
    const parts = commandLine.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    if (!cmd) return null;

    const handler = COMMAND_REGISTRY[cmd];
    if (!handler) {
        throw new Error(`Command not found: ${cmd}`);
    }

    return await handler(args, context);
};
