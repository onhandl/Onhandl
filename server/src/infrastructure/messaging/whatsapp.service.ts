/**
 * WhatsApp Cloud API Service
 * This service handles interactions with the WhatsApp Business Cloud API
 */

interface WhatsAppServiceOptions {
  accessToken?: string;
  phoneNumberId?: string;
  version?: string;
}

interface WhatsAppTextMessage {
  messaging_product: string;
  recipient_type: string;
  to: string;
  type: string;
  text: {
    preview_url: boolean;
    body: string;
  };
}

interface WhatsAppTemplateMessage {
  messaging_product: string;
  recipient_type: string;
  to: string;
  type: string;
  template: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
}

interface WhatsAppMediaMessage {
  messaging_product: string;
  recipient_type: string;
  to: string;
  type: string;
  [mediaType: string]: any;
}

interface WhatsAppMessageResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

class WhatsAppService {
  private accessToken: string | null = null;
  private baseUrl = 'https://graph.facebook.com';
  private apiVersion = 'v17.0';
  private phoneNumberId: string | null = null;

  constructor(options?: WhatsAppServiceOptions) {
    if (options?.accessToken) {
      this.accessToken = options.accessToken;
    } else {
      // Try to get API key from environment
      this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || null;
    }

    if (options?.phoneNumberId) {
      this.phoneNumberId = options.phoneNumberId;
    } else {
      this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || null;
    }

    if (options?.version) {
      this.apiVersion = options.version;
    }
  }

  isConfigured(): boolean {
    return !!this.accessToken && !!this.phoneNumberId;
  }

  async sendTextMessage(to: string, text: string, phoneNumberId?: string): Promise<any> {
    const actualPhoneNumberId = phoneNumberId || this.phoneNumberId;

    if (!this.accessToken || !actualPhoneNumberId) {
      throw new Error('WhatsApp API is not configured. Missing access token or phone number ID.');
    }

    const url = `${this.baseUrl}/${this.apiVersion}/${actualPhoneNumberId}/messages`;

    const message: WhatsAppTextMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: false,
        body: text,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WhatsApp API error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode = 'en_US',
    components?: any[],
    phoneNumberId?: string
  ): Promise<any> {
    const actualPhoneNumberId = phoneNumberId || this.phoneNumberId;

    if (!this.accessToken || !actualPhoneNumberId) {
      throw new Error('WhatsApp API is not configured. Missing access token or phone number ID.');
    }

    const url = `${this.baseUrl}/${this.apiVersion}/${actualPhoneNumberId}/messages`;

    const message: WhatsAppTemplateMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
      },
    };

    if (components && components.length > 0) {
      message.template.components = components;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WhatsApp API error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error sending WhatsApp template message:', error);
      throw error;
    }
  }

  async sendMediaMessage(
    to: string,
    mediaType: string,
    mediaId: string,
    phoneNumberId?: string
  ): Promise<any> {
    const actualPhoneNumberId = phoneNumberId || this.phoneNumberId;

    if (!this.accessToken || !actualPhoneNumberId) {
      throw new Error('WhatsApp API is not configured. Missing access token or phone number ID.');
    }

    if (!['image', 'audio', 'document', 'video', 'sticker'].includes(mediaType)) {
      throw new Error(`Invalid media type: ${mediaType}`);
    }

    const url = `${this.baseUrl}/${this.apiVersion}/${actualPhoneNumberId}/messages`;

    const message: WhatsAppMediaMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: mediaType,
      [mediaType]: {
        id: mediaId,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WhatsApp API error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error sending WhatsApp media message:', error);
      throw error;
    }
  }
}

// Create and export a default instance
export const whatsAppService = new WhatsAppService();
