export const clientConfig = {
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // This can help with connection issues
            '--disable-gpu'
        ],
        timeout: 60000, // Increase timeout to 60 seconds
    }
}