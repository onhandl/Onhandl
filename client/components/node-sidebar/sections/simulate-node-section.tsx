'use client';

import { useState } from 'react';
import {
  IconPlayerPlay, IconChevronDown, IconChevronUp,
  IconCircleCheck, IconCircleX, IconLoader2, IconTerminal2,
} from '@tabler/icons-react';
import { Button } from '@/components/ui';
import { simulationApi } from '@/api/simulation-api';
import type { NodeOutput } from '@/lib/nodes/types';

interface SimulateNodeSectionProps {
  nodeId: string;
  nodeType: string;
  nodeData: Record<string, unknown>;
  agentId?: string;
}

interface SelectOption { label: string; value: string; }

interface InputField {
  key: string;
  label: string;
  type: string;
  value?: unknown;
  placeholder?: string;
  options?: string[] | SelectOption[];
}

export function SimulateNodeSection({ nodeId, nodeType, nodeData, agentId }: SimulateNodeSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NodeOutput<object> | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Internal selectors — not real tool parameters, excluded from simulation payload
  const META_KEYS = new Set(['network', 'action_group', 'tool_lookup', 'payload', 'walletData', 'walletInfo', 'outputData']);

  const allInputs: InputField[] = (nodeData.inputs as InputField[] | undefined) ?? [];
  const inputs = allInputs.filter(inp => !META_KEYS.has(inp.key));

  const handleChange = (key: string, val: unknown) => {
    setInputValues(prev => ({ ...prev, [key]: val as string }));
  };

  const resolvedInputValues = (): Record<string, unknown> => {
    const merged: Record<string, unknown> = {};
    inputs.forEach(inp => {
      const v = inputValues[inp.key] !== undefined ? inputValues[inp.key] : inp.value;
      if (v === '' || v === undefined || v === null) return; // skip empty — let tool defaults apply
      merged[inp.key] = v;
    });
    // Parse JSON strings for object-type fields
    Object.entries(merged).forEach(([k, v]) => {
      if (typeof v === 'string' && v.trim().startsWith('{')) {
        try { merged[k] = JSON.parse(v); } catch { /* keep as string */ }
      }
    });
    return merged;
  };

  const run = async () => {
    setLoading(true);
    setResult(null);
    setLogs([]);
    try {
      const res = await simulationApi.simulateNode({
        nodeType,
        nodeData,
        inputValues: resolvedInputValues(),
        agentId,
      });
      setResult(res.output);
      setLogs(res.consoleOutput);
    } catch (err: any) {
      setResult({
        result: {},
        status: 'error',
        confidence: 0,
        timestamp: new Date().toISOString(),
        request_id: '',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 border border-border/60 rounded-xl overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-primary/5 hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <IconTerminal2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Simulate Node</span>
        </div>
        {isOpen ? <IconChevronUp className="w-3.5 h-3.5 text-primary" /> : <IconChevronDown className="w-3.5 h-3.5 text-primary" />}
      </button>

      {isOpen && (
        <div className="p-4 space-y-4 bg-muted/20">
          {/* Input overrides */}
          {inputs.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Override Inputs</p>
              {inputs.map(inp => {
                // Normalise options to {label, value} pairs
                const opts: SelectOption[] = (inp.options ?? []).map(o =>
                  typeof o === 'string' ? { label: o, value: o } : o
                );
                const currentVal = String(inputValues[inp.key] ?? inp.value ?? '');

                return (
                  <div key={inp.key} className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">{inp.label}</label>

                    {inp.type === 'boolean' ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={inputValues[inp.key] !== undefined ? Boolean(inputValues[inp.key]) : Boolean(inp.value)}
                          onChange={e => handleChange(inp.key, e.target.checked)}
                          className="rounded border-border"
                        />
                        <span className="text-[10px] text-muted-foreground">{inp.label}</span>
                      </label>

                    ) : inp.type === 'radio' && opts.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {opts.map(o => (
                          <label key={o.value} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="radio"
                              name={inp.key}
                              value={o.value}
                              checked={currentVal === o.value}
                              onChange={() => handleChange(inp.key, o.value)}
                              className="accent-primary"
                            />
                            <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
                              {o.label}
                            </span>
                          </label>
                        ))}
                      </div>

                    ) : inp.type === 'select' && opts.length > 0 ? (
                      <select
                        value={currentVal}
                        onChange={e => handleChange(inp.key, e.target.value)}
                        className="w-full text-xs border border-border/60 rounded-lg px-2 py-1.5 bg-card focus:outline-none focus:ring-1 focus:ring-primary/30"
                      >
                        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>

                    ) : (
                      <input
                        type="text"
                        value={currentVal}
                        placeholder={inp.placeholder ?? `Enter ${inp.label}...`}
                        onChange={e => handleChange(inp.key, e.target.value)}
                        className="w-full text-xs border border-border/60 rounded-lg px-2 py-1.5 bg-card focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Run button */}
          <Button
            size="sm"
            className="w-full h-8 text-xs gap-1.5"
            onClick={run}
            disabled={loading}
          >
            {loading ? (
              <><IconLoader2 className="w-3 h-3 animate-spin" /> Running...</>
            ) : (
              <><IconPlayerPlay className="w-3 h-3" /> Run Node</>
            )}
          </Button>

          {/* Result */}
          {result && (
            <div className={`rounded-xl border overflow-hidden ${result.status === 'error' ? 'border-destructive/30' : 'border-primary/20'}`}>
              {/* Status bar */}
              <div className={`px-3 py-2 flex items-center justify-between ${result.status === 'error' ? 'bg-destructive/5' : 'bg-primary/5'}`}>
                <div className="flex items-center gap-1.5">
                  {result.status === 'success' ? (
                    <IconCircleCheck className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <IconCircleX className="w-3.5 h-3.5 text-destructive" />
                  )}
                  <span className={`text-[11px] font-semibold ${result.status === 'error' ? 'text-destructive' : 'text-green-600'}`}>
                    {result.status === 'success' ? 'Success' : 'Error'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>conf: {(result.confidence * 100).toFixed(0)}%</span>
                  {result.metadata?.executionMs !== undefined && (
                    <span>{result.metadata.executionMs}ms</span>
                  )}
                  {result.metadata?.modelUsed && (
                    <span className="truncate max-w-[80px]">{result.metadata.modelUsed}</span>
                  )}
                </div>
              </div>

              {/* Error message */}
              {result.status === 'error' && result.message && (
                <div className="px-3 py-2 text-xs text-destructive bg-destructive/5 border-t border-destructive/10">
                  {result.message}
                </div>
              )}

              {/* Result JSON toggle */}
              {result.status === 'success' && (
                <div className="border-t border-primary/10">
                  <button
                    onClick={() => setShowResult(v => !v)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] text-muted-foreground hover:bg-muted/20"
                  >
                    <span>Output Data</span>
                    {showResult ? <IconChevronUp className="w-3 h-3" /> : <IconChevronDown className="w-3 h-3" />}
                  </button>
                  {showResult && (
                    <pre className="text-[10px] font-mono px-3 py-2 overflow-auto max-h-40 bg-muted/20 text-foreground/80">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Console logs toggle */}
          {logs.length > 0 && (
            <div className="border border-border/40 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowLogs(v => !v)}
                className="w-full flex items-center justify-between px-3 py-1.5 bg-muted/30 text-[10px] text-muted-foreground hover:bg-muted/50"
              >
                <span>Console ({logs.length} entries)</span>
                {showLogs ? <IconChevronUp className="w-3 h-3" /> : <IconChevronDown className="w-3 h-3" />}
              </button>
              {showLogs && (
                <div className="max-h-32 overflow-auto bg-black/80 p-2 space-y-0.5">
                  {logs.map((log, i) => (
                    <div key={i} className={`text-[10px] font-mono ${
                      log.includes('❌') ? 'text-red-400' :
                      log.includes('✅') ? 'text-green-400' :
                      log.includes('⚠️') ? 'text-yellow-400' :
                      'text-gray-300'
                    }`}>
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
