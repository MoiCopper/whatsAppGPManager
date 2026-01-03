import { Message } from 'whatsapp-web.js';
import { parseTimeToMs } from '../../utils/parseTimeToMs';
import { formatTimeDuration } from '../../utils/formatTimeDuration';
import { extractTimeArgument } from '../../utils/extractTimeArgument';
import { whatsAppRepository, dBRepository } from '../../shared/containers';
import { startOfHour, isBefore } from 'date-fns';
import { ICommand } from './ICommand';
import { ErrorHandler } from '../../shared/ErrorHandler';

export class TimeoutCommand implements ICommand {
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


        await dBRepository.createAPunishment({
            groupId: chat.id._serialized, 
            memberId: targetUserId, 
            type: 'timeout', 
            duration: timeoutMs, 
            reason: 'Mamar', 
            expiresAt: new Date(Date.now() + timeoutMs)});
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

    async checkAndRemoveExpiredTimeout(msg: Message): Promise<void> {
        const chat = await whatsAppRepository.getChat(msg.to, msg);
        const timeout = await dBRepository.getCurrentPunishment(msg.to, chat.id._serialized);
        if (timeout && isBefore(timeout.expiresAt as Date, startOfHour(new Date()))) {
            await dBRepository.deleteCurrentPunishment(msg.to, chat.id._serialized);
            return;
        }

        await whatsAppRepository.sendMessage({
            chatId: chat.id._serialized, 
            message: `BOT: CALMA ${whatsAppRepository.getNotifyName(msg).toUpperCase()}, VOCE ESTA DE BOCA CHEIA GLUB GLUB GLUB 🍆🍆🍆`
        });
        msg.delete(true);
    }

}


