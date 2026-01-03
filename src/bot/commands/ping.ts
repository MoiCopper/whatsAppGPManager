import { Message } from "whatsapp-web.js";
import { ICommand } from "./ICommand";
import { ErrorHandler } from "../../shared/ErrorHandler";

export class PingCommand implements ICommand {
    async execute(msg: Message): Promise<void> {
        try {
            msg.reply(`BOT: Pong`);
        } catch (error) {
            ErrorHandler.handle(error as Error, 'PingCommand.execute');
            throw error;
        }
    }
}