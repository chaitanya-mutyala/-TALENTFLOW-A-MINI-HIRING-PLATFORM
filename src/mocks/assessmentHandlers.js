// src/mocks/assessmentHandlers.js (FINAL FIX)

import * as mswModule from 'msw';
const { rest } = mswModule;
import { db } from '../db'; 

// Helper functions (re-use ensureDbOpen from jobHandlers or define globally)
const injectLatency = (ctx) => { return ctx.delay(Math.random() * 1000 + 200); };
const shouldFail = () => Math.random() < 0.08;
const ensureDbOpen = async () => { try { await db.open(); } catch (e) {} };


export const assessmentHandlers = [
    // 1. GET /assessments/:jobId (Get Assessment Builder Structure)
    rest.get('/assessments/:jobId', async (req, res, ctx) => {
        await injectLatency(ctx); 
        await ensureDbOpen(); // 💡 FIX APPLIED

        const jobId = parseInt(req.params.jobId);

        const assessment = await db.assessments.get(jobId);
        
        if (!assessment) {
            return res(ctx.status(404), ctx.json({ error: 'Assessment not found for this job.' }));
        }

        return res(ctx.status(200), ctx.json(assessment));
    }),
    
    // 2. PUT /assessments/:jobId (Update/Save Assessment Builder Structure)
    rest.put('/assessments/:jobId', async (req, res, ctx) => {
        await injectLatency(ctx);
        if (shouldFail()) {
            return res(ctx.status(500), ctx.json({ error: 'Simulated server error saving assessment.' }));
        }
        await ensureDbOpen(); // 💡 FIX APPLIED
        
        const jobId = parseInt(req.params.jobId);
        const assessmentStructure = await req.json();

        await db.assessments.put({ jobId, ...assessmentStructure });

        return res(ctx.status(200), ctx.json({ success: true, jobId }));
    }),
    
    // 3. POST /assessments/:jobId/submit (Candidate Submits Assessment Response)
    rest.post('/assessments/:jobId/submit', async (req, res, ctx) => {
        await injectLatency(ctx);
        await ensureDbOpen(); // 💡 FIX APPLIED
        
        const jobId = parseInt(req.params.jobId);
        const { candidateId, responses } = await req.json();

        if (!candidateId || !responses) {
             return res(ctx.status(400), ctx.json({ error: 'Missing candidateId or responses.' }));
        }

        const responseData = {
            jobId,
            candidateId,
            responses,
            submittedAt: Date.now(),
        };

        const id = await db.responses.add(responseData);

        return res(ctx.status(201), ctx.json({ success: true, responseId: id }));
    }),
];