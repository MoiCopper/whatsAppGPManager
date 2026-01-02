import { GroupChat, Message } from "whatsapp-web.js";
import { DBService } from "../services/db.service";
import { Member } from "../interfaces/db.interface";

export class RegisterGroupCommand {
    constructor(private dbService: DBService) {
    }

    async registerGroup(msg: Message) {
        const chat = await msg.getChat() as GroupChat;
        const groupId = chat.id._serialized;
        const groupName = chat.name;
        const groupDescription = chat.description;
        const members: Record<string, Member> = {};
        const participants = await chat.participants;
        for(const participant of participants){
            members[participant.id._serialized] = {
                id: participant.id._serialized,
                name: '',
                isAdmin: participant.isAdmin,
                punishments: {
                    timeout: 0,
                    mute: 0,
                    ban: 0,
                    kick: 0,
                    warn: 0,
                    note: '',
                },
                menssagesIds: [],
                numberOfMessages: 1
            };
        }

        const group = await this.dbService.registerGroup({
            id: groupId,
            name: groupName,
            description: groupDescription,
            members: members,
        });

        msg.reply(`BOT: Grupo ${groupName} registrado com sucesso`);

        return group;
    }
}