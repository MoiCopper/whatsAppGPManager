import { whatsAppRepository, dBRepository, timeoutCommand } from '../shared/containers';   
import { Message } from "whatsapp-web.js";
import { ErrorHandler } from '../shared/ErrorHandler';

export class CheckPunishments {
    constructor() {
    }

    async checkPunishments(msg: Message): Promise<{isPunished: boolean}> {
        try {
            let isPunished = false;
            const groupParticipant = await whatsAppRepository.getParticipant(msg);
            const currentPunishment = await dBRepository.getCurrentPunishment(msg.to, groupParticipant.id);

            if (!currentPunishment) {
                return { isPunished: false };
            }

            if (currentPunishment.type === 'timeout') {
                const isTimedOut = await timeoutCommand.isUserTimedOut(msg);
                if (isTimedOut) {
                    await timeoutCommand.checkAndRemoveExpiredTimeout(msg);
                    isPunished = true;
                }
                return { isPunished };
            }

            return { isPunished: false };
        } catch (error) {
            ErrorHandler.handle(error as Error, 'CheckPunishments.checkPunishments');
            // Retornar false em caso de erro para não bloquear o fluxo
            return { isPunished: false };
        }
    }
}