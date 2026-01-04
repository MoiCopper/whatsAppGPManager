import { DomainEvent } from './DomainEvent';

/**
 * Interface base para handlers de eventos de domínio
 * @template TPayload - Tipo do payload do evento que este handler processa
 */
export interface IEventHandler<TPayload = any> {
    /**
     * Processa um evento de domínio
     * @param event - Evento a ser processado
     */
    handle(event: DomainEvent<TPayload>): Promise<void>;
}

