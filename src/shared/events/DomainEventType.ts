/**
 * Tipos de eventos de domínio da aplicação
 * Representa eventos que ocorrem no contexto do negócio
 */
export enum DomainEventType {
    // Eventos relacionados a mensagens
    MEMBER_MESSAGE_SENT = 'MEMBER_MESSAGE_SENT',
    
    // Eventos relacionados a timeouts/punições
    TIMEOUT_CREATED = 'TIMEOUT_CREATED',
    TIMEOUT_EXPIRED = 'TIMEOUT_EXPIRED',
    TIMEOUT_REMOVED = 'TIMEOUT_REMOVED',
    PUNISHMENT_CHECKED = 'PUNISHMENT_CHECKED',
    
    // Eventos relacionados a grupos
    GROUP_REGISTERED = 'GROUP_REGISTERED',
    GROUP_UPDATED = 'GROUP_UPDATED',
    
    // Eventos relacionados a membros
    MEMBER_CREATED = 'MEMBER_CREATED',
    MEMBER_UPDATED = 'MEMBER_UPDATED',
    
    // Eventos relacionados a comandos
    COMMAND_EXECUTED = 'COMMAND_EXECUTED',
    COMMAND_FAILED = 'COMMAND_FAILED',
}

