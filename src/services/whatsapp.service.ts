import { Client, Message } from "whatsapp-web.js";
import { dbService } from '../dependencies/instances';

export class WhatsappService {
    private client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    public getNotifyName(msg: Message): string {
        const msgString = JSON.stringify(msg);
        return msgString.split('"notifyName":"')[1]?.split('",')[0] || '[FULANO(A)]';
    }

    public async getNotifyNameById(id: string, groupId?: string): Promise<string> {
        try {
            const contact = await this.client.getContactById(id);
            return contact.name || dbService.getUserName(groupId || '', id);
        } catch (error) {
            return '[FULANO(A)]';
        }
    }

    public async getTargetUserId(msg: Message): Promise<string | null> {
        let targetUserId = null;
        if(msg.hasQuotedMsg){
            const quotedMsg = await msg.getQuotedMessage();
            targetUserId = quotedMsg.author;
        }else{
            targetUserId = msg.mentionedIds[0];
        }
        return targetUserId || null;
    }
}