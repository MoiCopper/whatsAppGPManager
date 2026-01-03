import { clientService, whatsAppRepository } from '../shared/containers';
import { EventsType } from '../dtos/eventsType.interface';
import { Message } from 'whatsapp-web.js';

export class ClientController { 
    constructor() {}
    public async registerEvents(): Promise<void> {
        return new Promise((resolve) => {
            whatsAppRepository.onChatEvent.subscribe((event) => {
                switch (event.event) {
                    case EventsType.READY:
                        clientService.onReady();
                        break;
                    case EventsType.QR:
                        clientService.onQR(event.data as string);
                        break;
                    case EventsType.MESSAGE_CREATE:
                        clientService.onMessageCreate(event.data as Message);
                        break;
                    case EventsType.AUTH_FAILURE:
                        clientService.onAuthFailure(event.data as string);
                        break;
                    case EventsType.DISCONNECTED:
                        clientService.onDisconnected(event.data as string);
                        break;
                }
                resolve();
            });
        });

    }
}

