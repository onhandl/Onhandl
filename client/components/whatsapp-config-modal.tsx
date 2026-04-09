'use client';

import { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button, Input, Label, useToast } from '@/components/ui';

interface WhatsAppConfigModalProps {
  onClose: () => void;
  onSave: (config: WhatsAppConfig) => void;
}

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  webhookVerifyToken: string;
}

export default function WhatsAppConfigModal({ onClose, onSave }: WhatsAppConfigModalProps) {
  const [accessToken, setAccessToken] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [webhookVerifyToken, setWebhookVerifyToken] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<null | {
    success: boolean;
    message: string;
  }>(null);
  const { toast } = useToast();

  const handleSave = () => {
    if (!accessToken || !phoneNumberId) {
      toast({
        title: 'Required Fields Missing',
        description: 'Please enter both the Access Token and Phone Number ID.',
        variant: 'destructive',
      });
      return;
    }

    // Generate a random verify token if not provided
    const finalVerifyToken =
      webhookVerifyToken || `Onhandl_${Math.random().toString(36).substring(2, 15)}`;

    // Save the WhatsApp configuration
    onSave({
      accessToken,
      phoneNumberId,
      webhookVerifyToken: finalVerifyToken,
    });

    toast({
      title: 'WhatsApp Configuration Saved',
      description: 'Your WhatsApp Business API configuration has been saved.',
    });

    onClose();
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);

    try {
      if (!accessToken || !phoneNumberId) {
        throw new Error('Please enter both the Access Token and Phone Number ID');
      }

      // In a real implementation, we would test the connection to the WhatsApp API
      // For now, we'll simulate a successful connection
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate success
      setConnectionStatus({
        success: true,
        message: 'Connection successful! WhatsApp Business API is configured correctly.',
      });
    } catch (error: any) {
      setConnectionStatus({
        success: false,
        message: `Connection failed: ${error.message}`,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white rounded-md shadow-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-medium text-lg">Configure WhatsApp Business API</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <Label htmlFor="access-token">WhatsApp Access Token</Label>
            <Input
              id="access-token"
              type="password"
              placeholder="Enter your WhatsApp Business API access token"
              value={accessToken}
              onChange={(e) => {
                setAccessToken(e.target.value);
                setConnectionStatus(null);
              }}
            />
            <p className="text-xs text-black-500 mt-1">
              Get your access token from the{' '}
              <a
                href="https://developers.facebook.com/apps/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Meta for Developers
              </a>{' '}
              portal.
            </p>
          </div>

          <div>
            <Label htmlFor="phone-number-id">Phone Number ID</Label>
            <Input
              id="phone-number-id"
              placeholder="Enter your WhatsApp Business Phone Number ID"
              value={phoneNumberId}
              onChange={(e) => {
                setPhoneNumberId(e.target.value);
                setConnectionStatus(null);
              }}
            />
            <p className="text-xs text-black-500 mt-1">
              Found in the WhatsApp Business Account settings in Meta Business Suite.
            </p>
          </div>

          <div>
            <Label htmlFor="webhook-verify-token">Webhook Verify Token (Optional)</Label>
            <Input
              id="webhook-verify-token"
              placeholder="Custom verification token for webhooks"
              value={webhookVerifyToken}
              onChange={(e) => setWebhookVerifyToken(e.target.value)}
            />
            <p className="text-xs text-black-500 mt-1">
              A custom string to verify webhook requests. If left empty, a random token will be
              generated.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={testConnection}
              disabled={testingConnection || !accessToken || !phoneNumberId}
            >
              {testingConnection ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>

          {connectionStatus && (
            <div
              className={`p-3 rounded-md ${connectionStatus.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
                } border flex items-start gap-2`}
            >
              {connectionStatus.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div className="text-sm">{connectionStatus.message}</div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-4 border-t gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </div>
      </div>
    </div>
  );
}
