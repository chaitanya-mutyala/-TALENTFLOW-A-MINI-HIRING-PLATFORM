import { http, HttpResponse, delay } from 'msw';
import { db } from '../db';

// --- Helper utilities ---
const randomLatency = async () => {
  await delay(Math.random() * 1000 + 200);
};
const shouldFail = () => Math.random() < 0.08;
const ensureDbOpen = async () => {
  try {
    await db.open();
  } catch {
    // ignore if already open
  }
};

// --- MSW Handlers ---
export const assessmentHandlers = [
  // 1️⃣ GET /assessments/:jobId → Fetch assessment for a job
  http.get('/assessments/:jobId', async ({ params }) => {
    await randomLatency();
    await ensureDbOpen();

    const jobId = parseInt(params.jobId);
    const assessment = await db.assessments.get(jobId);

    if (!assessment) {
      return HttpResponse.json(
        { error: 'Assessment not found for this job.' },
        { status: 404 }
      );
    }

    return HttpResponse.json(assessment, { status: 200 });
  }),

  // 2️⃣ PUT /assessments/:jobId → Save or update assessment
  http.put('/assessments/:jobId', async ({ params, request }) => {
    await randomLatency();
    await ensureDbOpen();

    if (shouldFail()) {
      return HttpResponse.json(
        { error: 'Simulated server error saving assessment.' },
        { status: 500 }
      );
    }

    const jobId = parseInt(params.jobId);
    const data = await request.json();

    // ✅ Save without any conditional logic fields
    const cleanedSections = data.sections.map(section => ({
      ...section,
      questions: section.questions.map(q => {
        const { conditional, ...rest } = q;
        return rest; // remove any leftover conditional data
      }),
    }));

    await db.assessments.put({ jobId, ...data, sections: cleanedSections });

    return HttpResponse.json({ success: true, jobId }, { status: 200 });
  }),

  // 3️⃣ POST /assessments/:jobId/submit → Candidate submits responses
  http.post('/assessments/:jobId/submit', async ({ params, request }) => {
    await randomLatency();
    await ensureDbOpen();

    const jobId = parseInt(params.jobId);
    const { candidateId, responses } = await request.json();

    if (!candidateId || !responses) {
      return HttpResponse.json(
        { error: 'Missing candidateId or responses.' },
        { status: 400 }
      );
    }

    const responseData = {
      jobId,
      candidateId,
      responses,
      submittedAt: Date.now(),
    };

    const responseId = await db.responses.add(responseData);

    return HttpResponse.json({ success: true, responseId }, { status: 201 });
  }),
];
