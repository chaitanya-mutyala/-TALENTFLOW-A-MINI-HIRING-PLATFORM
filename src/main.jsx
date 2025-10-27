// src/main.jsx (FIXED for Demo Deployment)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { seedDatabase } from './db'; 
// NOTE: You must also ensure that the mockServiceWorker.js file is accessible 
// in the root of your Vercel deployment's output.

// --- Application Preparation Function ---
async function prepareApp() {
    // 1. CRITICAL: Await database setup (opening and seeding) first.
    console.log("Preparing database and seeding data...");
    await seedDatabase(); 

    // 2. Enable Mocking (MSW)
    // 💡 FIX: Start MSW if we are NOT in a production build, OR if we are running 
    // in the browser (client-side), which implies we need the mocks for the demo.
    
    // Check if the code is running in the browser (window is defined)
    if (typeof window !== 'undefined') {
        const mswModule = await import('./mocks/browser');
        const { worker } = mswModule; 
        
        // Start the worker. Use the URL property to define the path to the service worker.
        await worker.start({ 
            serviceWorker: { url: '/mockServiceWorker.js' },
            onUnhandledRequest: 'bypass' 
        }); 
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
    // The startup error (like the Dexie TypeError) is often caught here.
    console.error("Failed to initialize application:", err);
});