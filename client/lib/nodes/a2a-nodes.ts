export const a2aNodes = [
  {
    type: 'agent_call',
    category: 'a2a',
    name: 'Agent Call',
    description: 'Send a structured A2A message to another registered Onhandl agent',
    icon: 'Bot',
    inputs: [
      {
        key: 'recipientAgentId',
        label: 'Recipient Agent ID',
        type: 'string',
        placeholder: 'Agent definition ID',
        value: '',
      },
      {
        key: 'performative',
        label: 'Performative',
        type: 'select',
        options: ['request', 'inform', 'confirm', 'refuse', 'query', 'propose'],
        value: 'request',
      },
      {
        key: 'content',
        label: 'Message Content',
        type: 'string',
        placeholder: 'What should the agent do?',
        value: '',
      },
      {
        key: 'conversationId',
        label: 'Conversation ID (optional)',
        type: 'string',
        placeholder: 'Thread / conversation identifier',
        value: '',
      },
    ],
    outputs: [
      { key: 'messageId', label: 'Message ID', type: 'string' },
      { key: 'delivered', label: 'Delivered', type: 'boolean' },
      { key: 'conversationId', label: 'Conversation ID', type: 'string' },
      { key: 'status', label: 'Delivery Status', type: 'string' },
    ],
    meta: { secure: true, requiresRegistry: true },
  },
];
