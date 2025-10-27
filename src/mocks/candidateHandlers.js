// src/mocks/candidateHandlers.js (CLEAN AND FINAL)

import * as mswModule from 'msw';
const { rest } = mswModule;
import { db } from '../db'; 

// Helper function for latency (200-1200ms delay)
const injectLatency = (ctx) => {
    return ctx.delay(Math.random() * 1000 + 200); 
};

// Helper function for write error rate (5-10%)
const shouldFail = () => Math.random() < 0.08;

// Helper to safely open DB (simplifies code in handlers)
const ensureDbOpen = async () => {
    try {
        await db.open(); 
    } catch (e) {
        // Continue if DB is already open or encounters transient error
    }
};

export const candidateHandlers = [
    // 1. GET /candidates (Fetch Candidates List with Client-Side Search and Server-like Stage Filter)
    rest.get('/candidates', async (req, res, ctx) => {
        await injectLatency(ctx); 
        await ensureDbOpen(); // Ensure Dexie is ready

        // URL Parameters 
        const search = req.url.searchParams.get('search')?.toLowerCase() || '';
        const stage = req.url.searchParams.get('stage'); 
        
        // 1. Apply Stage Filtering (Simulating a server-side filter)
        let candidatesCollection = db.candidates;
        if (stage) {
            candidatesCollection = candidatesCollection.where('stage').equals(stage);
        }

        // 2. Get all (stage-filtered) candidates
        let allCandidates = await candidatesCollection.toArray();

        // 3. Apply Client-Side Search 
        const searchedCandidates = allCandidates.filter(candidate => {
            const matchesSearch = 
                candidate.name.toLowerCase().includes(search) || 
                candidate.email.toLowerCase().includes(search);
            return matchesSearch;
        });
        
        // 4. Return Response
        return res(
            ctx.status(200),
            ctx.json({
                candidates: searchedCandidates,
                totalCount: searchedCandidates.length,
                stage: stage || 'all'
            })
        );
    }),

    // 2. PATCH /candidates/:id (Stage transitions)
    rest.patch('/candidates/:id', async (req, res, ctx) => {
        await injectLatency(ctx);
        if (shouldFail()) {
            return res(ctx.status(500), ctx.json({ error: 'Simulated server error during candidate update' }));
        }
        await ensureDbOpen(); // Ensure Dexie is ready

        const id = parseInt(req.params.id);
        const updates = await req.json();

        if (updates.stage) {
            // Update the stage and potentially record a timeline event (future task)
            const updated = await db.candidates.update(id, { stage: updates.stage }); 
            if (updated) {
                return res(ctx.status(200), ctx.json({ success: true, id, stage: updates.stage }));
            }
        }
        
        return res(ctx.status(404), ctx.json({ error: 'Candidate not found or invalid update' }));
    }),
    
    // 3. GET /candidates/:id/timeline (Candidate profile timeline)
    rest.get('/candidates/:id/timeline', async (req, res, ctx) => {
        await injectLatency(ctx);
        await ensureDbOpen(); // Ensure Dexie is ready
        
        const id = parseInt(req.params.id);
        
        // Using mock data as per assignment stub for the timeline
        const timeline = [
            { type: 'StageChange', date: Date.now() - 50000000, details: 'Applied to Job' },
            { type: 'StageChange', date: Date.now() - 30000000, details: 'Moved to Screen' },
            { type: 'Note', date: Date.now(), details: 'Recruiter added a note.' }
        ];

        return res(ctx.status(200), ctx.json({ timeline }));
    }),
];