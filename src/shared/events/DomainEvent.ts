import { DomainEventType } from './DomainEventType';

/**
 * Interface para eventos de domínio
 * Representa eventos que ocorrem no contexto do negócio
 * @template TPayload - Tipo do payload do evento
 */
export interface DomainEvent<TPayload = any> {
    /** Tipo do evento */
    type: DomainEventType;
    
    /** Dados do evento específicos do tipo */
    payload: TPayload;
    
    /** Timestamp de quando o evento foi emitido */
    timestamp: Date;
    
    /** Metadados adicionais (opcional) */
    metadata?: {
        userId?: string;
        groupId?: string;
        [key: string]: any;
    };
}

