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

  // 2️⃣ Enable MSW in ALL environments (for demo)
  await worker.start({
    onUnhandledRequest: 'bypass', // avoid noisy warnings
  });
  console.log('🧩 MSW Mocking enabled (Demo Mode).');
}

// 3️⃣ Wait for seeding + MSW before rendering
enableMockingAndSeed()
  .then(() => {
    console.log('✅ App initialization complete.');
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  })
  .catch((err) => {
    console.error('❌ Failed to initialize application:', err);
  });
