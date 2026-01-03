import { Subject } from "rxjs";
import { WhatsAppClientAdapter } from "../adapters/whatsapp-client.adapter";
import { EventsType, IWhatsAppEvent, IWhatsAppParticipant } from "../dtos/eventsType.interface";
import { Client, GroupChat, Message } from "whatsapp-web.js";
import { dBRepository } from "../shared/containers";

export class WhatsAppRepository {
    private client:WhatsAppClientAdapter
    private clientInstance: Client;
    public onChatEvent = new Subject<IWhatsAppEvent>()
    public chats: Map<string, GroupChat> = new Map();

    constructor() {
        this.client = new WhatsAppClientAdapter();
        this.client.initialize().then(() => {
            this.registerEvents();
        }).catch((error) => {
            console.error('Failed to initialize client:', error);
            process.exit(1);
        });
        this.clientInstance = this.client.getInstance();
    }

    private registerEvents(): void {
        this.client.on(EventsType.READY, () => {
            this.onChatEvent.next({ event: EventsType.READY, data: null });
        });

        this.client.on(EventsType.QR, (qr) => {
            this.onChatEvent.next({ event: EventsType.QR, data: qr });
        });

        this.client.on(EventsType.MESSAGE_CREATE, async (msg) => {
            this.onChatEvent.next({ event: EventsType.MESSAGE_CREATE, data: msg });
        }); 

        this.client.on(EventsType.AUTH_FAILURE, (msg) => {
            this.onChatEvent.next({ event: EventsType.AUTH_FAILURE, data: msg });
        });

        this.client.on(EventsType.DISCONNECTED, (reason) => {
            this.onChatEvent.next({ event: EventsType.DISCONNECTED, data: reason });
        });
    }

    public async getChat(chatId: string, msg: Message): Promise<GroupChat> {
        let chat = this.chats.get(chatId);
        if(!chat){
            chat = await msg.getChat() as GroupChat;
            this.chats.set(chatId, chat);
        }
        return chat;
    }

    public async setChat(chatId: string, chat: GroupChat): Promise<void> {
        this.chats.set(chatId, chat);
    }

    public sendMessage({chatId, message}: {chatId: string, message: string}): Promise<Message> {
        return this.clientInstance.sendMessage(chatId, message);
    }

    public async replyMessage({chatId, message}: {chatId: string, message: string}): Promise<Message> {
        return this.clientInstance.sendMessage(chatId, message);
    }

    public async getParticipant(msg: Message): Promise<IWhatsAppParticipant> {
            let userId = msg.author || msg.from;
            const chat = await this.getChat(msg.to, msg)
            let participant = chat.participants.find(
                p => p.id._serialized === userId || (p as any).id_serialized === userId
            );
            
            // If participant not found and userId is @lid formxat, convert it to @c.us format
            if (!participant && userId) {
                const phoneNumberId = await this.convertLidToPhoneNumber(userId);
                if (phoneNumberId) {
                    userId = phoneNumberId;
                    participant = chat.participants.find(
                        p => p.id._serialized === userId
                    );
                }
            }

            if(!participant){
                const freshChat = await msg.getChat() as GroupChat;
                participant = freshChat.participants.find(
                    p => p.id._serialized === userId
                );
                this.setChat(freshChat.id._serialized, freshChat);
            }

            return { id: userId, author: msg.author, participant: participant };
    }

    public async getTargetUserId(msg: Message): Promise<string> {
        let targetUserId = null;
        if(msg.hasQuotedMsg){
            const quotedMsg = await msg.getQuotedMessage();
            const participant = await this.getParticipant(quotedMsg);
            targetUserId = participant.id;
        }else{
            targetUserId = msg.mentionedIds[0];
        }
        return targetUserId;
    }

    /**
     * Converts a @lid format ID to @c.us format (phone number ID)
     * @param userId - The user ID in @lid or @c.us format
     * @returns The converted phone number ID in @c.us format, or null if conversion fails or ID is not in @lid format
     */
    public async convertLidToPhoneNumber(userId: string): Promise<string | null> {
        // If not @lid format or pupPage not available, return null
        if (!userId || !userId.endsWith('@lid') || !this.clientInstance.pupPage) {
            return null;
        }

        try {
            // Use WidFactory to create proper WhatsApp ID object, then convert using LidUtils
            const phoneNumberId = await this.clientInstance.pupPage.evaluate((userIdStr: string) => {
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

    public getNotifyName(msg: Message): string {
        const msgString = JSON.stringify(msg);
        return msgString.split('"notifyName":"')[1]?.split('",')[0] || '[FULANO(A)]';
    }

    public async getNotifyNameById(id: string, groupId?: string): Promise<string> {
        try {
            // const contact = await this.client.getContactById(id);
            // return contact.name || dBRepository.getUserName(groupId || '', id);
            return await dBRepository.getUserName(groupId || '', id);
        } catch (error) {
            return '[FULANO(A)]';
        }
    }
}