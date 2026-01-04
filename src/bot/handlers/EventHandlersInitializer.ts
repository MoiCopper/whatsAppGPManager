import { MemberStatsHandler } from './MemberStatsHandler';
import { TimeoutExpirationHandler } from './TimeoutExpirationHandler';
import { ErrorHandler } from '../../shared/ErrorHandler';
import { dBRepository, checkPunishments, timeoutCommand } from '../../shared/containers';
import { CdmCommandHandler } from '../cdm';

/**
 * Inicializa todos os handlers de eventos e componentes que escutam eventos
 * 
 * IMPORTANTE: Este inicializador deve ser chamado ANTES de qualquer evento ser emitido,
 * para garantir que todos os listeners estejam registrados.
 * 
 * Componentes que se registram no construtor:
 * - Handlers que estendem BaseEventHandler (auto-registro)
 * - DBRepository (registra no construtor)
 * - CheckPunishments (registra no construtor)
 * - CdmCommandHandler (registra no construtor)
 * 
 * Vantagens desta abordagem:
 * - Handlers não precisam ser dependências de outros componentes
 * - Handlers são criados apenas uma vez (singleton implícito)
 * - Fácil adicionar novos handlers sem modificar o container
 * - Garante que todos os listeners estejam registrados antes dos eventos
 * 
 * Deve ser chamado na inicialização da aplicação (no index.ts)
 */
export class EventHandlersInitializer {
    private static handlers: any[] = [];
    private static eventListeners: any[] = [];

    /**
     * Inicializa todos os handlers de eventos e componentes que escutam eventos
     * 
     * 1. Cria instâncias dos handlers que estendem BaseEventHandler
     * 2. Força a criação de componentes que se registram no construtor (via lazy proxy)
     * 
     * Isso garante que todos os listeners estejam registrados antes de qualquer evento ser emitido.
     */
    static initialize(): void {
        try {
            console.log('[EventHandlersInitializer] Iniciando inicialização dos handlers...');
            
            // 1. Criar instâncias dos handlers que estendem BaseEventHandler
            // O construtor de BaseEventHandler já faz o registro automático
            console.log('[EventHandlersInitializer] Criando MemberStatsHandler...');
            const memberStatsHandler = new MemberStatsHandler();
            console.log('[EventHandlersInitializer] Criando TimeoutExpirationHandler...');
            const timeoutExpirationHandler = new TimeoutExpirationHandler();
            this.handlers = [memberStatsHandler, timeoutExpirationHandler];

            // 2. Componentes que se registram no construtor já foram criados no containers.ts
            // timeoutCommand, dBRepository e checkPunishments são criados diretamente (não lazy) no container
            // então seus listeners já estão registrados quando este inicializador é chamado
            console.log('[EventHandlersInitializer] Verificando componentes do container...');
            console.log('[EventHandlersInitializer] timeoutCommand criado:', !!timeoutCommand);
            console.log('[EventHandlersInitializer] dBRepository criado:', !!dBRepository);
            console.log('[EventHandlersInitializer] checkPunishments criado:', !!checkPunishments);
            
            // 3. Criar CdmCommandHandler (não está no container)
            console.log('[EventHandlersInitializer] Criando CdmCommandHandler...');
            const cdmCommandHandler = new CdmCommandHandler();
            this.eventListeners = [cdmCommandHandler];

            console.log('[EventHandlersInitializer] Event handlers and listeners initialized successfully');
            console.log(`[EventHandlersInitializer] Total de handlers: ${this.handlers.length}, Total de listeners: ${this.eventListeners.length}`);
        } catch (error) {
            ErrorHandler.handle(error as Error, 'EventHandlersInitializer.initialize');
            throw error;
        }
    }

    /**
     * Registra um novo handler manualmente
     * Útil para handlers que não são dependências de ninguém
     */
    static registerHandler(handler: any): void {
        this.handlers.push(handler);
    }

    /**
     * Registra um componente que escuta eventos (mas não é um handler formal)
     */
    static registerEventListener(listener: any): void {
        this.eventListeners.push(listener);
    }
}

