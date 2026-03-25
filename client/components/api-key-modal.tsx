'use client';

import { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiApi } from '@/api';
import { Button, Input, Label, Tabs, TabsContent, TabsList, TabsTrigger, useToast } from '@/components/ui';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (provider: string, apiKey: string) => void;
}

export default function ApiKeyModal({ isOpen, onClose, onSave }: ApiKeyModalProps) {
  const [activeTab, setActiveTab] = useState('gemini');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<null | {
    success: boolean;
    message: string;
  }>(null);
  const { toast } = useToast();

  const handleSave = () => {
    let key = '';

    switch (activeTab) {
      case 'gemini':
        key = geminiKey;
        break;
      case 'openai':
        key = openaiKey;
        break;
      case 'anthropic':
        key = anthropicKey;
        break;
    }

    if (!key) {
      toast({
        title: 'API Key Required',
        description: 'Please enter an API key before saving.',
        variant: 'destructive',
      });
      return;
    }

    onSave(activeTab, key);

    toast({
      title: 'API Key Saved',
      description: `Your ${activeTab.toUpperCase()} API key has been saved.`,
    });

    onClose();
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);

    try {
      const currentKey = activeTab === 'gemini' ? geminiKey : activeTab === 'openai' ? openaiKey : anthropicKey;

      if (!currentKey) {
        throw new Error(`Please enter an API key for ${activeTab} first`);
      }

      const data = await aiApi.testConnection(activeTab, currentKey);

      setConnectionStatus({
        success: true,
        message: data.message,
      });
    } catch (error: any) {
      setConnectionStatus({
        success: false,
        message: error.message,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-card rounded-xl shadow-2xl border border-border overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-border bg-muted/30">
              <h3 className="font-bold text-xl">Configure AI API Keys</h3>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Tabs defaultValue="gemini" value={activeTab} onValueChange={setActiveTab} className="p-4">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="gemini">Gemini</TabsTrigger>
                <TabsTrigger value="openai">OpenAI</TabsTrigger>
                <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
              </TabsList>

              <TabsContent value="gemini" className="space-y-4">
                <div>
                  <Label htmlFor="gemini-key">Gemini API Key</Label>
                  <Input
                    id="gemini-key"
                    type="password"
                    placeholder="Enter your Gemini API key"
                    value={geminiKey}
                    onChange={(e) => {
                      setGeminiKey(e.target.value);
                      setConnectionStatus(null);
                    }}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testConnection}
                    disabled={testingConnection || !geminiKey}
                  >
                    {testingConnection ? 'Testing...' : 'Test Connection'}
                  </Button>
                </div>

                {connectionStatus && activeTab === 'gemini' && (
                  <div className={`p-4 rounded-lg flex items-start gap-3 border ${connectionStatus.success
                    ? 'bg-primary/5 border-primary/20 text-foreground'
                    : 'bg-destructive/5 border-destructive/20 text-destructive'
                    }`}>
                    {connectionStatus.success ? (
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    )}
                    <div className="text-sm font-medium">{connectionStatus.message}</div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="openai" className="space-y-4">
                <div>
                  <Label htmlFor="openai-key">OpenAI API Key</Label>
                  <Input
                    id="openai-key"
                    type="password"
                    placeholder="sk-..."
                    value={openaiKey}
                    onChange={(e) => {
                      setOpenaiKey(e.target.value);
                      setConnectionStatus(null);
                    }}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testConnection}
                    disabled={testingConnection || !openaiKey}
                  >
                    {testingConnection ? 'Testing...' : 'Test Connection'}
                  </Button>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 text-muted-foreground border border-border">
                  <p className="text-xs">
                    <strong>Note:</strong> Your OpenAI key is stored locally in your browser and used to execute your agents.
                    If no key is provided, the agent will attempt to use the system's default model (if available).
                  </p>
                </div>

                {connectionStatus && activeTab === 'openai' && (
                  <div className={`p-4 rounded-lg flex items-start gap-3 border ${connectionStatus.success
                    ? 'bg-primary/5 border-primary/20 text-foreground'
                    : 'bg-destructive/5 border-destructive/20 text-destructive'
                    }`}>
                    {connectionStatus.success ? (
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    )}
                    <div className="text-sm font-medium">{connectionStatus.message}</div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="anthropic" className="space-y-4">
                <div>
                  <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                  <Input
                    id="anthropic-key"
                    type="password"
                    placeholder="sk-ant-..."
                    value={anthropicKey}
                    onChange={(e) => {
                      setAnthropicKey(e.target.value);
                      setConnectionStatus(null);
                    }}
                  />
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-muted-foreground border border-border">
                  <p className="text-sm font-medium">Anthropic integration coming soon!</p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end p-6 border-t border-border bg-muted/30 gap-3">
              <Button variant="outline" onClick={onClose} className="rounded-full px-6">
                Cancel
              </Button>
              <Button onClick={handleSave} className="rounded-full px-8 shadow-lg hover:shadow-primary/20">
                Save API Key
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
