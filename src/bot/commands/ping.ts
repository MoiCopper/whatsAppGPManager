import { Message } from "whatsapp-web.js";
import { ICommand } from "./ICommand";
import { ErrorHandler } from "../../shared/ErrorHandler";
import { eventBus } from '../../shared/containers';
import { CommandExecutedPayload, DomainEvent, DomainEventType } from "../../shared/events";

export class PingCommand implements ICommand {
    constructor() {
        eventBus.on(DomainEventType.COMMAND_EXECUTED).subscribe(async ({payload}: DomainEvent<CommandExecutedPayload>) => {
            console.log('[PingCommand] Evento COMMAND_EXECUTED recebido, command:', payload.command);
            if(payload.command === '/ping'){
                await this.execute(payload.message);
            }
        });
    }
    async execute(msg: Message): Promise<void> {
        try {
            msg.reply(`BOT: Pong`);
        } catch (error) {
            ErrorHandler.handle(error as Error, 'PingCommand.execute');
            throw error;
        }
    }
}