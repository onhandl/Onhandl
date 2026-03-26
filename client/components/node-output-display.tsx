'use client';

interface NodeOutputDisplayProps {
  nodeType: string;
  nodeName: string;
  outputData: any;
}

export default function NodeOutputDisplay({
  nodeType,
  nodeName,
  outputData,
}: NodeOutputDisplayProps) {
  if (!outputData) return null;

  // Different display based on node type
  switch (nodeType) {
    case 'output':
      if (nodeName === 'WhatsApp Output') {
        return <WhatsAppOutputNodeDisplay nodeName={nodeName} outputData={outputData} />;
      }
      return <OutputNodeDisplay nodeName={nodeName} outputData={outputData} />;
    case 'input':
      if (nodeName === 'WhatsApp Input') {
        return <WhatsAppInputNodeDisplay nodeName={nodeName} outputData={outputData} />;
      }
      return <GenericOutputDisplay outputData={outputData} />;
    case 'processing':
      return <ProcessingNodeDisplay nodeName={nodeName} outputData={outputData} />;
    case 'condition':
      return <ConditionNodeDisplay nodeName={nodeName} outputData={outputData} />;
    default:
      return <GenericOutputDisplay outputData={outputData} />;
  }
}

// Display for output nodes
function OutputNodeDisplay({ nodeName, outputData }: { nodeName: string; outputData: any }) {
  if (nodeName === 'Text Output') {
    return (
      <div className="mt-2 p-2 bg-gray-50 border rounded-md">
        <div className="text-xs text-black-500 mb-1">Output Preview:</div>
        <div className="text-sm whitespace-pre-wrap">
          {outputData.displayText || 'No output text'}
        </div>
      </div>
    );
  }

  if (nodeName === 'Chart Output') {
    return (
      <div className="mt-2 p-2 bg-gray-50 border rounded-md">
        <div className="text-xs text-black-500 mb-1">Chart Preview ({outputData.chartType}):</div>
        <div className="text-sm italic">Chart visualization would appear here</div>
      </div>
    );
  }

  return <GenericOutputDisplay outputData={outputData} />;
}

// Update the output display to show API connection status
function ProcessingNodeDisplay({ nodeName, outputData }: { nodeName: string; outputData: any }) {
  if (nodeName === 'Text Processor' && outputData.result) {
    return (
      <div className="mt-2 p-2 bg-gray-50 border rounded-md max-h-40 overflow-y-scroll pb-2">
        <div className="text-xs text-black-500 mb-1 flex items-center justify-between">
          <span>Processed with {outputData.model || 'AI'}</span>
          {outputData.isSimulation !== undefined && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${outputData.isSimulation ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}
            >
              {outputData.isSimulation ? 'Simulated' : 'API'}
            </span>
          )}
        </div>
        <div className="text-sm font-mono whitespace-pre-wrap">{outputData.result}</div>

        {outputData.tokenUsage && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs text-black-500">Token Usage:</div>
            <div className="grid grid-cols-3 gap-1 text-xs">
              <div>Prompt: {outputData.tokenUsage.prompt_tokens}</div>
              <div>Completion: {outputData.tokenUsage.completion_tokens}</div>
              <div>Total: {outputData.tokenUsage.total_tokens}</div>
            </div>
            <div className="text-xs text-black-500 mt-1">
              Processing Time: {outputData.processingTime}
            </div>
          </div>
        )}
      </div>
    );
  }

  return <GenericOutputDisplay outputData={outputData} />;
}

// Display for condition nodes
function ConditionNodeDisplay({ nodeName, outputData }: { nodeName: string; outputData: any }) {
  if (nodeName === 'If Condition') {
    const result = outputData.true ? 'True' : 'False';
    return (
      <div className="mt-2 p-2 bg-gray-50 border rounded-md">
        <div className="text-xs text-black-500 mb-1">Condition Result:</div>
        <div
          className={`text-sm font-medium ${outputData.true ? 'text-green-600' : 'text-red-600'}`}
        >
          {result}
        </div>
      </div>
    );
  }

  return <GenericOutputDisplay outputData={outputData} />;
}

// Generic display for any output data
function GenericOutputDisplay({ outputData }: { outputData: any }) {
  return (
    <div className="mt-2 p-2 bg-gray-50 border rounded-md">
      <div className="text-xs text-black-500 mb-1">Output Data:</div>
      <pre className="text-xs overflow-auto max-h-20">{JSON.stringify(outputData, null, 2)}</pre>
    </div>
  );
}

// Display for WhatsApp input nodes
function WhatsAppInputNodeDisplay({ nodeName, outputData }: { nodeName: string; outputData: any }) {
  return (
    <div className="mt-2 p-2 bg-gray-50 border rounded-md">
      <div className="text-xs text-black-500 mb-1 flex items-center justify-between">
        <span>WhatsApp Message Received</span>
        {outputData.metadata?.isSimulated && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Simulated</span>
        )}
      </div>
      <div className="text-sm whitespace-pre-wrap">
        {outputData.message || 'No message content'}
      </div>
      <div className="mt-1 text-xs text-black-500">From: {outputData.sender}</div>
      {outputData.metadata && (
        <div className="mt-1 text-xs text-black-500">
          Timestamp: {new Date(outputData.metadata.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// Display for WhatsApp output nodes
function WhatsAppOutputNodeDisplay({
  nodeName,
  outputData,
}: {
  nodeName: string;
  outputData: any;
}) {
  return (
    <div className="mt-2 p-2 bg-gray-50 border rounded-md">
      <div className="text-xs text-black-500 mb-1 flex items-center justify-between">
        <span>WhatsApp Message Status</span>
        <span
          className={`text-xs px-1.5 py-0.5 rounded ${outputData.status === 'sent'
              ? 'bg-green-100 text-green-700'
              : outputData.status === 'simulated'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-red-100 text-red-700'
            }`}
        >
          {outputData.status}
        </span>
      </div>
      {outputData.messageDetails && (
        <>
          <div className="text-sm font-medium">To: {outputData.messageDetails.recipient}</div>
          <div className="text-sm whitespace-pre-wrap">{outputData.messageDetails.content}</div>
          <div className="mt-1 text-xs text-black-500">
            Type: {outputData.messageDetails.messageType}
          </div>
          {outputData.messageId && (
            <div className="mt-1 text-xs text-black-500">Message ID: {outputData.messageId}</div>
          )}
        </>
      )}
      {outputData.error && (
        <div className="mt-1 text-xs text-red-500">Error: {outputData.error}</div>
      )}
    </div>
  );
}
