import { startServer } from './api';
import { ClientController } from './controllers/client.controller';
import { ErrorHandler } from './shared/ErrorHandler';

const PORT = 3000;

// Inicializar o cliente
const clientController = new ClientController();
clientController.registerEvents().then(() => {
    console.log('Client events registered');
}).catch((error) => {
    ErrorHandler.handle(error as Error, 'index.registerEvents');
    process.exit(1);
});
// Iniciar o servidor
startServer(PORT);