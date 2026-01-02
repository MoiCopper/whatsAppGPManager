/**
 * Interface que define o contrato para um cliente WhatsApp
 * Isso desacopla o controller da implementação específica do whatsapp-web.js
 */
export interface IWhatsAppClient {
    /**
     * Inicializa o cliente
     */
    initialize(): Promise<void>;

    /**
     * Registra um listener para um evento
     */
    on(event: 'ready', callback: () => void): void;
    on(event: 'qr', callback: (qr: string) => void): void;
    on(event: 'message_create', callback: (msg: any) => void): void;
    on(event: 'auth_failure', callback: (msg: string) => void): void;
    on(event: 'disconnected', callback: (reason: string) => void): void;

    /**
     * Obtém a instância real do cliente (para compatibilidade com dependências existentes)
     */
    getInstance(): any;
}

