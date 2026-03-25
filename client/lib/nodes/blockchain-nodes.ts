export const blockchainNodes = [
    {
        type: 'blockchain_tool',
        category: 'action',
        name: 'Blockchain Action',
        description: 'Execute read/write operations across multiple blockchains',
        icon: 'Link',
        inputs: [
            {
                key: 'network',
                label: 'Blockchain Network',
                type: 'select',
                options: ['CKB', 'Fiber', 'Ethereum', 'Base', 'Solana'],
                value: 'CKB',
            },
            {
                key: 'action_group',
                label: 'Module / Domain',
                type: 'select',
                options: ['rpc', 'indexer', 'tx_builder', 'anchoring', 'node_admin', 'channel', 'biscuit', 'invoice', 'payment'],
                value: 'rpc',
            },
            {
                key: 'tool_lookup',
                label: 'Tool Name',
                type: 'string',
                placeholder: 'e.g. get_tip_header',
                value: 'get_tip_header',
            },
            {
                key: 'payload',
                label: 'Payload (JSON)',
                type: 'string',
                placeholder: '{"tx_hash": "0x..."}',
                value: '{}',
            },
        ],
        outputs: [
            { key: 'result', label: 'Action Result', type: 'object' },
            { key: 'status', label: 'Status', type: 'string' },
        ],
        meta: { secure: true },
    },
];
