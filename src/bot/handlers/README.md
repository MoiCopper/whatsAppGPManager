# Event Handlers

Handlers de eventos processam eventos de domínio emitidos pelo EventBus.

## Como criar um novo Handler

### 1. Criar a classe do Handler

```typescript
import { BaseEventHandler } from '../../shared/events/BaseEventHandler';
import { DomainEvent, DomainEventType } from '../../shared/events';
import { ErrorHandler } from '../../shared/ErrorHandler';

export class MeuNovoHandler extends BaseEventHandler {
    /**
     * Define os tipos de eventos que este handler processa
     */
    protected getEventTypes(): DomainEventType[] {
        return [
            DomainEventType.COMMAND_EXECUTED,
            DomainEventType.COMMAND_FAILED
        ];
    }

    /**
     * Processa os eventos
     */
    async handle(event: DomainEvent): Promise<void> {
        try {
            switch (event.type) {
                case DomainEventType.COMMAND_EXECUTED:
                    await this.handleCommandExecuted(event);
                    break;
                case DomainEventType.COMMAND_FAILED:
                    await this.handleCommandFailed(event);
                    break;
            }
        } catch (error) {
            ErrorHandler.handle(error as Error, `MeuNovoHandler.handle.${event.type}`);
        }
    }

    private async handleCommandExecuted(event: DomainEvent): Promise<void> {
        // Sua lógica aqui
        console.log('Comando executado:', event.payload);
    }

    private async handleCommandFailed(event: DomainEvent): Promise<void> {
        // Sua lógica aqui
        console.log('Comando falhou:', event.payload);
    }
}
```

### 2. Registrar no EventHandlersInitializer

```typescript
// src/bot/handlers/EventHandlersInitializer.ts
import { MeuNovoHandler } from './MeuNovoHandler';

export class EventHandlersInitializer {
    static initialize(): void {
        try {
            // ... outros handlers ...
            
            // Criar instância do novo handler
            const meuNovoHandler = new MeuNovoHandler();
            this.handlers.push(meuNovoHandler);

            console.log('Event handlers initialized successfully');
        } catch (error) {
            ErrorHandler.handle(error as Error, 'EventHandlersInitializer.initialize');
            throw error;
        }
    }
}
```

## Vantagens desta Arquitetura

1. **Desacoplamento**: Handlers não precisam ser dependências de outros componentes
2. **Auto-registro**: Handlers se registram automaticamente nos eventos quando são criados
3. **Fácil adicionar**: Basta criar a classe e registrar no inicializador
4. **Sem container**: Handlers não precisam estar no container de dependências
5. **Testabilidade**: Fácil testar handlers isoladamente

## Como funciona

1. `BaseEventHandler` é uma classe abstrata que facilita o auto-registro
2. Quando um handler é instanciado, o construtor de `BaseEventHandler` automaticamente:
   - Chama `getEventTypes()` para saber quais eventos escutar
   - Registra o handler no EventBus para esses eventos
3. `EventHandlersInitializer.initialize()` cria todas as instâncias dos handlers
4. Os handlers ficam ativos e processam eventos automaticamente

## Exemplo completo

```typescript
// AnalyticsHandler.ts - Exemplo de handler que não é dependência de ninguém
import { BaseEventHandler } from '../../shared/events/BaseEventHandler';
import { DomainEvent, DomainEventType } from '../../shared/events';

export class AnalyticsHandler extends BaseEventHandler {
    protected getEventTypes(): DomainEventType[] {
        return [
            DomainEventType.COMMAND_EXECUTED,
            DomainEventType.MEMBER_MESSAGE_SENT
        ];
    }

    async handle(event: DomainEvent): Promise<void> {
        // Enviar para serviço de analytics externo
        // Salvar em banco de dados
        // Gerar métricas
        console.log('Analytics:', event.type, event.payload);
    }
}
```

