// src/main.jsx (FINAL FIX for Initialization Order)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Import the seed function which now includes db.open()
import { seedDatabase } from './db'; 

// Initialize the Query Client (assuming this is done globally elsewhere, 
// or define it here if not)
// const queryClient = new QueryClient(); 

// --- Application Preparation Function ---
async function prepareApp() {
    // 1. CRITICAL: Await database setup (opening and seeding) first.
    // This guarantees db.jobs is defined when the first API handler runs.
    console.log("Preparing database and seeding data...");
    await seedDatabase(); 

    // 2. Enable Mocking (MSW)
    if (process.env.NODE_ENV === 'development') {
        // Ensure MSW imports use the robust syntax (import * as module)
        const mswModule = await import('./mocks/browser');
        const { worker } = mswModule; 
        
        await worker.start({ onUnhandledRequest: 'bypass' }); 
        console.log("MSW worker started and ready to intercept requests.");
    }
}

prepareApp().then(() => {
  console.log("Database and MSW ready. Rendering application...");
  
  // 3. Render the app only after DB and MSW are ready
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}).catch(err => {
    console.error("Failed to initialize application:", err);
});