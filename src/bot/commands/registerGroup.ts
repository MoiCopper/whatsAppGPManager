import { GroupChat, Message } from "whatsapp-web.js";
import { dBRepository } from '../../shared/containers';
import { Member } from "../../dtos/db.interface";
import { ICommand } from './ICommand';
import { ErrorHandler } from '../../shared/ErrorHandler';

export class RegisterGroupCommand implements ICommand {
    async execute(msg: Message): Promise<void> {
        try {
            await this.registerGroup(msg);
        } catch (error) {
            ErrorHandler.handle(error as Error, 'RegisterGroupCommand.execute');
            throw error;
        }
    }

    async registerGroup(msg: Message) {
        const chat = await msg.getChat() as GroupChat;
        const groupId = chat.id._serialized;
        const groupName = chat.name;

        const isGroupRegistered = await dBRepository.groupExists(groupId);
        if(isGroupRegistered){
            msg.reply(`BOT: Grupo ${groupName} já está registrado meu amooor 😍🤖`);
            return;
        }

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

        const group = await dBRepository.registerGroup({
            id: groupId,
            name: groupName,
            description: groupDescription,
            members: members,
        });

        msg.reply(`BOT: Grupo ${groupName} registrado com sucesso`);

        return group;
    }
}