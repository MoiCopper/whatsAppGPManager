import { Message } from 'whatsapp-web.js';
import { whatsAppRepository, dBRepository } from '../../shared/containers';
import { ICommand } from './ICommand';
import { ErrorHandler } from '../../shared/ErrorHandler';

export class SetFreeCommand implements ICommand {
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

        await whatsAppRepository.replyMessage({
            chatId: chat.id._serialized, 
            message: `BOT: ${await whatsAppRepository.getNotifyNameById(targetUserId, chat.id._serialized)} parou de mamar`
        });
    }
}

