import { Message } from 'whatsapp-web.js';
import { whatsAppRepository, dBRepository, eventBus } from '../../shared/containers';
import { ICommand } from './ICommand';
import { ErrorHandler } from '../../shared/ErrorHandler';
import { CommandExecutedPayload, DomainEvent, DomainEventType } from '../../shared/events';

export class SetFreeCommand implements ICommand {
    constructor() {
        eventBus.on(DomainEventType.COMMAND_EXECUTED).subscribe(async ({payload}: DomainEvent<CommandExecutedPayload>) => {
            console.log('[SetFreeCommand] Evento COMMAND_EXECUTED recebido, command:', payload.command);
            if(payload.command === '/setFree'){
                await this.execute(payload.message);
            }
        });
    }
    async execute(msg: Message): Promise<void> {
        try {
            await this.setFreeUser(msg);
        } catch (error) {
            ErrorHandler.handle(error as Error, 'SetFreeCommand.execute');
            throw error;
        }
    }

    async setFreeUser(msg: Message): Promise<void> {
        const targetUserId = await whatsAppRepository.getTargetUserId(msg);
        const chat = await whatsAppRepository.getChat(msg.to, msg);
        if(!targetUserId) {
            return;
        }

        await dBRepository.deleteCurrentPunishment(chat.id._serialized, targetUserId);

        // Emitir evento de timeout removido manualmente
        eventBus.emit({
            type: DomainEventType.TIMEOUT_REMOVED,
            payload: {
                groupId: chat.id._serialized,
                memberId: targetUserId,
                reason: 'manual'
            },
            metadata: {
                groupId: chat.id._serialized,
                userId: targetUserId
            }
        });

        await whatsAppRepository.replyMessage({
            chatId: chat.id._serialized, 
            message: `BOT: ${await whatsAppRepository.getNotifyNameById(targetUserId, chat.id._serialized)} parou de mamar`
        });
    }
}

