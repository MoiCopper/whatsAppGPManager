import { Client, Message } from 'whatsapp-web.js';
import { WhatsappService } from '../services/whatsapp.service';
import { parseTimeToMs } from '../utils/parseTimeToMs';
import { formatTimeDuration } from '../utils/formatTimeDuration';
import { extractTimeArgument } from '../utils/extractTimeArgument';

export class TimeoutCommand {
    private userTimeoutsList: Map<string, number>;
    private client: Client;
    private whatsappService: WhatsappService;
    constructor(client: Client, whatsappService: WhatsappService) {
        this.client = client;
        this.whatsappService = whatsappService;
        this.userTimeoutsList = new Map<string, number>();
    }

    async timeoutUser(msg: Message): Promise<void> {
        const targetUserId = await this.whatsappService.getTargetUserId(msg);

        const chat = await msg.getChat();
        if (!targetUserId) {
            return;
        }

        const timeStr = extractTimeArgument(msg.body);
        const timeoutMs = parseTimeToMs(timeStr);
        const durationText = formatTimeDuration(timeoutMs);

        await this.client.sendMessage(chat.id._serialized, `BOT: ${await this.whatsappService.getNotifyNameById(targetUserId, chat.id._serialized)} vai mamar por ${durationText}`);
        this.userTimeoutsList.set(targetUserId, Date.now() + timeoutMs);
    }

    async setFreeUser(msg: Message): Promise<void> {
        const targetUserId = await this.whatsappService.getTargetUserId(msg);
        const chat = await msg.getChat();
        if(!targetUserId) {
            return;
        }
        this.userTimeoutsList.delete(targetUserId as string);
        msg.reply(`BOT: ${await this.whatsappService.getNotifyNameById(targetUserId, chat.id._serialized)} parou de mamar`);
    }

    isUserTimedOut(userId: string): boolean {
        return this.userTimeoutsList.has(userId);
    }

    checkAndRemoveExpiredTimeout(userId: string): boolean {
        const timeout = this.userTimeoutsList.get(userId);
        if (timeout && timeout < Date.now()) {
            this.userTimeoutsList.delete(userId);
            return false;
        }
        return timeout !== undefined && timeout >= Date.now();
    }

}


