import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';

/**
 * EventBus centralizado para gerenciar eventos de domínio
 * Implementa padrão Observer usando RxJS
 */
export class EventBus {
    private eventSubject = new Subject<DomainEvent>();
    
    /**
     * Emite um evento para todos os listeners
     * @template TPayload - Tipo do payload do evento
     * @param event - Evento de domínio a ser emitido
     */
    emit<TPayload = any>(event: Omit<DomainEvent<TPayload>, 'timestamp'>): void {
        const domainEvent: DomainEvent<TPayload> = {
            ...event,
            timestamp: new Date()
        };
        
        console.log(`[EventBus] Emitindo evento: ${event.type}`);
        this.eventSubject.next(domainEvent as DomainEvent);
    }
    
    /**
     * Escuta todos os eventos emitidos
     * @returns Observable de todos os eventos
     */
    onAll(): Observable<DomainEvent> {
        return this.eventSubject.asObservable();
    }
    
    /**
     * Escuta eventos de um tipo específico
     * @template TPayload - Tipo do payload esperado
     * @param eventType - Tipo do evento a ser escutado
     * @returns Observable filtrado por tipo de evento com payload tipado
     */
    on<TPayload = any>(eventType: DomainEventType): Observable<DomainEvent<TPayload>> {
        return this.eventSubject.pipe(
            filter(event => event.type === eventType),
            map(event => event as DomainEvent<TPayload>)
        );
    }
    
    /**
     * Escuta múltiplos tipos de eventos
     * @param eventTypes - Array de tipos de eventos a serem escutados
     * @returns Observable filtrado pelos tipos especificados
     */
    onMany(...eventTypes: DomainEventType[]): Observable<DomainEvent> {
        return this.eventSubject.pipe(
            filter(event => eventTypes.includes(event.type))
        );
    }
    
    /**
     * Escuta eventos filtrados por uma função customizada
     * @param predicate - Função que retorna true se o evento deve ser incluído
     * @returns Observable filtrado pela função
     */
    onWhere(predicate: (event: DomainEvent) => boolean): Observable<DomainEvent> {
        return this.eventSubject.pipe(
            filter(predicate)
        );
    }
}

