import { IEventHandler } from './IEventHandler';
import { DomainEvent, DomainEventType } from './index';
import { eventBus } from '../containers';

/**
 * Classe base abstrata para handlers de eventos
 * Facilita o auto-registro de handlers nos eventos apropriados
 * 
 * @template TPayload - Tipo do payload que este handler processa
 */
export abstract class BaseEventHandler<TPayload = any> implements IEventHandler<TPayload> {
    /**
     * Tipos de eventos que este handler processa
     * Deve ser implementado pelas classes filhas
     */
    protected abstract getEventTypes(): DomainEventType[];

    constructor() {
        // Auto-registrar nos eventos quando instanciado
        this.register();
    }

    /**
     * Registra este handler nos eventos especificados
     */
    private register(): void {
        const eventTypes = this.getEventTypes();
        
        if (eventTypes.length === 0) {
            console.warn(`${this.constructor.name} não especificou tipos de eventos para escutar`);
            return;
        }

        console.log(`[${this.constructor.name}] Registrando nos eventos:`, eventTypes);

        // Registrar individualmente para cada tipo de evento
        // Isso garante que cada tipo tenha seu próprio Observable e subscription
        eventTypes.forEach(eventType => {
            eventBus.on<TPayload>(eventType)
                .subscribe(async (event) => {
                    console.log(`[${this.constructor.name}] Evento recebido:`, event.type);
                    await this.handle(event);
                });
        });
    }

    /**
     * Processa um evento de domínio
     * Deve ser implementado pelas classes filhas
     */
    abstract handle(event: DomainEvent<TPayload>): Promise<void>;
}

