'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, XCircle, Terminal, Copy, Download, ChevronRight } from 'lucide-react';
import { Button, ScrollArea, Tabs, TabsContent, TabsList, TabsTrigger, useToast } from '@/components/ui';
import { useFlow } from '@/contexts/FlowContext';
import { useSimulation } from '@/contexts/SimulationContext';

type LogType = 'info' | 'error' | 'success' | 'warning' | 'output' | 'input' | 'done';

interface LogEntry {
  timestamp: string;
  message: string;
  type: LogType;
  nodeId?: string;
  nodeName?: string;
  isStructured?: boolean;   // [OUTPUT] / [INPUT] — expandable JSON
  expandedData?: string;    // raw JSON string for structured entries
}

function classifyLog(msg: string): LogType {
  if (msg.includes('[ERROR]') || msg.toLowerCase().includes('error') || msg.includes('❌')) return 'error';
  if (msg.includes('[OUTPUT]') || msg.includes('📤')) return 'output';
  if (msg.includes('[INPUT]') || msg.includes('📥')) return 'input';
  if (msg.includes('[DONE]') || msg.includes('✅')) return 'done';
  if (msg.toLowerCase().includes('success') || msg.includes('✅')) return 'success';
  if (msg.toLowerCase().includes('warn') || msg.includes('⚠️')) return 'warning';
  return 'info';
}

const TYPE_STYLES: Record<LogType, string> = {
  error:   'border-l-destructive text-destructive',
  success: 'border-l-primary text-foreground',
  warning: 'border-l-amber-400 text-amber-700',
  output:  'border-l-emerald-400 text-foreground',
  input:   'border-l-blue-400 text-foreground',
  done:    'border-l-primary/60 text-foreground',
  info:    'border-l-muted-foreground/30 text-foreground',
};

const TYPE_BADGE: Record<LogType, { label: string; cls: string }> = {
  error:   { label: 'ERR',    cls: 'bg-destructive/10 text-destructive' },
  success: { label: 'OK',     cls: 'bg-primary/10 text-primary' },
  warning: { label: 'WARN',   cls: 'bg-amber-500/10 text-amber-600' },
  output:  { label: 'OUT',    cls: 'bg-emerald-500/10 text-emerald-600' },
  input:   { label: 'IN',     cls: 'bg-blue-500/10 text-blue-600' },
  done:    { label: 'DONE',   cls: 'bg-primary/10 text-primary' },
  info:    { label: 'INFO',   cls: 'bg-muted/60 text-muted-foreground' },
};

