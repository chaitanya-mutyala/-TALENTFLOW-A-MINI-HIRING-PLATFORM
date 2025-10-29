// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { worker } from './mocks/browser';
import { seedDatabase } from './db'; // your Dexie setup file

async function enableMockingAndSeed() {
  // 1️⃣ Seed mock DB data first
  console.log('🌱 Seeding mock database...');
  await seedDatabase();

  // 2️⃣ Enable MSW (only in development)
  if (import.meta.env.MODE === 'development') {
    await worker.start({
      onUnhandledRequest: 'bypass', // prevent console noise
    });
    console.log('🧩 MSW Mocking enabled.');
  } else {
    console.log('🚀 Production mode — MSW disabled.');
  }
}

// 3️⃣ Wait for seeding + MSW before rendering
enableMockingAndSeed().then(() => {
  console.log('✅ App initialization complete.');
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}).catch((err) => {
  console.error('❌ Failed to initialize application:', err);
});
