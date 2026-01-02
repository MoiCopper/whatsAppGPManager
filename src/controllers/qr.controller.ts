import { Request, Response } from 'express';
import QRCode from 'qrcode';

export class QRController {
    private currentQR: string | null = null;
    private isReady: boolean = false;

    /**
     * Update the current QR code
     */
    updateQRCode(qr: string): void {
        this.currentQR = qr;
        this.isReady = false;
    }

    /**
     * Set the ready status
     */
    setReadyStatus(ready: boolean): void {
        this.isReady = ready;
        if (ready) {
            this.currentQR = null; // Clear QR code when ready
        }
    }

    /**
     * Get the current QR code
     */
    getCurrentQR(): string | null {
        return this.currentQR;
    }

    /**
     * Get the ready status
     */
    getReadyStatus(): boolean {
        return this.isReady;
    }

    /**
     * Handle GET /api/qrcode endpoint
     */
    async getQRCode(req: Request, res: Response): Promise<void> {
        if (this.currentQR) {
            try {
                const qrImageDataUrl = await QRCode.toDataURL(this.currentQR);
                res.json({ qr: qrImageDataUrl });
            } catch (error) {
                console.error('Error generating QR code image:', error);
                res.json({ qr: null });
            }
        } else {
            res.json({ qr: null });
        }
    }

    /**
     * Handle GET /api/status endpoint
     */
    getStatus(req: Request, res: Response): void {
        res.json({ ready: this.isReady, qr: this.currentQR !== null });
    }
}