function LogRow({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const badge = TYPE_BADGE[log.type];

  // Clean the raw message for display (strip emoji + tag prefix)
  const displayMsg = log.message
    .replace(/^\[(OUTPUT|INPUT|ERROR|DONE)\]\s*/i, '')
    .replace(/^(📤|📥|❌|✅)\s*/u, '');

  return (
    <div className={`text-xs font-mono p-2.5 rounded-lg bg-muted/20 border-l-4 mb-1.5 hover:bg-muted/30 transition-colors ${TYPE_STYLES[log.type]}`}>
      <div className="flex items-start gap-2">
        <span className="opacity-60 flex-shrink-0">[{log.timestamp}]</span>
        {log.nodeName && (
          <span className="text-primary font-bold flex-shrink-0">[{log.nodeName}]</span>
        )}
        <span className={`text-[9px] font-bold px-1 py-0.5 rounded flex-shrink-0 ${badge.cls}`}>
          {badge.label}
        </span>

        {log.isStructured ? (
          <div className="flex-1 min-w-0">
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-left w-full"
            >
              <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
              <span className="truncate">{displayMsg.substring(0, 80)}{displayMsg.length > 80 ? '…' : ''}</span>
            </button>
            {expanded && log.expandedData && (
              <pre className="mt-1.5 text-[10px] bg-black/10 rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap break-all">
                {(() => {
                  try {
                    // Extract and pretty-print the JSON portion
                    const jsonMatch = log.expandedData.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
                    if (jsonMatch) return JSON.stringify(JSON.parse(jsonMatch[0]), null, 2);
                  } catch { /* fall through */ }
                  return log.expandedData;
                })()}
              </pre>
            )}
          </div>
        ) : (
          <span className="flex-1 break-words">{displayMsg}</span>
        )}
      </div>
    </div>
  );
}

export default function FlowConsole() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | LogType>('all');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { nodes } = useFlow();
  const { isSimulating } = useSimulation();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const allLogs: LogEntry[] = [];

    nodes.forEach(node => {
      const outputs: string[] = Array.isArray(node.data.consoleOutput) ? node.data.consoleOutput as string[] : [];
      outputs.forEach(raw => {
        const tsMatch = raw.match(/\[(\d{1,2}:\d{2}:\d{2}(?:\s?[AP]M)?)\]/i);
        const ts = tsMatch ? tsMatch[1] : new Date().toLocaleTimeString();
        const type = classifyLog(raw);
        const isStructured = type === 'output' || type === 'input';
        const message = tsMatch ? raw.replace(tsMatch[0], '').trim() : raw;

        allLogs.push({
          timestamp: ts,
          message,
          type,
          nodeId: node.id,
          nodeName: node.data.name as string,
          isStructured,
          expandedData: isStructured ? message : undefined,
        });
      });
    });

    setLogs(allLogs);
  }, [nodes]);

  useEffect(() => {
    if (scrollRef.current && isExpanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isExpanded]);

  const prevIsSimulating = useRef(isSimulating);
  useEffect(() => {
    if (prevIsSimulating.current && !isSimulating) {
      setLogs(prev => [{
        timestamp: new Date().toLocaleTimeString(),
        message: 'Simulation stopped by user.',
        type: 'warning',
      }, ...prev]);
    }
    if (!prevIsSimulating.current && isSimulating) {
      setIsExpanded(true);
      setLogs(prev => [{
        timestamp: new Date().toLocaleTimeString(),
        message: 'Simulation started — listening for events…',
        type: 'info',
      }, ...prev]);
    }
    prevIsSimulating.current = isSimulating;
  }, [isSimulating]);

  const clearLogs = () => setLogs([]);

  const copyLogs = () => {
    const text = logs.map(l => `[${l.timestamp}]${l.nodeName ? ` [${l.nodeName}]` : ''} ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    toast({ title: 'Logs copied', description: 'Console logs copied to clipboard' });
  };

  const downloadLogs = () => {
    const text = logs.map(l => `[${l.timestamp}]${l.nodeName ? ` [${l.nodeName}]` : ''} ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onhandl-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const TAB_FILTERS: { value: 'all' | LogType; label: string }[] = [
    { value: 'all',     label: 'All' },
    { value: 'output',  label: 'Output' },
    { value: 'input',   label: 'Input' },
    { value: 'done',    label: 'Done' },
    { value: 'error',   label: 'Errors' },
    { value: 'warning', label: 'Warnings' },
  ];

  const filteredLogs = activeTab === 'all' ? logs : logs.filter(l => l.type === activeTab);
  const errorCount = logs.filter(l => l.type === 'error').length;

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-2xl transition-all duration-300 z-10 ${isExpanded ? 'h-72' : 'h-10'}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider">Flow Console</span>
          <span className="text-[10px] text-muted-foreground font-medium">
            {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
          </span>
          {errorCount > 0 && (
            <span className="text-[9px] font-bold bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">
              {errorCount} err
            </span>
          )}
          {isSimulating && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isExpanded && (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearLogs} title="Clear">
                <XCircle className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyLogs} title="Copy">
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={downloadLogs} title="Download">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsExpanded(v => !v)}>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="h-[calc(100%-2.5rem)]">
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'all' | LogType)} className="h-full">
            <div className="border-b border-border bg-muted/10 overflow-x-auto">
              <TabsList className="px-3 h-9 bg-transparent gap-0.5">
                {TAB_FILTERS.map(({ value, label }) => (
                  <TabsTrigger key={value} value={value} className="text-[10px] h-7 px-2.5 data-[state=active]:text-primary font-medium">
                    {label}
                    {value === 'error' && errorCount > 0 && (
                      <span className="ml-1 text-[9px] bg-destructive/20 text-destructive px-1 rounded-full">{errorCount}</span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="h-[calc(100%-2.25rem)] p-0 m-0">
              <ScrollArea className="h-full p-3" ref={scrollRef}>
                {filteredLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-20 gap-1 text-muted-foreground">
                    <Terminal className="w-5 h-5 opacity-30" />
                    <span className="text-xs">No {activeTab === 'all' ? '' : activeTab + ' '}logs yet</span>
                  </div>
                ) : (
                  <div>
                    {filteredLogs.map((log, i) => <LogRow key={i} log={log} />)}
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
