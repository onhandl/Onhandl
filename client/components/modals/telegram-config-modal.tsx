'use client';

import type React from 'react';
import { useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2, MessageCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Label } from '@/components/ui';

import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface TelegramConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (config: any) => void;
  initialData?: {
    botToken?: string;
    chatId?: string;
    botName?: string;
  };
}

const TelegramConfigModal: React.FC<TelegramConfigModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData = {},
}) => {
  const [botToken, setBotToken] = useState(initialData.botToken || '');
  const [chatId, setChatId] = useState(initialData.chatId || '');
  const [botName, setBotName] = useState(initialData.botName || 'Trading Bot');
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<null | {
    success: boolean;
    message: string;
  }>(null);

  const handleSave = () => {
    if (!botToken) {
      setConnectionStatus({
        success: false,
        message: 'Bot token is required.',
      });
      return;
    }

    if (!chatId) {
      setConnectionStatus({
        success: false,
        message: 'Chat ID is required.',
      });
      return;
    }

    onSuccess({
      botToken,
      chatId,
      botName,
    });

    onClose();
  };

  const testConnection = async () => {
    if (!botToken || !chatId) {
      setConnectionStatus({
        success: false,
        message: 'Both Bot Token and Chat ID are required to test the connection.',
      });
      return;
    }

    setIsTesting(true);
    setConnectionStatus(null);

    try {
      const data = await apiFetch('/telegram/test-connection', {
        method: 'POST',
        body: JSON.stringify({ botToken, chatId, botName }),
      });

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
      setIsTesting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>Configure Telegram Bot</DialogTitle>
            <DialogDescription>
              Connect your Telegram bot to send trading notifications and receive commands.
            </DialogDescription>
          </DialogHeader>
        </VisuallyHidden>
        <DialogHeader>
          <DialogTitle>Configure Telegram Bot</DialogTitle>
          <DialogDescription>
            Connect your Telegram bot to send trading notifications and receive commands.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bot-token">Bot Token</Label>
            <Input
              id="bot-token"
              type="password"
              placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              value={botToken}
              onChange={(e) => {
                setBotToken(e.target.value);
                setConnectionStatus(null);
              }}
            />
            <p className="text-xs text-black-500">
              Get your bot token from the{' '}
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                BotFather on Telegram
              </a>
              .
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chat-id">Chat ID</Label>
            <Input
              id="chat-id"
              placeholder="-1001234567890 or @channelname"
              value={chatId}
              onChange={(e) => {
                setChatId(e.target.value);
                setConnectionStatus(null);
              }}
            />
            <p className="text-xs text-black-500">
              Personal chat ID or channel/group ID where messages will be sent.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot-name">Bot Name (Optional)</Label>
            <Input
              id="bot-name"
              placeholder="Trading Bot"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={testConnection}
              disabled={isTesting || !botToken || !chatId}
              className="flex items-center"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
          </div>

          {connectionStatus && (
            <div
              className={`p-3 rounded-md ${connectionStatus.success
                ? 'bg-green-50 border-green-200 border'
                : 'bg-red-50 border-red-200 border'
                } flex items-start gap-2`}
            >
              {connectionStatus.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              )}
              <p className="text-sm">{connectionStatus.message}</p>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TelegramConfigModal;
