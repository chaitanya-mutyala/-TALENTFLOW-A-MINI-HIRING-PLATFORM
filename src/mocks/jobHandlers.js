// src/mocks/jobHandlers.js (FINAL CORRECT VERSION)

import * as mswModule from 'msw';
const { rest } = mswModule;

import { db, slugify } from '../db'; 
import Dexie from 'dexie'; // Required for Dexie.DEXIE_ADD in reorder logic

// --- Utility Functions for Simulation (Unchanged) ---
const injectLatency = (ctx) => {
    return ctx.delay(Math.random() * 1000 + 200); // 200-1200ms delay
};
const shouldFail = () => Math.random() < 0.08;

// Helper to safely open DB (simplifies code in handlers)
const ensureDbOpen = async () => {
    try {
        await db.open(); 
    } catch (e) {
        // Ignore, database might already be open or opening
    }
};

// --- Job API Handlers ---

export const jobHandlers = [
    // 1. GET /jobs (Fetch Jobs List with Filters and Pagination)
    rest.get('/jobs', async (req, res, ctx) => {
        await injectLatency(ctx);
        await ensureDbOpen(); // 💡 FIX APPLIED

        const search = req.url.searchParams.get('search')?.toLowerCase() || '';
        const status = req.url.searchParams.get('status'); 
        const page = parseInt(req.url.searchParams.get('page')) || 1;
        const pageSize = parseInt(req.url.searchParams.get('pageSize')) || 10;
        const sort = req.url.searchParams.get('sort') || 'order'; // Default sort by order

        // 1. Get all jobs and sort them in memory
        const allJobs = await db.jobs.orderBy(sort).toArray(); 
        
        // 2. Apply Filtering
        const filteredJobs = allJobs.filter(job => {
            const matchesStatus = !status || job.status === status;
            const matchesSearch = 
                job.title.toLowerCase().includes(search) || 
                job.description.toLowerCase().includes(search);
            
            return matchesStatus && matchesSearch;
        });

        // 3. Apply Pagination
        const totalCount = filteredJobs.length;
        const start = (page - 1) * pageSize;
        const pagedJobs = filteredJobs.slice(start, start + pageSize);

        // 4. Return Response
        return res(
            ctx.status(200),
            ctx.json({
                jobs: pagedJobs,
                page,
                pageSize,
                totalCount,
                totalPages: Math.ceil(totalCount / pageSize)
            })
        );
    }),

    // 2. POST /jobs (Create New Job)
    rest.post('/jobs', async (req, res, ctx) => {
        await injectLatency(ctx);
        if (shouldFail()) {
            return res(ctx.status(500), ctx.json({ error: 'Simulated server error during creation' }));
        }
        await ensureDbOpen(); // 💡 FIX APPLIED

        const { title, tags, description } = await req.json();
        
        // Validation: Title required
        if (!title) {
            return res(ctx.status(400), ctx.json({ error: 'Title is required' }));
        }
        
        // Validation: Unique Slug
        const newSlug = slugify(title); 
        const existingJob = await db.jobs.where({ slug: newSlug }).first(); 
        if (existingJob) {
            return res(ctx.status(409), ctx.json({ error: 'Job title already exists (slug conflict)' }));
        }

        const maxOrder = (await db.jobs.orderBy('order').last())?.order || 0; 

        const newJob = {
            title,
            slug: newSlug,
            tags: tags || [],
            description: description || '',
            status: 'active', 
            order: maxOrder + 1,
        };

        const id = await db.jobs.add(newJob); 

        return res(
            ctx.status(201),
            ctx.json({ id, ...newJob })
        );
    }),

    // 3. PATCH /jobs/:id (Edit/Archive/Unarchive)
    rest.patch('/jobs/:id', async (req, res, ctx) => {
        await injectLatency(ctx);
        if (shouldFail()) {
            return res(ctx.status(500), ctx.json({ error: 'Simulated server error during update' }));
        }
        await ensureDbOpen(); // 💡 FIX APPLIED

        const id = parseInt(req.params.id);
        const updates = await req.json();

        const job = await db.jobs.get(id); 

        if (!job) {
            return res(ctx.status(404), ctx.json({ error: 'Job not found' }));
        }
        
        // Handle title change validation (requires new unique slug)
        if (updates.title && updates.title !== job.title) {
            const newSlug = slugify(updates.title); 
            const conflict = await db.jobs.where({ slug: newSlug }).and(j => j.id !== id).first(); 
            if (conflict) {
                return res(ctx.status(409), ctx.json({ error: 'New title conflicts with existing job slug.' }));
            }
            updates.slug = newSlug;
        }

        // Apply updates to IndexedDB (Update method in Dexie)
        await db.jobs.update(id, updates); 
        
        // Return the updated job (or just success confirmation)
        return res(ctx.status(200), ctx.json({ id, ...job, ...updates }));
    }),
    
    // 4. PATCH /jobs/:id/reorder (Drag-and-Drop Order Change)
    rest.patch('/jobs/:id/reorder', async (req, res, ctx) => {
        await injectLatency(ctx);
        
        // Inject Occasional 500 Error (15% rate for critical rollback test)
        if (Math.random() < 0.15) { 
            console.error('MSW: Simulated 500 failure for reorder request.');
            return res(ctx.status(500), ctx.json({ error: 'Simulated rollback test failure' }));
        }
        await ensureDbOpen(); // 💡 FIX APPLIED

        const jobId = parseInt(req.params.id);
        const { fromOrder, toOrder } = await req.json();

        // 1. Start a transaction for atomic update
        await db.transaction('rw', db.jobs, async () => { 
            // Reordering logic depends on direction
            if (fromOrder < toOrder) {
                // Moving down: Decrement order of jobs between fromOrder and toOrder
                await db.jobs.where('order').between(fromOrder + 1, toOrder, true, true)
                    .modify({ order: Dexie.DEXIE_ADD(-1) });
            } else if (fromOrder > toOrder) {
                // Moving up: Increment order of jobs between toOrder and fromOrder
                await db.jobs.where('order').between(toOrder, fromOrder - 1, true, true)
                    .modify({ order: Dexie.DEXIE_ADD(1) });
            }

            // 2. Set the target job to the new order
            await db.jobs.update(jobId, { order: toOrder });
        });
        
        // Return success
        return res(ctx.status(200), ctx.json({ success: true }));
    }),
];