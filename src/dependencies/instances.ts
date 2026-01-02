import { Client } from 'whatsapp-web.js';
import { WhatsappService } from '../services/whatsapp.service';
import { TimeoutCommand } from '../commands/timeout';
import { QRController } from '../controllers/qr.controller';
import { ClientService } from '../services/client.service';
import { DBService } from '../services/db.service';
import { RegisterGroupCommand } from '../commands/registerGroup';

/**
 * Singleton instances manager
 * Centraliza todas as instâncias de classes para evitar duplicação
 */

// Armazenamento do client singleton
let clientInstance: Client | null = null;

/**
 * Inicializa o client singleton (deve ser chamado antes de usar outras instâncias)
 */
export function setClient(client: Client): void {
    clientInstance = client;
}

/**
 * Obtém a instância do client
 */
function getClient(): Client {
    if (!clientInstance) {
        throw new Error('Client não foi inicializado. Certifique-se de chamar setClient() primeiro.');
    }
    return clientInstance;
}

// Singleton do WhatsappService
let whatsappServiceInstance: WhatsappService | null = null;

function getWhatsappService(): WhatsappService {
    if (!whatsappServiceInstance) {
        whatsappServiceInstance = new WhatsappService(getClient());
    }
    return whatsappServiceInstance;
}

// Singleton do TimeoutCommand
let timeoutCommandInstance: TimeoutCommand | null = null;

function getTimeoutCommand(): TimeoutCommand {
    if (!timeoutCommandInstance) {
        timeoutCommandInstance = new TimeoutCommand(getClient(), getWhatsappService());
    }
    return timeoutCommandInstance;
}

// Singleton do ClientService
let clientServiceInstance: ClientService | null = null;

function getClientService(): ClientService {
    if (!clientServiceInstance) {
        clientServiceInstance = new ClientService(getClient());
    }
    return clientServiceInstance;
}

// Singleton do DBService
let dbServiceInstance: DBService | null = null;

function getDBService(): DBService {
    if (!dbServiceInstance) {
        dbServiceInstance = new DBService();
    }
    return dbServiceInstance;
}

// Singleton do RegisterGroupCommand
let registerGroupCommandInstance: RegisterGroupCommand | null = null;

function getRegisterGroupCommand(): RegisterGroupCommand {
    if (!registerGroupCommandInstance) {
        registerGroupCommandInstance = new RegisterGroupCommand(getDBService());
    }
    return registerGroupCommandInstance;
}

// Singleton do QRController
let qrControllerInstance: QRController | null = null;

function getQRController(): QRController {
    if (!qrControllerInstance) {
        qrControllerInstance = new QRController();
    }
    return qrControllerInstance;
}

// Exportar instâncias para uso direto (lazy initialization através de getters)
// Usando uma classe para criar objetos com getters que funcionam bem com TypeScript
class LazySingleton<T> {
    private _instance: T | null = null;
    private _factory: () => T;

    constructor(factory: () => T) {
        this._factory = factory;
    }

    get instance(): T {
        if (!this._instance) {
            this._instance = this._factory();
        }
        return this._instance;
    }
}

// Criar objetos lazy singleton
const whatsappServiceLazy = new LazySingleton(() => getWhatsappService());
const timeoutCommandLazy = new LazySingleton(() => getTimeoutCommand());
const clientServiceLazy = new LazySingleton(() => getClientService());
const dbServiceLazy = new LazySingleton(() => getDBService());
const registerGroupCommandLazy = new LazySingleton(() => getRegisterGroupCommand());
const qrControllerLazy = new LazySingleton(() => getQRController());

// Exportar como objetos que se comportam como as instâncias reais
export const whatsappService = new Proxy({} as WhatsappService, {
    get(target, prop) {
        return (whatsappServiceLazy.instance as any)[prop];
    }
});

export const timeoutCommand = new Proxy({} as TimeoutCommand, {
    get(target, prop) {
        return (timeoutCommandLazy.instance as any)[prop];
    }
});

export const clientService = new Proxy({} as ClientService, {
    get(target, prop) {
        return (clientServiceLazy.instance as any)[prop];
    }
});

export const dbService = new Proxy({} as DBService, {
    get(target, prop) {
        return (dbServiceLazy.instance as any)[prop];
    }
});

export const registerGroupCommand = new Proxy({} as RegisterGroupCommand, {
    get(target, prop) {
        return (registerGroupCommandLazy.instance as any)[prop];
    }
});

export const qrController = qrControllerLazy.instance;

