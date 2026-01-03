import express, { Request, Response, Express } from 'express';
import path from 'path';
import open from 'open';
import { qrController } from './shared/containers';

// Type declaration for __dirname (available in CommonJS runtime)
declare const __dirname: string;

// Get the template path - works for both dev (tsx) and production (compiled)
const getTemplatePath = () => {
    // Try to use __dirname if available (CommonJS runtime)
    try {
        if (typeof __dirname !== 'undefined') {
            return path.join(__dirname, '../src/pages/qr-template.html');
        }
    } catch {
        // Ignore if __dirname is not available
    }
    // Fallback for tsx dev mode
    return path.join(process.cwd(), 'src/pages/qr-template.html');
};

// Get static files path
const getStaticPath = () => {
    return typeof __dirname !== 'undefined' 
        ? path.join(__dirname, '../src')
        : path.join(process.cwd(), 'src');
};

/**
 * Set up QR code routes on the Express app
 */
export function setupQRRoutes(app: Express): void {
    // Set up Express middleware
    app.use(express.json());

    // Serve static files
    app.use(express.static(getStaticPath()));

    // Route to serve HTML template
    app.get('/', (req: Request, res: Response) => {
        res.sendFile(getTemplatePath());
    });

    // API endpoint to get QR code
    app.get('/api/qrcode', (req: Request, res: Response) => qrController.getQRCode(req, res));

    // API endpoint to check status
    app.get('/api/status', (req: Request, res: Response) => qrController.getStatus(req, res));
}

/**
 * Start the Express server
 */
export function startServer(port: number = 3000): void {
    const app = express();
    
    // Set up routes
    setupQRRoutes(app);

    // Start server
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
        console.log('Opening browser...');
        // Open browser automatically
        open(`http://localhost:${port}`).catch((err: Error) => {
            console.error('Failed to open browser:', err);
        });
    });
}

/**
 * Update the current QR code
 */
export function updateQRCode(qr: string): void {
    qrController.updateQRCode(qr);
}

/**
 * Set the ready status
 */
export function setReadyStatus(ready: boolean): void {
    qrController.setReadyStatus(ready);
}

/**
 * Get the current QR code
 */
export function getCurrentQR(): string | null {
    return qrController.getCurrentQR();
}

/**
 * Get the ready status
 */
export function getReadyStatus(): boolean {
    return qrController.getReadyStatus();
}

