import { startServer } from './api';
import { EventHandlersInitializer } from './bot/handlers/EventHandlersInitializer';

const PORT = 3000;

// Inicializar handlers de eventos
EventHandlersInitializer.initialize();

// WhatsAppRepository já inicializa e registra eventos automaticamente no construtor
// Iniciar o servidor
startServer(PORT);