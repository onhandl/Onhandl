export interface TelegramServiceOptions {
  botToken?: string;
  webhookUrl?: string;
  webhookDomain?: string;
  webhookPath?: string;
  webhookPort?: number;
  webhookSecretToken?: string;
}

export interface TelegramSendMessageOptions {
  parse_mode?: 'Markdown' | 'HTML';
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
  reply_to_message_id?: number;
  reply_markup?: any;
}

export interface TelegramResponse {
  ok: boolean;
  result?: any;
  description?: string;
  error_code?: number;
}
