// loader.cjs
// This file is CommonJS to be compatible with cPanel/Passenger.

(async () => {
    try {
                await import('./server.js'); 
        
        console.log('Application started successfully via dynamic import.');

    } catch (e) {
        console.error('--- ERROR: Failed to start ES Module application via CJS wrapper ---');
        console.error(e);
        process.exit(1); 
    }
})();