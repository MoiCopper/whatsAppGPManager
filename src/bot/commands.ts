import { Message } from "whatsapp-web.js";
import { timeoutCommand, registerGroupCommand, pingCommand, setFreeCommand } from "../shared/containers";

export const commands =  {
    '/timeout': (msg: Message) => timeoutCommand.execute(msg),
    '/setFree': (msg: Message) => setFreeCommand.execute(msg),
    '/registerGroup': (msg: Message) => registerGroupCommand.execute(msg),
    '/ping': (msg: Message) => pingCommand.execute(msg),
}