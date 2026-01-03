import { Message } from 'whatsapp-web.js';
import { setReadyStatus, updateQRCode } from '../api';
import { checkPunishments, whatsAppRepository } from '../shared/containers';
import { cdmCommandHandler } from '../bot/cdm';
import { dBRepository } from '../shared/containers';
import { Group } from '../dtos/db.interface';
import { ErrorHandler } from '../shared/ErrorHandler';


export class ClientService {
    onReady(): void {
        console.log('Client is ready!');
        setReadyStatus(true);
    }

    onQR(qr: string): void {
        updateQRCode(qr);
    }

    
    async onMessageCreate(msg: Message): Promise<void> {
        if ((msg.fromMe && msg.body.includes('BOT:'))) {
            return;
        }

        try {
            const chat = await whatsAppRepository.getChat(msg.to, msg);
            
            if(!chat.isGroup){
                return;
            }

            const groupParticipant = await whatsAppRepository.getParticipant(msg);

            if(!groupParticipant.participant){
                console.error('Group participant not found');
                return;
            }

            const { isPunished } = await checkPunishments.checkPunishments(msg);
            if (isPunished) {
                return;
            }

            if (msg.body.startsWith('/')) {
                console.log('Command received:', msg.body);
                if (groupParticipant.participant?.isAdmin) {
                    cdmCommandHandler(msg);
                }
            }

            const isGroupRegistered = await dBRepository.groupExists(chat.id._serialized);
            if(isGroupRegistered){
                const group = await dBRepository.getGroup(chat.id._serialized) as Group;
                const member = group?.members[groupParticipant.id];
                if(!member){
                    await dBRepository.createMember(chat.id._serialized, {
                        id: groupParticipant.id,
                        name: whatsAppRepository.getNotifyName(msg),
                        isAdmin: groupParticipant.participant.isAdmin,
                    });
                    
                    return;
                }

                if(member.name === ''){
                    member.name = whatsAppRepository.getNotifyName(msg);
                    await dBRepository.updateMember(chat.id._serialized, groupParticipant.id, {
                        name: member.name
                    });
                }

                member.numberOfMessages++;
                await dBRepository.updateMember(chat.id._serialized, groupParticipant.id, {
                    numberOfMessages: member.numberOfMessages
                });
            }

        } catch (error) {
            ErrorHandler.handle(error as Error, 'ClientService.onMessageCreate');
            try {
                msg.reply('BOT: 🤖🤖🤖 MOISES FEZ ALGUMA COISA DE ERRADO KKKKK PQ O BOT NAO ENTENDEU NADA');
            } catch (replyError) {
                ErrorHandler.handle(replyError as Error, 'ClientService.onMessageCreate.reply');
            }
        }
    }

    /**
     * Handle authentication failure event
     */
    onAuthFailure(msg: string): void {
        ErrorHandler.handle(new Error(`Authentication failed: ${msg}`), 'ClientService.onAuthFailure');
    }

    /**
     * Handle client disconnected event
     */
    onDisconnected(reason: string): void {
        ErrorHandler.handle(new Error(`Client disconnected: ${reason}`), 'ClientService.onDisconnected');
    }
}

