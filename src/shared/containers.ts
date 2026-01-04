import { Client } from 'whatsapp-web.js';
import { TimeoutCommand } from '../bot/commands/timeout';
import { QRController } from '../controllers/qr.controller';
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
container.register('dBRepository', () => new DBRepository());
container.register('registerGroupCommand', () => new RegisterGroupCommand());
container.register('qrController', () => new QRController());
container.register('whatsAppRepository', () => new WhatsAppRepository());
container.register('checkPunishments', () => new CheckPunishments());
container.register('pingCommand', () => new PingCommand());
container.register('setFreeCommand', () => new SetFreeCommand());
// Handlers não são mais dependências do container - são inicializados via EventHandlersInitializer

// Exportar instâncias como proxies para lazy initialization
export const eventBus = container.get<EventBus>('eventBus'); // Singleton direto, não lazy
// timeoutCommand é criado diretamente (não lazy) porque se registra no construtor
// Isso garante que os listeners sejam registrados antes de qualquer evento ser emitido
export const timeoutCommand = container.get<TimeoutCommand>('timeoutCommand');
// dBRepository e checkPunishments são criados diretamente (não lazy) porque se registram no construtor
// Isso garante que os listeners sejam registrados antes de qualquer evento ser emitido
export const dBRepository = container.get<DBRepository>('dBRepository');
export const checkPunishments = container.get<CheckPunishments>('checkPunishments');
export const registerGroupCommand = container.get<RegisterGroupCommand>('registerGroupCommand');
export const qrController = container.get<QRController>('qrController');
// whatsAppRepository é criado diretamente (não lazy) porque precisa inicializar o cliente no construtor
// Isso garante que o cliente seja inicializado e os eventos de QR sejam emitidos
export const whatsAppRepository = container.get<WhatsAppRepository>('whatsAppRepository');
export const pingCommand = container.get<PingCommand>('pingCommand');
export const setFreeCommand = container.get<SetFreeCommand>('setFreeCommand');
// Handlers não são mais exportados do container - são inicializados via EventHandlersInitializer

// Forçar criação imediata de componentes que se registram no construtor
// Isso garante que os listeners sejam registrados antes de qualquer evento ser emitido
// Apenas acessar as instâncias já criadas acima força a inicialização completa
const _forceInit = () => {
    // Acessar as instâncias garante que os construtores sejam executados
    // e os listeners sejam registrados no EventBus
    // whatsAppRepository também precisa ser inicializado para que o cliente seja configurado
    if (dBRepository && checkPunishments && timeoutCommand && registerGroupCommand && pingCommand && setFreeCommand && whatsAppRepository) {
        // Instâncias já criadas acima, listeners já registrados
    }
};
_forceInit();

