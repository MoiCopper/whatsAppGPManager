import { setClient, clientService } from '../dependencies/instances';
import { IWhatsAppClient } from '../adapters/whatsapp-client.interface';
import { WhatsAppClientAdapter } from '../adapters/whatsapp-client.adapter';

export class ClientController {
    private client: IWhatsAppClient;

    constructor(client?: IWhatsAppClient) {
        // Permite injetar um cliente para testes, ou usa o adapter padrão
        this.client = client || new WhatsAppClientAdapter();
        setClient(this.client.getInstance());
        this.registerEvents();
    }

    private registerEvents(): void {
        this.client.on('ready', () => {
            clientService.onReady();
        });

        this.client.on('qr', (qr) => {
            clientService.onQR(qr);
        });

        this.client.on('message_create', async (msg) => {
            await clientService.onMessageCreate(msg);
        });

        this.client.on('auth_failure', (msg) => {
            clientService.onAuthFailure(msg);
        });

        this.client.on('disconnected', (reason) => {
            clientService.onDisconnected(reason);
        });
    }

    /**
     * Inicializa o cliente
     */
    public async initialize(): Promise<void> {
        try {
            await this.client.initialize();
        } catch (error) {
            console.error('Failed to initialize client:', error);
            process.exit(1);
        }
    }
}

