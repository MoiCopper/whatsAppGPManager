import { Client } from 'whatsapp-web.js';
import { IWhatsAppClient } from './whatsapp-client.interface';
import { clientConfig } from '../config/clientConfig';

/**
 * Adapter que implementa IWhatsAppClient usando o Client do whatsapp-web.js
 * Isso encapsula a dependência externa e permite trocar a biblioteca no futuro
 */
export class WhatsAppClientAdapter implements IWhatsAppClient {
    private client: Client;

    constructor() {
        this.client = new Client(clientConfig);
    }

    async initialize(): Promise<void> {
        await this.client.initialize();
    }

    on(event: 'ready', callback: () => void): void;
    on(event: 'qr', callback: (qr: string) => void): void;
    on(event: 'message_create', callback: (msg: any) => void): void;
    on(event: 'auth_failure', callback: (msg: string) => void): void;
    on(event: 'disconnected', callback: (reason: string) => void): void;
    on(event: string, callback: (...args: any[]) => void): void {
        this.client.on(event as any, callback);
    }

    getInstance(): Client {
        return this.client;
    }
}

