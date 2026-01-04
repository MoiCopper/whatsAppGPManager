import { Message } from "whatsapp-web.js";
import { eventBus } from "../shared/containers";
import { DomainEvent, DomainEventType, MemberMessageSentPayload } from "../shared/events";

export class CdmCommandHandler {
    private validComands: string[] = ['/timeout', '/setFree', '/registerGroup', '/ping'];
    constructor() {
        console.log('[CdmCommandHandler] Registrando listener para MEMBER_MESSAGE_SENT');
        eventBus.on(DomainEventType.MEMBER_MESSAGE_SENT).subscribe(async ({payload}: DomainEvent<MemberMessageSentPayload>) => {
            console.log('[CdmCommandHandler] Evento MEMBER_MESSAGE_SENT recebido');
            if(this.isCommand(payload.message)) {
                await this.handleCommand(payload.message);
            }
        });
    }

    private isCommand(msg: Message): boolean {
        const isCommand = msg.body.startsWith('/');

        if(!isCommand) {
            return false;
        }
        
        const command = msg.body.split(' ')[0];
        const isValidCommand = this.validComands.includes(command);
        
        if(isValidCommand) {
            return true;
        }

        msg.reply(`BOT: Oh meu amor, usa o bot direito, por favor! \n\n os comandos validos sao: \n${this.validComands.join('\n')}
        `);

        return false;
    }

    private async handleCommand(msg: Message): Promise<void> {
        const command = msg.body.split(' ')[0];
        console.log('[CdmCommandHandler] Emitindo COMMAND_EXECUTED para comando:', command);
        eventBus.emit({
            type: DomainEventType.COMMAND_EXECUTED,
            payload: {
                command: command,
                message: msg
            }
        });
    }
}

