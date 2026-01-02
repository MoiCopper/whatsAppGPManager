import { Message } from "whatsapp-web.js";
import { timeoutCommand, registerGroupCommand } from "../dependencies/instances";

export const commands =  {
    '/timeout': (msg: Message) => timeoutCommand.timeoutUser(msg),
    '/setFree': (msg: Message) => timeoutCommand.setFreeUser(msg),
    '/registerGroup': (msg: Message) => registerGroupCommand.registerGroup(msg),
}