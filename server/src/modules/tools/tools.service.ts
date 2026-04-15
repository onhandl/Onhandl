import { ToolRepository } from './tools.repository';

export const ToolService = {
    async listGrouped() {
        const tools = await ToolRepository.listActive();
        const grouped: Record<string, any> = {};
        for (const tool of tools) {
            const network = tool.network || 'Unknown';
            const category = tool.category || 'Uncategorized';
            if (!grouped[network]) grouped[network] = {};
            if (!grouped[network][category]) grouped[network][category] = [];
            grouped[network][category].push({
                name: tool.name,
                description: tool.description,
                schemaDef: tool.schemaDef,
            });
        }
        return { tools, grouped };
    },
};
