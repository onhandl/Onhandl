export const GOSSIP_CATALOGS: Record<string, { label: string; color: string; interfaces: string[] }> = {
    defi: {
        label: 'DeFi',
        color: '#f59e0b',
        interfaces: [
            'swap_tokens', 'lend_asset', 'borrow_asset', 'check_APY',
            'monitor_portfolio', 'yield_farm', 'liquidity_provide', 'price_oracle',
        ],
    },
    social: {
        label: 'Social',
        color: '#8b5cf6',
        interfaces: [
            'send_message', 'post_update', 'fetch_feed', 'notify_user',
            'broadcast', 'webhook', 'email_notify', 'sms_notify',
        ],
    },
    operations: {
        label: 'Operations',
        color: '#10b981',
        interfaces: [
            'run_workflow', 'execute_node', 'schedule_task', 'monitor_status',
            'trigger_event', 'data_transform', 'batch_process', 'health_check',
        ],
    },
    blockchain: {
        label: 'Blockchain',
        color: '#3b82f6',
        interfaces: [
            'sign_transaction', 'query_balance', 'deploy_contract', 'read_contract',
            'send_transaction', 'watch_events', 'gas_estimate', 'nonce_manage',
        ],
    },
    data: {
        label: 'Data',
        color: '#06b6d4',
        interfaces: [
            'fetch_data', 'store_data', 'query_db', 'cache_set',
            'cache_get', 'stream_data', 'transform_data', 'validate_schema',
        ],
    },
};

export const CATALOG_COLORS: Record<string, string> = Object.fromEntries(
    Object.entries(GOSSIP_CATALOGS).map(([k, v]) => [k, v.color])
);
