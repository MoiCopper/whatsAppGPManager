import { Client } from 'whatsapp-web.js';
import { TimeoutCommand } from '../bot/commands/timeout';
import { QRController } from '../controllers/qr.controller';
import { ClientService } from '../services/client.service';
import { DBRepository } from '../repositories/dbRepository';
import { RegisterGroupCommand } from '../bot/commands/registerGroup';
import { WhatsAppRepository } from '../repositories/whatsAppRepository';
import { CheckPunishments } from '../bot/checkPunishments';
import { PingCommand } from '../bot/commands/ping';
import { SetFreeCommand } from '../bot/commands/setFree';
import { EventBus } from './events/EventBus';

/**
 * Singleton instances manager
 * Centraliza todas as instâncias de classes para evitar duplicação
 */

class DependencyContainer {
    private instances = new Map<string, any>();
    private factories = new Map<string, () => any>();

    register<T>(name: string, factory: () => T): void {
        this.factories.set(name, factory);
    }

    get<T>(name: string): T {
        if (!this.instances.has(name)) {
            const factory = this.factories.get(name);
            if (!factory) throw new Error(`Dependency ${name} not registered`);
            this.instances.set(name, factory());
        }
        return this.instances.get(name) as T;
    }

    set<T>(name: string, instance: T): void {
        this.instances.set(name, instance);
    }
}

const container = new DependencyContainer();

/**
 * Inicializa o client singleton (deve ser chamado antes de usar outras instâncias)
 */
export function setClient(client: Client): void {
    container.set('client', client);
}

// Helper para criar proxies lazy
function createLazyProxy<T extends object>(name: string): T {
    return new Proxy({} as T, {
        get(target, prop) {
            return (container.get<T>(name) as any)[prop];
        }
    });
}

// Registrar todas as dependências
container.register('eventBus', () => new EventBus());
container.register('timeoutCommand', () => new TimeoutCommand());
container.register('clientService', () => new ClientService());
container.register('dBRepository', () => new DBRepository());
container.register('registerGroupCommand', () => new RegisterGroupCommand());
container.register('qrController', () => new QRController());
container.register('whatsAppRepository', () => new WhatsAppRepository());
container.register('checkPunishments', () => new CheckPunishments());
container.register('pingCommand', () => new PingCommand());
container.register('setFreeCommand', () => new SetFreeCommand());

// Exportar instâncias como proxies para lazy initialization
export const eventBus = container.get<EventBus>('eventBus'); // Singleton direto, não lazy
export const timeoutCommand = createLazyProxy<TimeoutCommand>('timeoutCommand');
export const clientService = createLazyProxy<ClientService>('clientService');
export const dBRepository = createLazyProxy<DBRepository>('dBRepository');
export const registerGroupCommand = createLazyProxy<RegisterGroupCommand>('registerGroupCommand');
export const qrController = container.get<QRController>('qrController');
export const whatsAppRepository = createLazyProxy<WhatsAppRepository>('whatsAppRepository');
export const checkPunishments = createLazyProxy<CheckPunishments>('checkPunishments');
export const pingCommand = createLazyProxy<PingCommand>('pingCommand');
export const setFreeCommand = createLazyProxy<SetFreeCommand>('setFreeCommand');

