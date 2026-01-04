import { whatsAppRepository, dBRepository, eventBus } from '../shared/containers';   
import { GroupChat, Message } from "whatsapp-web.js";
import { ErrorHandler } from '../shared/ErrorHandler';
import { DomainEvent, DomainEventType, MemberMessageSentPayload, PunishmentCheckedPayload } from '../shared/events';

export class CheckPunishments {
    constructor() {
        console.log('[CheckPunishments] Registrando listener para MEMBER_MESSAGE_SENT');
        eventBus.on(DomainEventType.MEMBER_MESSAGE_SENT).subscribe(async (event: DomainEvent<MemberMessageSentPayload>) => {
            console.log('[CheckPunishments] Evento MEMBER_MESSAGE_SENT recebido');
            await this.checkPunishments(event.payload.message);
        });
    }

    async checkPunishments(msg: Message): Promise<void> {
        try {
            const groupParticipant = await whatsAppRepository.getParticipant(msg);
            const chat = await msg.getChat() as GroupChat;
            const currentPunishment = await dBRepository.getCurrentPunishment(chat.id._serialized, groupParticipant.id);

            if (!currentPunishment) {
                return;
            }

            // Emitir evento de verificação de punição
            eventBus.emit<PunishmentCheckedPayload>({
                type: DomainEventType.PUNISHMENT_CHECKED,
                payload: {
                    groupId: chat.id._serialized,
                    memberId: groupParticipant.id,
                    punishment: currentPunishment,
                    message: msg
                },
                metadata: {
                    groupId: chat.id._serialized,
                    userId: groupParticipant.id
                }
            });
        } catch (error) {
            ErrorHandler.handle(error as Error, 'CheckPunishments.checkPunishments');
        }
    }
}