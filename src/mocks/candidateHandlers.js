import { http, HttpResponse } from 'msw';
import { db } from '../db';

// --- Utility Functions ---
const injectLatency = async () => {
  await new Promise(r => setTimeout(r, Math.random() * 1000 + 200));
};
const shouldFail = () => Math.random() < 0.08;
const ensureDbOpen = async () => { try { await db.open(); } catch {} };

// --- Handlers ---
export const candidateHandlers = [
  // ✅ 1. GET /candidates — Fetch list with search & stage filter
  http.get('/candidates', async ({ request }) => {
    await injectLatency();
    await ensureDbOpen();

    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const stage = url.searchParams.get('stage');

    let candidatesCollection = db.candidates;
    if (stage) candidatesCollection = candidatesCollection.where('stage').equals(stage);

    const allCandidates = await candidatesCollection.toArray();
    const searchedCandidates = allCandidates.filter(c =>
      c.name.toLowerCase().includes(search) || c.email.toLowerCase().includes(search)
    );

    return HttpResponse.json({
      candidates: searchedCandidates,
      totalCount: searchedCandidates.length,
      stage: stage || 'all',
    });
  }),

  // ✅ 2. GET /candidates/:id — Fetch candidate profile
  http.get('/candidates/:id', async ({ params }) => {
    await injectLatency();
    await ensureDbOpen();

    const id = parseInt(params.id);
    const candidate = await db.candidates.get(id);

    if (!candidate) {
      return HttpResponse.json(
        { error: `Candidate with ID ${id} not found.` },
        { status: 404 }
      );
    }

    // Optionally enrich with job info
    const job = await db.jobs.get(candidate.jobId);
    return HttpResponse.json({
      ...candidate,
      jobTitle: job?.title || 'Unknown Position',
      summary: `Candidate ${candidate.name} applied for ${job?.title || 'a position'}.`,
    });
  }),

  // ✅ 3. PATCH /candidates/:id — Update candidate stage
  http.patch('/candidates/:id', async ({ params, request }) => {
    await injectLatency();
    if (shouldFail()) {
      return HttpResponse.json({ error: 'Simulated server error' }, { status: 500 });
    }

    await ensureDbOpen();
    const id = parseInt(params.id);
    const updates = await request.json();

    if (updates.stage) {
      const updated = await db.candidates.update(id, { stage: updates.stage });
      if (updated) {
        return HttpResponse.json({ success: true, id, stage: updates.stage }, { status: 200 });
      }
    }

    return HttpResponse.json({ error: 'Candidate not found or invalid update' }, { status: 404 });
  }),

  // ✅ 4. GET /candidates/:id/timeline — Candidate profile timeline
  http.get('/candidates/:id/timeline', async ({ params }) => {
    await injectLatency();
    await ensureDbOpen();

    const id = parseInt(params.id);

    const timeline = [
      { type: 'StageChange', date: Date.now() - 50000000, details: 'Applied to Job' },
      { type: 'StageChange', date: Date.now() - 30000000, details: 'Moved to Screen' },
      { type: 'Note', date: Date.now(), details: 'Recruiter added a note.' },
    ];

    return HttpResponse.json({ candidateId: id, timeline }, { status: 200 });
  }),
];
