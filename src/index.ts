import { startServer } from './api';
import { ClientController } from './controllers/client.controller';

const PORT = 3000;

// Inicializar o cliente
const clientController = new ClientController();
clientController.initialize();

// Iniciar o servidor
startServer(PORT);