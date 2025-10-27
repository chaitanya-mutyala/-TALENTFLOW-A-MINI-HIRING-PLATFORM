// src/mocks/handlers.js (FINALIZED)

import { jobHandlers } from './jobHandlers'; 
import { candidateHandlers } from './candidateHandlers'; 
import { assessmentHandlers } from './assessmentHandlers'; // NEW

export const handlers = [
    ...jobHandlers,
    ...candidateHandlers,
    ...assessmentHandlers, // NEW
];