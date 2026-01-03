import { Message } from "whatsapp-web.js";
import { commands } from "./commands";
import { ErrorHandler } from "../shared/ErrorHandler";

export async function cdmCommandHandler(msg: Message) {
    try {
        const command = msg.body.split(' ')[0];
        if(commands[command as keyof typeof commands]) {
            await commands[command as keyof typeof commands](msg);
        }
    } catch (error) {
        ErrorHandler.handle(error as Error, 'cdmCommandHandler');
        // Enviar mensagem de erro ao usuário
        try {
            msg.reply('BOT: 🤖🤖🤖 MOISES FEZ ALGUMA COISA DE ERRADO KKKKK PQ O BOT NAO ENTENDEU NADA');
        } catch (replyError) {
            ErrorHandler.handle(replyError as Error, 'cdmCommandHandler.reply');
        }
    }
}

