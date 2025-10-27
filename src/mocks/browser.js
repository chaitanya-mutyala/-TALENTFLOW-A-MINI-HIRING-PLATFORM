// src/mocks/browser.js (FIXED)

// 1. Import the entire MSW module object using the '*' wildcard
import * as mswModule from 'msw';
// 2. Destructure setupWorker from the imported object
const { setupWorker } = mswModule; 

import { handlers } from './handler'; 

// Export the worker setup function
export const worker = setupWorker(...handlers);