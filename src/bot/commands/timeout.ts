import { Message } from 'whatsapp-web.js';
import { parseTimeToMs } from '../../utils/parseTimeToMs';
import { formatTimeDuration } from '../../utils/formatTimeDuration';
import { extractTimeArgument } from '../../utils/extractTimeArgument';
import { whatsAppRepository, dBRepository, eventBus, checkPunishments } from '../../shared/containers';
import { startOfHour, isBefore } from 'date-fns';
import { ICommand } from './ICommand';
import { ErrorHandler } from '../../shared/ErrorHandler';
import { CommandExecutedPayload, DomainEvent, DomainEventType, MemberMessageSentPayload, PunishmentCheckedPayload } from '../../shared/events';

export class TimeoutCommand implements ICommand {

    constructor() {
        console.log('[TimeoutCommand] Registrando listeners...');
        eventBus.on(DomainEventType.PUNISHMENT_CHECKED).subscribe(async ({payload}: DomainEvent<PunishmentCheckedPayload>) => {
            console.log('[TimeoutCommand] Evento PUNISHMENT_CHECKED recebido');
            if(payload.punishment.type === 'timeout'){
                await this.checkAndRemoveExpiredTimeout(payload);
            }
        });
        eventBus.on(DomainEventType.COMMAND_EXECUTED).subscribe(async ({payload}: DomainEvent<CommandExecutedPayload>) => {
            console.log('[TimeoutCommand] Evento COMMAND_EXECUTED recebido, command:', payload.command);
            // O comando vem com a barra inicial (ex: '/timeout')
            if(payload.command === '/timeout'){
                console.log('[TimeoutCommand] Processando comando /timeout');
                await this.execute(payload.message);
            }
        });
        console.log('[TimeoutCommand] Listeners registrados com sucesso');
    }

    async execute(msg: Message): Promise<void> {
        try {
            await this.timeoutUser(msg);
        } catch (error) {
            ErrorHandler.handle(error as Error, 'TimeoutCommand.execute');
            throw error;
        }
    }

    async timeoutUser(msg: Message): Promise<void> {
        const targetUserId = await whatsAppRepository.getTargetUserId(msg);

        const chat = await whatsAppRepository.getChat(msg.to, msg);
        if (!targetUserId) {
            return;
        }

        const timeStr = extractTimeArgument(msg.body);
        const timeoutMs = parseTimeToMs(timeStr);
        const durationText = formatTimeDuration(timeoutMs);

        await whatsAppRepository.sendMessage({
            chatId: chat.id._serialized, 
            message: `BOT: ${await whatsAppRepository.getNotifyNameById(targetUserId, chat.id._serialized)} vai mamar por ${durationText}`});


        const expiresAt = new Date(Date.now() + timeoutMs);
        await dBRepository.createAPunishment({
            groupId: chat.id._serialized, 
            memberId: targetUserId, 
            type: 'timeout', 
            duration: timeoutMs, 
            reason: 'Mamar', 
            expiresAt
        });

        // Emitir evento de timeout criado
        eventBus.emit({
            type: DomainEventType.TIMEOUT_CREATED,
            payload: {
                groupId: chat.id._serialized,
                memberId: targetUserId,
                duration: timeoutMs,
                expiresAt: expiresAt.toISOString()
            },
            metadata: {
                groupId: chat.id._serialized,
                userId: targetUserId
            }
        });
    }

    async isUserTimedOut(msg: Message): Promise<boolean> {
        const groupParticipant = await whatsAppRepository.getParticipant(msg);

        if(!groupParticipant.participant){
            return false;   
        }

        const chat = await whatsAppRepository.getChat(msg.to, msg);

        const currentPunishment = await dBRepository.getCurrentPunishment(chat.id._serialized, groupParticipant.id);
        if(!currentPunishment){
            return false;
        }
        return !!(currentPunishment.expiresAt && isBefore(currentPunishment.expiresAt, startOfHour(new Date())));   
    }

    async checkAndRemoveExpiredTimeout({groupId, memberId, message, punishment}: PunishmentCheckedPayload): Promise<void> {
        const chat = await whatsAppRepository.getChat(groupId, message);
        const now = new Date(Date.now());
        if (punishment.expiresAt && isBefore(punishment.expiresAt as Date, now)) {
            await dBRepository.deleteCurrentPunishment(groupId, memberId);
            
            // Emitir evento de timeout removido (expirado)
            eventBus.emit({
                type: DomainEventType.TIMEOUT_REMOVED,
                payload: {
                    groupId: groupId,
                    memberId: memberId,
                    reason: 'expired'
                },
                metadata: {
                    groupId: groupId,
                    userId: memberId
                }
            });
            
            return;
        }

        await whatsAppRepository.sendMessage({
            chatId: chat.id._serialized, 
            message: `BOT: CALMA ${whatsAppRepository.getNotifyName(message).toUpperCase()}, VOCE ESTA DE BOCA CHEIA GLUB GLUB GLUB 🍆🍆🍆`
        });
        message.delete(true);
    }

}


