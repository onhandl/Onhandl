import { ToolRegistry } from '../../infrastructure/database/models/ToolRegistry';
import { allBlockchainTools } from '../../infrastructure/blockchain/index';

export async function syncBlockchainToolsToDb() {
    try {
        console.log('[ToolSyncer] Sycing registered blockchain tools to MongoDB...');
        for (const tool of allBlockchainTools) {
            let network = 'Unknown';
            let category = 'General';
            let subCategory = '';

            // Parse deterministic names for hierarchical folder grouping
            if (tool.name.startsWith('blockchain.ckb.')) {
                network = 'CKB';
                const parts = tool.name.split('.');
                category = parts[2] === 'node' ? 'Nodes' : (parts[2] === 'rpc' ? 'RPC' : (parts[2] === 'indexer' ? 'Indexer' : 'Transactions'));
                subCategory = parts[3] ? parts[2] : '';
            } else if (tool.name.startsWith('blockchain.ckb_fiber.')) {
                network = 'CKB';
                category = 'Fiber';
                subCategory = tool.name.split('.')[2] || '';
            }

            await ToolRegistry.updateOne(
                { name: tool.name },
                {
                    $set: {
                        name: tool.name,
                        description: tool.description,
                        network,
                        category,
                        subCategory,
                        schemaDef: tool.uiSchema || null,
                        isActive: true
                    }
                },
                { upsert: true }
            );
        }
        console.log(`[ToolSyncer] Successfully synced ${allBlockchainTools.length} tools to Database.`);
    } catch (error) {
        console.error('[ToolSyncer] Error syncing tools to database:', error);
    }
}
