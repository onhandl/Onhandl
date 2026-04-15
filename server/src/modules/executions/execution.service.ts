import { ExecutionRepository } from './execution.repository';
import { eventBus } from '../../infrastructure/events/eventBus';
import { FlowEngine } from '../../core/engine/FlowEngine';
import { simulateInputNode } from '../../core/engine/simulators/input-node-simulator';
import { simulateProcessingNode } from '../../core/engine/simulators/processing-node-simulator';
import { simulateActionNode } from '../../core/engine/simulators/action-node-simulator';
import { simulateConditionNode } from '../../core/engine/simulators/condition-node-simulator';
import { simulateOutputNode } from '../../core/engine/simulators/output-node-simulator';
import { simulateTelegramSendMessage } from '../../core/engine/simulators/telegram-node-simulator';
import { simulateWhatsAppSendMessage } from '../../core/engine/simulators/whatsapp-node-simulator';
import { simulateCryptoWallet } from '../../core/engine/simulators/crypto/wallet-simulator';
import { simulateCryptoTrade } from '../../core/engine/simulators/crypto/trade-simulator';
import { simulateBlockchainNode } from '../../core/engine/simulators/blockchain-node-simulator';

export const ExecutionService = {
    async getById(id: string) {
        const execution = await ExecutionRepository.findById(id);
        if (!execution) throw Object.assign(new Error('Execution not found'), { code: 404 });
        return execution;
    },

    async list(agentId?: string) {
        const filter = agentId ? { agentDefinitionId: agentId } : {};
        return ExecutionRepository.find(filter);
    },

    async start(agentId: string, triggeredBy?: string, initialState?: any) {
        const execution = await ExecutionRepository.create({
            agentDefinitionId: agentId,
            triggeredBy,
            state: initialState || {},
            status: 'pending',
        });
        eventBus.emit('agent.run.started', { executionId: execution._id, agentId });
        FlowEngine.runExecution(execution._id.toString()).catch(console.error);
        return execution;
    },

    async simulateNode(data: {
        node?: any;
        nodeData?: any;
        nodeType?: string;
        inputValues?: Record<string, unknown>;
        agentId?: string;
    }) {
        const { node, nodeData, nodeType, inputValues = {}, agentId } = data;
        const finalNode = node || { type: nodeType, data: nodeData };

        if (!finalNode || !finalNode.type) throw Object.assign(new Error('Node and Node Type are required'), { code: 400 });

        const consoleOutput: string[] = [];
        let agent = null;
        if (agentId) agent = await ExecutionRepository.findAgentById(agentId);

        let output;
        switch (finalNode.type) {
            case 'input': output = simulateInputNode(finalNode.data, inputValues); break;
            case 'processing': output = await simulateProcessingNode(finalNode.data, inputValues, consoleOutput, agent); break;
            case 'action': output = await simulateActionNode(finalNode.data, inputValues); break;
            case 'condition': output = simulateConditionNode(finalNode.data, inputValues); break;
            case 'output': output = simulateOutputNode(finalNode.data, inputValues); break;
            case 'telegram': output = await simulateTelegramSendMessage(finalNode.data, inputValues, consoleOutput); break;
            case 'whatsapp': output = await simulateWhatsAppSendMessage(finalNode.data, inputValues, consoleOutput); break;
            case 'crypto_wallet': output = await simulateCryptoWallet(finalNode.data, inputValues, agent); break;
            case 'crypto_trade': output = simulateCryptoTrade(finalNode.data, inputValues); break;
            case 'blockchain_tool': output = await simulateBlockchainNode(finalNode.data, inputValues, consoleOutput); break;
            default: throw Object.assign(new Error(`Unsupported node type: ${finalNode.type}`), { code: 400 });
        }

        return { ...output, consoleOutput };
    },
};
