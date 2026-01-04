import { BaseEventHandler } from '../../shared/events/BaseEventHandler';
import { DomainEvent, DomainEventType } from '../../shared/events';
import { dBRepository, whatsAppRepository, eventBus } from '../../shared/containers';
import { ErrorHandler } from '../../shared/ErrorHandler';
import { isBefore, startOfHour } from 'date-fns';

/**
 * Handler para processar eventos relacionados a expiração de timeouts
 * Monitora e processa timeouts que expiraram, removendo punições e notificando usuários
 * 
 * Este handler se auto-registra nos eventos quando é instanciado
 */
export class TimeoutExpirationHandler extends BaseEventHandler {
    /**
     * Define os tipos de eventos que este handler processa
     */
    protected getEventTypes(): DomainEventType[] {
        return [
            DomainEventType.TIMEOUT_CREATED,
            DomainEventType.TIMEOUT_EXPIRED,
            DomainEventType.TIMEOUT_REMOVED,
            DomainEventType.PUNISHMENT_CHECKED
        ];
    }
    async handle(event: DomainEvent): Promise<void> {
        try {
            switch (event.type) {
                case DomainEventType.TIMEOUT_CREATED:
                    await this.handleTimeoutCreated(event);
                    break;
                case DomainEventType.TIMEOUT_EXPIRED:
                    await this.handleTimeoutExpired(event);
                    break;
                case DomainEventType.TIMEOUT_REMOVED:
                    await this.handleTimeoutRemoved(event);
                    break;
                case DomainEventType.PUNISHMENT_CHECKED:
                    await this.handlePunishmentChecked(event);
                    break;
            }
        } catch (error) {
            ErrorHandler.handle(error as Error, `TimeoutExpirationHandler.handle.${event.type}`);
        }
    }

    /**
     * Processa evento de timeout criado
     */
    private async handleTimeoutCreated(event: DomainEvent): Promise<void> {
        const { groupId, memberId, duration, expiresAt } = event.payload;
        
        if (!groupId || !memberId) {
            ErrorHandler.handle(
                new Error('Missing groupId or memberId in TIMEOUT_CREATED event'),
                'TimeoutExpirationHandler.handleTimeoutCreated'
            );
            return;
        }

        console.log(`Timeout created for member ${memberId} in group ${groupId}, expires at ${expiresAt}`);
        
        // Aqui você pode adicionar lógica adicional, como:
        // - Agendar verificação de expiração
        // - Notificar administradores
        // - Registrar em log de auditoria
    }

    /**
     * Processa evento de timeout expirado
     */
    private async handleTimeoutExpired(event: DomainEvent): Promise<void> {
        const { groupId, memberId } = event.payload;
        
        if (!groupId || !memberId) {
            ErrorHandler.handle(
                new Error('Missing groupId or memberId in TIMEOUT_EXPIRED event'),
                'TimeoutExpirationHandler.handleTimeoutExpired'
            );
            return;
        }

        try {
            // Remover punição do banco de dados
            await dBRepository.deleteCurrentPunishment(groupId, memberId);
            
            // Notificar no grupo que o timeout expirou
            const memberName = await whatsAppRepository.getNotifyNameById(memberId, groupId);
            await whatsAppRepository.sendMessage({
                chatId: groupId,
                message: `BOT: ${memberName} pode voltar a falar! O timeout expirou.`
            });

            console.log(`Timeout expired and removed for member ${memberId} in group ${groupId}`);
        } catch (error) {
            ErrorHandler.handle(error as Error, 'TimeoutExpirationHandler.handleTimeoutExpired');
        }
    }

    /**
     * Processa evento de timeout removido manualmente
     */
    private async handleTimeoutRemoved(event: DomainEvent): Promise<void> {
        const { groupId, memberId } = event.payload;
        
        if (!groupId || !memberId) {
            ErrorHandler.handle(
                new Error('Missing groupId or memberId in TIMEOUT_REMOVED event'),
                'TimeoutExpirationHandler.handleTimeoutRemoved'
            );
            return;
        }

        console.log(`Timeout removed manually for member ${memberId} in group ${groupId}`);
        
        // Aqui você pode adicionar lógica adicional, como:
        // - Registrar quem removeu o timeout
        // - Notificar administradores
    }

    /**
     * Processa evento de verificação de punição
     * Verifica se algum timeout expirou e emite evento de expiração se necessário
     */
    private async handlePunishmentChecked(event: DomainEvent): Promise<void> {
        const { groupId, memberId, punishment } = event.payload;
        
        if (!punishment || punishment.type !== 'timeout') {
            return;
        }

        if (!punishment.expiresAt) {
            return;
        }

        // Verifica se o timeout expirou (comparando com início da hora atual)
        const now = startOfHour(new Date());
        const expiresAt = new Date(punishment.expiresAt);

        if (isBefore(expiresAt, now)) {
            // Timeout expirado - emitir evento de expiração
            eventBus.emit({
                type: DomainEventType.TIMEOUT_EXPIRED,
                payload: {
                    groupId,
                    memberId,
                    expiredAt: expiresAt.toISOString()
                },
                metadata: {
                    groupId,
                    userId: memberId
                }
            });
        }
    }
}

