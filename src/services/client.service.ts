import { Message, GroupChat } from 'whatsapp-web.js';
import { Client } from 'whatsapp-web.js';
import { setReadyStatus, updateQRCode } from '../api';
import { whatsappService, timeoutCommand } from '../dependencies/instances';
import { cdmCommandHandler } from '../commands/cdm';
import { dbService } from '../dependencies/instances';
import { Group, Member } from '../interfaces/db.interface';

export class ClientService {
    private client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    /**
     * Handle client ready event
     */
    onReady(): void {
        console.log('Client is ready!');
        setReadyStatus(true);
    }

    /**
     * Handle QR code generation event
     */
    onQR(qr: string): void {
        // Store QR code for web display
        updateQRCode(qr);
    }

    
    async onMessageCreate(msg: Message): Promise<void> {
        if (msg.fromMe && msg.body.includes('BOT:')) {
            return;
        }

        try {
            const userId = msg.author || msg.from;
            const chat = await msg.getChat() as GroupChat;
            const participant = chat.participants.find(
                p => p.id._serialized === msg.author || msg.from
            );

            if (timeoutCommand.isUserTimedOut(userId)) {
                if (!timeoutCommand.checkAndRemoveExpiredTimeout(userId)) {
                    return;
                }
                
                await this.client.sendMessage(
                    chat.id._serialized,
                    `BOT: CALMA ${whatsappService.getNotifyName(msg).toUpperCase()}, VOCE ESTA DE BOCA CHEIA GLUB GLUB GLUB 🍆🍆🍆`
                );
                msg.delete(true);
                return;
            }

            if (msg.body.startsWith('/')) {
                console.log('Command received:', msg.body);
                if (participant?.isAdmin) {
                    cdmCommandHandler(msg);
                }
            }

            const isGroupRegistered = await dbService.groupExists(chat.id._serialized);
            if(isGroupRegistered){
                const group = await dbService.getGroup(chat.id._serialized) as Group;
                const member = group?.members[msg.author || msg.from];
                if(!member){
                    await dbService.createMember(chat.id._serialized, {
                        id: participant?.id._serialized || (msg.author || msg.from),
                        name: whatsappService.getNotifyName(msg),
                        isAdmin: participant?.isAdmin || false,
                    });
                    
                    return;
                }

                if(member.name === ''){
                    member.name = whatsappService.getNotifyName(msg);
                    await dbService.updateMember(chat.id._serialized, msg.author || msg.from, {
                        name: member.name
                    });
                }

                member.numberOfMessages++;
                await dbService.updateMember(chat.id._serialized, msg.author || msg.from, {
                    numberOfMessages: member.numberOfMessages
                });
            }

        } catch (error) {
            console.error('Error processing message:', error);
            msg.reply('BOT: 🤖🤖🤖 MOISES FEZ ALGUMA COISA DE ERRADO KKKKK PQ O BOT NAO ENTENDEU NADA');
        }
    }

    /**
     * Handle authentication failure event
     */
    onAuthFailure(msg: string): void {
        console.error('Authentication failed:', msg);
    }

    /**
     * Handle client disconnected event
     */
    onDisconnected(reason: string): void {
        console.log('Client was disconnected:', reason);
    }
}

