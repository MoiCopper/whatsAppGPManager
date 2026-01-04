import { BaseEventHandler } from '../../shared/events/BaseEventHandler';
import { DomainEvent, DomainEventType } from '../../shared/events';
import { dBRepository } from '../../shared/containers';
import { ErrorHandler } from '../../shared/ErrorHandler';

/**
 * Handler para processar eventos relacionados a estatísticas de membros
 * Atualiza contadores e métricas quando membros enviam mensagens ou são criados/atualizados
 * 
 * Este handler se auto-registra nos eventos quando é instanciado
 */
export class MemberStatsHandler extends BaseEventHandler {
    /**
     * Define os tipos de eventos que este handler processa
     */
    protected getEventTypes(): DomainEventType[] {
        return [
            DomainEventType.MEMBER_MESSAGE_SENT,
            DomainEventType.MEMBER_CREATED,
            DomainEventType.MEMBER_UPDATED
        ];
    }
    async handle(event: DomainEvent): Promise<void> {
        try {
            switch (event.type) {
                case DomainEventType.MEMBER_MESSAGE_SENT:
                    await this.handleMemberMessageSent(event);
                    break;
                case DomainEventType.MEMBER_CREATED:
                    await this.handleMemberCreated(event);
                    break;
                case DomainEventType.MEMBER_UPDATED:
                    await this.handleMemberUpdated(event);
                    break;
            }
        } catch (error) {
            ErrorHandler.handle(error as Error, `MemberStatsHandler.handle.${event.type}`);
        }
    }

    /**
     * Processa evento de mensagem enviada por membro
     */
    private async handleMemberMessageSent(event: DomainEvent): Promise<void> {
        const { groupId, memberId } = event.payload;
        
        if (!groupId || !memberId) {
            ErrorHandler.handle(
                new Error('Missing groupId or memberId in MEMBER_MESSAGE_SENT event'),
                'MemberStatsHandler.handleMemberMessageSent'
            );
            return;
        }

        const group = await dBRepository.getGroup(groupId);
        if (!group) {
            ErrorHandler.handle(
                new Error(`Group ${groupId} not found`),
                'MemberStatsHandler.handleMemberMessageSent'
            );
            return;
        }

        const member = group.members[memberId];
        if (!member) {
            ErrorHandler.handle(
                new Error(`Member ${memberId} not found in group ${groupId}`),
                'MemberStatsHandler.handleMemberMessageSent'
            );
            return;
        }

        // Incrementar contador de mensagens
        member.numberOfMessages = (member.numberOfMessages || 0) + 1;
        
        // Adicionar ID da mensagem ao histórico se disponível
        if (event.payload.messageId) {
            if (!member.menssagesIds) {
                member.menssagesIds = [];
            }
            member.menssagesIds.push(event.payload.messageId);
            
            // Manter apenas os últimos 100 IDs de mensagens
            if (member.menssagesIds.length > 100) {
                member.menssagesIds = member.menssagesIds.slice(-100);
            }
        }

        await dBRepository.updateMember(groupId, memberId, {
            numberOfMessages: member.numberOfMessages,
            menssagesIds: member.menssagesIds
        });
    }

    /**
     * Processa evento de membro criado
     */
    private async handleMemberCreated(event: DomainEvent): Promise<void> {
        const { groupId, memberId } = event.payload;
        
        if (!groupId || !memberId) {
            ErrorHandler.handle(
                new Error('Missing groupId or memberId in MEMBER_CREATED event'),
                'MemberStatsHandler.handleMemberCreated'
            );
            return;
        }

        // Log para auditoria
        console.log(`Member ${memberId} created in group ${groupId}`);
    }

    /**
     * Processa evento de membro atualizado
     */
    private async handleMemberUpdated(event: DomainEvent): Promise<void> {
        const { groupId, memberId } = event.payload;
        
        if (!groupId || !memberId) {
            ErrorHandler.handle(
                new Error('Missing groupId or memberId in MEMBER_UPDATED event'),
                'MemberStatsHandler.handleMemberUpdated'
            );
            return;
        }

        // Log para auditoria
        console.log(`Member ${memberId} updated in group ${groupId}`);
    }
}

