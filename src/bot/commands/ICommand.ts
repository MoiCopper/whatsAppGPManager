import { Message } from 'whatsapp-web.js';

export interface ICommand {
    execute(msg: Message): Promise<void>;
}

