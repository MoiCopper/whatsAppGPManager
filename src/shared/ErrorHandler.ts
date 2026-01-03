/**
 * Centralized error handler with structured logging
 */
class ErrorHandler {
    static handle(error: Error, context: string): void {
        // Log estruturado
        console.error({
            context,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Handle error and return a user-friendly message
     */
    static handleWithMessage(error: Error, context: string, userMessage?: string): string {
        this.handle(error, context);
        return userMessage || 'Ocorreu um erro inesperado. Por favor, tente novamente.';
    }
}

export { ErrorHandler };

