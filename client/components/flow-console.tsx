'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, XCircle, Terminal, Copy, Download } from 'lucide-react';
import { Button, ScrollArea, Tabs, TabsContent, TabsList, TabsTrigger, useToast } from '@/components/ui';
import { useFlow } from '@/contexts/FlowContext';
import { useSimulation } from '@/contexts/SimulationContext';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success' | 'warning';
  nodeId?: string;
  nodeName?: string;
}

export default function FlowConsole() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { nodes } = useFlow();
  const { isSimulating } = useSimulation();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Collect logs from all nodes
  useEffect(() => {
    const allLogs: LogEntry[] = [];

    nodes.forEach((node) => {
      if (node.data.consoleOutput && Array.isArray(node.data.consoleOutput)) {
        node.data.consoleOutput.forEach((logMessage: string) => {
          // Parse the timestamp from the log message if it exists
          const timestampMatch = logMessage.match(/\[(.*?)\]/);
          const timestamp = timestampMatch ? timestampMatch[1] : new Date().toLocaleTimeString();

          // Determine log type based on content
          let type: 'info' | 'error' | 'success' | 'warning' = 'info';
          if (logMessage.toLowerCase().includes('error')) type = 'error';
          else if (logMessage.toLowerCase().includes('success')) type = 'success';
          else if (logMessage.toLowerCase().includes('warning')) type = 'warning';

          // Clean the message by removing the timestamp prefix if it exists
          const message = timestampMatch
            ? logMessage.replace(timestampMatch[0], '').trim()
            : logMessage;

          allLogs.push({
            timestamp,
            message,
            type,
            nodeId: node.id,
            nodeName: node.data.name as any,
          });
        });
      }
    });

    // Sort logs by timestamp (newest first)
    allLogs.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    setLogs(allLogs);
  }, [nodes]);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (scrollRef.current && isExpanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isExpanded]);

  // Handle simulation start/stop feedback
  const prevIsSimulating = useRef(isSimulating);
  useEffect(() => {
    if (prevIsSimulating.current && !isSimulating) {
      const stopLog: LogEntry = {
        timestamp: new Date().toLocaleTimeString(),
        message: 'Simulation has been stopped/paused by user.',
        type: 'warning',
      };
      setLogs(prev => [stopLog, ...prev]);
    }
    if (!prevIsSimulating.current && isSimulating) {
      setIsExpanded(true);
    }
    prevIsSimulating.current = isSimulating;
  }, [isSimulating]);

  const clearLogs = () => {
    setLogs([]);
  };

  const copyLogs = () => {
    const logText = logs
      .map((log) => `[${log.timestamp}] ${log.nodeName ? `[${log.nodeName}] ` : ''}${log.message}`)
      .join('\n');

    navigator.clipboard.writeText(logText);
    toast({
      title: 'Logs copied',
      description: 'Console logs have been copied to clipboard',
    });
  };

  const downloadLogs = () => {
    const logText = logs
      .map((log) => `[${log.timestamp}] ${log.nodeName ? `[${log.nodeName}] ` : ''}${log.message}`)
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FlawLess-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter logs based on active tab
  const filteredLogs = activeTab === 'all' ? logs : logs.filter((log) => log.type === activeTab);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-2xl transition-all duration-300 z-10 ${isExpanded ? 'h-64' : 'h-10'}`}
    >
      <div className="flex items-center justify-between px-6 h-10 border-b border-border bg-muted/30">
        <div className="flex items-center">
          <Terminal className="h-4 w-4 mr-2 text-primary" />
          <span className="text-sm font-bold uppercase tracking-wider">Flow Console</span>
          <span className="ml-3 text-xs font-medium">
            {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {isExpanded && (
            <>
              <Button variant="ghost" size="icon" onClick={clearLogs} title="Clear console">
                <XCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={copyLogs} title="Copy logs">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={downloadLogs} title="Download logs">
                <Download className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse console' : 'Expand console'}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="h-[calc(100%-2.5rem)]">
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full"
          >
            <div className="border-b border-border bg-muted/20">
              <TabsList className="px-4 h-10 bg-transparent">
                <TabsTrigger value="all" className="data-[state=active]:text-primary font-medium">All</TabsTrigger>
                <TabsTrigger value="info" className="data-[state=active]:text-primary font-medium">Info</TabsTrigger>
                <TabsTrigger value="success" className="data-[state=active]:text-primary font-medium">Success</TabsTrigger>
                <TabsTrigger value="warning" className="data-[state=active]:text-accent-foreground font-medium">Warning</TabsTrigger>
                <TabsTrigger value="error" className="data-[state=active]:text-destructive font-medium">Error</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="h-[calc(100%-2.5rem)] p-0 m-0">
              <ScrollArea className="h-full p-4" ref={scrollRef}>
                {filteredLogs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm italic py-10">
                    No logs to display
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredLogs.map((log, index) => (
                      <div
                        key={index}
                        className={`text-sm font-mono p-3 rounded-lg bg-muted/30 border-l-4 mb-2 transition-colors hover:bg-muted/50 ${log.type === 'error'
                          ? 'border-destructive text-destructive'
                          : log.type === 'success'
                            ? 'border-primary text-foreground'
                            : log.type === 'warning'
                              ? 'border-accent text-accent-foreground'
                              : 'border-muted-foreground/30 text-foreground'
                          }`}
                      >
                        <span className="font-medium opacity-70">[{log.timestamp}]</span>
                        {log.nodeName && (
                          <span className="text-primary font-bold ml-2">
                            [{log.nodeName}]
                          </span>
                        )}
                        <span className="ml-1">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
