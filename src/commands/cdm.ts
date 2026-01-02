import { Message } from "whatsapp-web.js";
import { commands } from "./commands";

export async function cdmCommandHandler(msg: Message) {
    const command = msg.body.split(' ')[0];
    if(commands[command as keyof typeof commands]) {
        await commands[command as keyof typeof commands](msg);
    }
}

