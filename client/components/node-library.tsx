import { useState, useEffect } from 'react';
import { X, Layers3, FileInput, Workflow, FileOutput, ArrowLeftRight, ChevronRight, Folder, Box, Bot } from 'lucide-react';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { toolsApi } from '@/api/tools-api';

import { nodeDefinitions } from '@/lib/nodes';
import { motion, AnimatePresence } from 'framer-motion';

interface NodeLibraryProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onTapAdd?: (nodeType: string, nodeData: any) => void;
}

export default function NodeLibrary({ isOpen, setIsOpen, onTapAdd }: NodeLibraryProps) {
  const onClose = () => setIsOpen(false);
  const [activeTab, setActiveTab] = useState('all');
  const [blockchainTools, setBlockchainTools] = useState<any[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ CKB: true });

  useEffect(() => {
    if (isOpen) {
      toolsApi.getBlockchainTools()
        .then((res: any) => setBlockchainTools(res.data?.tools || []))
        .catch(console.error);
    }
  }, [isOpen]);

  const toggleFolder = (key: string) => {
    setExpandedFolders(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const categories = [
    { id: 'all', label: 'All', icon: Layers3 },
    { id: 'input', label: 'Input', icon: FileInput },
    { id: 'processing', label: 'Processing', icon: Workflow },
    { id: 'output', label: 'Output', icon: FileOutput },
    { id: 'blockchain', label: 'Blockchain', icon: Box },
    { id: 'a2a', label: 'A2A', icon: Bot },
  ];

  // Group blockchain tools by Network -> Category -> SubCategory
  const groupedTools = blockchainTools.reduce((acc, tool) => {
    const net = tool.network || 'Other';
    const cat = tool.category || 'General';
    const sub = tool.subCategory || '';

    if (!acc[net]) acc[net] = {};
    if (!acc[net][cat]) acc[net][cat] = {};
    if (sub) {
      if (!acc[net][cat][sub]) acc[net][cat][sub] = [];
      acc[net][cat][sub].push(tool);
    } else {
      if (!acc[net][cat]._root) acc[net][cat]._root = [];
      acc[net][cat]._root.push(tool);
    }
    return acc;
  }, {} as any);

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string, nodeData: any) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/nodeData', JSON.stringify({
      ...nodeData,
      type: nodeType // Ensure type is passed
    }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const renderToolNode = (tool: any) => {
    const toolInputs = tool.schemaDef
      ? Object.entries(tool.schemaDef).map(([key, config]: [string, any]) => ({
          key, label: config.label, type: config.type,
          placeholder: config.placeholder || '', value: ''
        }))
      : [];
    const toolOutputs = [
      { key: 'result', label: 'Result', type: 'object' },
      { key: 'status', label: 'Status', type: 'string' },
    ];
    const nodeData = {
      name: tool.name.split('.').pop(),
      description: tool.description,
      tool: tool.name,
      chain: tool.network,
      params: {},
      inputs: toolInputs,
      outputs: toolOutputs,
    };

    return (
      <motion.div
        key={tool.name}
        whileHover={{ scale: 1.02, x: 4 }}
        className="p-3 mb-2 border border-border rounded-lg cursor-grab bg-card hover:bg-muted/50 transition-all shadow-sm group"
        draggable
        onClick={() => { onTapAdd?.('blockchain_tool', nodeData); setIsOpen(false); }}
        onDragStart={(event: any) => onDragStart(event, 'blockchain_tool', nodeData)}
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-md group-hover:bg-primary/20 transition-colors">
            <Box className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-xs truncate">{tool.name.split('.').pop()}</div>
            <div className="text-[10px] line-clamp-1">{tool.description}</div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed md:relative inset-x-0 bottom-[60px] md:bottom-auto top-0 md:top-auto md:w-96 w-full bg-card rounded-t-xl md:rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col h-[70vh] md:h-[600px] z-40"
        >
          <div className="flex justify-between items-center p-5 border-b border-border bg-muted/20">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-3">
                <Layers3 className="w-5 h-5 text-primary" />
                Node Library
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 md:hidden">Tap a node to add it · drag on desktop</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="w-full p-1 bg-muted/40 h-auto flex-wrap border-b border-border rounded-none justify-start px-2">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="text-[10px] px-2 py-1.5 data-[state=active]:bg-card flex items-center gap-2"
                >
                  <category.icon className="w-3 h-3" />
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-0 flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
              {/* Static node definitions — all tabs except pure blockchain tools */}
              {(() => {
                const filtered = nodeDefinitions.filter(
                  node => activeTab === 'all' || node.category === activeTab
                );
                if (filtered.length === 0) return null;
                return (
                  <div className="space-y-2">
                    {filtered.map((node, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 border border-border rounded-xl cursor-grab bg-card hover:bg-muted/50 transition-all shadow-sm group"
                        draggable
                        onClick={() => { onTapAdd?.(node.type, node); setIsOpen(false); }}
                        onDragStart={(event: any) => onDragStart(event, node.type, node)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <div className="font-bold text-sm group-hover:text-primary transition-colors">{node.name}</div>
                            <div className="text-xs line-clamp-2">{node.description}</div>
                          </div>
                          <Layers3 className="w-4 h-4 group-hover:text-primary transition-colors" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                );
              })()}

              {/* API blockchain tools tree — shown in All and Blockchain tabs */}
              {(activeTab === 'blockchain' || activeTab === 'all') && Object.keys(groupedTools).length > 0 && (
                <div className="space-y-1">
                  {activeTab === 'all' && (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 pb-1">Blockchain Tools</p>
                  )}
                  {Object.entries(groupedTools).map(([network, categories]: [string, any]) => (
                    <div key={network} className="space-y-1">
                      <button
                        onClick={() => toggleFolder(network)}
                        className="flex items-center gap-2 w-full text-left font-bold text-xs uppercase tracking-wider hover:text-foreground transition-colors py-1"
                      >
                        {expandedFolders[network] ? <ChevronRight className="w-3 h-3 rotate-90" /> : <ChevronRight className="w-3 h-3" />}
                        <Folder className="w-3 h-3 fill-primary/20 text-primary" />
                        {network}
                      </button>

                      {expandedFolders[network] && (
                        <div className="pl-3 border-l border-border/50 ml-1.5 space-y-3 mt-1">
                          {Object.entries(categories).map(([category, subs]: [string, any]) => (
                            <div key={category} className="space-y-1">
                              <button
                                onClick={() => toggleFolder(`${network}-${category}`)}
                                className="flex items-center gap-2 w-full text-left font-semibold text-[11px] text-muted-foreground/80 hover:text-foreground py-0.5"
                              >
                                {expandedFolders[`${network}-${category}`] ? <ChevronRight className="w-3 h-3 rotate-90" /> : <ChevronRight className="w-3 h-3" />}
                                {category}
                              </button>

                              {expandedFolders[`${network}-${category}`] && (
                                <div className="pl-2 space-y-2 mt-1">
                                  {subs._root?.map(renderToolNode)}
                                  {Object.entries(subs).filter(([k]) => k !== '_root').map(([sub, tools]: [string, any]) => (
                                    <div key={sub} className="space-y-1">
                                      <div className="text-[10px] items-center gap-1.5 font-medium text-muted-foreground/60 flex pl-1 py-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                        {sub}
                                      </div>
                                      <div className="pl-3">
                                        {tools.map(renderToolNode)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
