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
            // const contact = await this.client.getContactById(id);
            // return contact.name || dbService.getUserName(groupId || '', id);
            return await dbService.getUserName(groupId || '', id);
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

    /**
     * Converts a @lid format ID to @c.us format (phone number ID)
     * @param userId - The user ID in @lid or @c.us format
     * @returns The converted phone number ID in @c.us format, or null if conversion fails or ID is not in @lid format
     */
    public async convertLidToPhoneNumber(userId: string): Promise<string | null> {
        // If not @lid format or pupPage not available, return null
        if (!userId || !userId.endsWith('@lid') || !this.client.pupPage) {
            return null;
        }

        try {
            // Use WidFactory to create proper WhatsApp ID object, then convert using LidUtils
            const phoneNumberId = await this.client.pupPage.evaluate((userIdStr: string) => {
                // @ts-ignore - window is available in browser context
                if (window.Store && window.Store.WidFactory && window.Store.LidUtils) {
                    try {
                        // @ts-ignore
                        const wid = window.Store.WidFactory.createWid(userIdStr);
                        // Convert lid to phone number if it's a lid format
                        // @ts-ignore
                        if (wid.server === 'lid' && window.Store.LidUtils.getPhoneNumber) {
                            // @ts-ignore
                            const phoneId = window.Store.LidUtils.getPhoneNumber(wid);
                            return phoneId ? phoneId._serialized : null;
                        }
                    } catch (e) {
                        return null;
                    }
                }
                return null;
            }, userId);

            return phoneNumberId || null;
        } catch (error) {
            console.warn('Failed to convert lid ID to phone number:', error);
            return null;
        }
    }
}