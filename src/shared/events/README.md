# EventBus - Sistema de Eventos de Domínio

O EventBus é um sistema centralizado para gerenciar eventos de domínio na aplicação, permitindo desacoplamento entre componentes.

## Uso Básico

### Emitir um evento (com tipagem forte)

```typescript
import { eventBus } from '../shared/containers';
import { DomainEventType, MemberMessageSentPayload } from '../shared/events';

// Emitir evento com tipagem forte
eventBus.emit<MemberMessageSentPayload>({
    type: DomainEventType.MEMBER_MESSAGE_SENT,
    payload: {
        groupId: '123@g.us',
        memberId: '123@c.us',
        message: 'Olá!',
        messageId: 'msg123' // opcional
    },
    metadata: {
        userId: '123@c.us',
        groupId: '123@g.us'
    }
});

// Ou sem tipagem explícita (usa any como padrão)
eventBus.emit({
    type: DomainEventType.MEMBER_MESSAGE_SENT,
    payload: {
        groupId: '123@g.us',
        memberId: '123@c.us',
        message: 'Olá!'
    }
});
```

### Escutar eventos (com tipagem forte)

```typescript
import { eventBus } from '../shared/containers';
import { DomainEventType, MemberMessageSentPayload } from '../shared/events';

// Escutar um tipo específico de evento com tipagem forte
eventBus.on<MemberMessageSentPayload>(DomainEventType.MEMBER_MESSAGE_SENT)
    .subscribe((event) => {
        // event.payload agora é tipado como MemberMessageSentPayload
        const { groupId, memberId, message } = event.payload;
        console.log('Mensagem enviada:', message);
        console.log('Grupo:', groupId);
        console.log('Membro:', memberId);
    });

// Escutar múltiplos tipos
eventBus.onMany(
    DomainEventType.TIMEOUT_CREATED,
    DomainEventType.TIMEOUT_EXPIRED
).subscribe((event) => {
    console.log('Evento de timeout:', event.type);
});

// Escutar todos os eventos
eventBus.onAll().subscribe((event) => {
    console.log('Evento:', event.type, event.payload);
});

// Escutar com filtro customizado
eventBus.onWhere((event) => {
    return event.metadata?.groupId === '123@g.us';
}).subscribe((event) => {
    console.log('Evento do grupo específico:', event);
});
```

## Tipos de Eventos Disponíveis

- `MEMBER_MESSAGE_SENT` - Quando um membro envia mensagem
- `TIMEOUT_CREATED` - Quando um timeout é criado
- `TIMEOUT_EXPIRED` - Quando um timeout expira
- `TIMEOUT_REMOVED` - Quando um timeout é removido
- `PUNISHMENT_CHECKED` - Quando uma punição é verificada
- `GROUP_REGISTERED` - Quando um grupo é registrado
- `GROUP_UPDATED` - Quando um grupo é atualizado
- `MEMBER_CREATED` - Quando um membro é criado
- `MEMBER_UPDATED` - Quando um membro é atualizado
- `COMMAND_EXECUTED` - Quando um comando é executado
- `COMMAND_FAILED` - Quando um comando falha

## Exemplo de Handler

```typescript
import { eventBus } from '../shared/containers';
import { DomainEventType } from '../shared/events';
import { dBRepository } from '../shared/containers';

export class MemberStatsHandler {
    constructor() {
        // Escutar eventos de mensagem
        eventBus.on(DomainEventType.MEMBER_MESSAGE_SENT)
            .subscribe(async (event) => {
                const { groupId, memberId } = event.payload;
                
                // Atualizar estatísticas
                const group = await dBRepository.getGroup(groupId);
                const member = group?.members[memberId];
                if (member) {
                    member.numberOfMessages++;
                    await dBRepository.updateMember(groupId, memberId, {
                        numberOfMessages: member.numberOfMessages
                    });
                }
            });
    }
}
```

