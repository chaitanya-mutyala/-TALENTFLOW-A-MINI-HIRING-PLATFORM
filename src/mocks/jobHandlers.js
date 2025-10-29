// src/mocks/jobHandlers.js
import { http, HttpResponse } from 'msw'
import { db, slugify } from '../db'
import Dexie from 'dexie'

// --- Utility Functions ---
const injectLatency = async () => {
  await new Promise(r => setTimeout(r, Math.random() * 1000 + 200)) // 200–1200ms
}
const shouldFail = () => Math.random() < 0.08

const ensureDbOpen = async () => {
  try {
    await db.open()
  } catch {
    // ignore if already open
  }
}

// --- Handlers ---
export const jobHandlers = [
  // ✅ 1. GET /jobs - Fetch paginated & filtered jobs
  http.get('/jobs', async ({ request }) => {
    await injectLatency()
    await ensureDbOpen()

    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase() || ''
    const status = url.searchParams.get('status')
    const page = parseInt(url.searchParams.get('page')) || 1
    const pageSize = parseInt(url.searchParams.get('pageSize')) || 10
    const sort = url.searchParams.get('sort') || 'order'

    const allJobs = await db.jobs.orderBy(sort).toArray()

    const filtered = allJobs.filter(job => {
      const matchesStatus = !status || job.status === status
      const matchesSearch =
        job.title.toLowerCase().includes(search) ||
        job.description.toLowerCase().includes(search)
      return matchesStatus && matchesSearch
    })

    const totalCount = filtered.length
    const start = (page - 1) * pageSize
    const paged = filtered.slice(start, start + pageSize)

    return HttpResponse.json({
      jobs: paged,
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    })
  }),

  // ✅ 2. POST /jobs - Create a new job
  http.post('/jobs', async ({ request }) => {
    await injectLatency()
    if (shouldFail()) {
      return HttpResponse.json(
        { error: 'Simulated server error during creation' },
        { status: 500 }
      )
    }

    await ensureDbOpen()
    const { title, tags, description } = await request.json()

    if (!title) {
      return HttpResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const newSlug = slugify(title)
    const existing = await db.jobs.where({ slug: newSlug }).first()
    if (existing) {
      return HttpResponse.json(
        { error: 'Job title already exists (slug conflict)' },
        { status: 409 }
      )
    }

    const maxOrder = (await db.jobs.orderBy('order').last())?.order || 0
    const newJob = {
      title,
      slug: newSlug,
      tags: tags || [],
      description: description || '',
      status: 'active',
      order: maxOrder + 1,
      createdAt: Date.now(),
    }

    const id = await db.jobs.add(newJob)
    return HttpResponse.json({ id, ...newJob }, { status: 201 })
  }),

  // ✅ 3. PATCH /jobs/:id - Update job
  http.patch('/jobs/:id', async ({ params, request }) => {
    await injectLatency()
    if (shouldFail()) {
      return HttpResponse.json(
        { error: 'Simulated server error during update' },
        { status: 500 }
      )
    }

    await ensureDbOpen()
    const id = parseInt(params.id)
    const updates = await request.json()

    const job = await db.jobs.get(id)
    if (!job) {
      return HttpResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Handle title change (unique slug)
    if (updates.title && updates.title !== job.title) {
      const newSlug = slugify(updates.title)
      const conflict = await db.jobs
        .where({ slug: newSlug })
        .and(j => j.id !== id)
        .first()
      if (conflict) {
        return HttpResponse.json(
          { error: 'New title conflicts with existing job slug' },
          { status: 409 }
        )
      }
      updates.slug = newSlug
    }

    await db.jobs.update(id, updates)
    return HttpResponse.json({ id, ...job, ...updates }, { status: 200 })
  }),

  // ✅ 4. PATCH /jobs/:id/reorder - Simulate drag-drop reordering
  http.patch('/jobs/:id/reorder', async ({ params, request }) => {
    await injectLatency()
    if (Math.random() < 0.15) {
      console.error('MSW: Simulated 500 failure for reorder request.')
      return HttpResponse.json(
        { error: 'Simulated rollback test failure' },
        { status: 500 }
      )
    }

    await ensureDbOpen()
    const jobId = parseInt(params.id)
    const { fromOrder, toOrder } = await request.json()

    await db.transaction('rw', db.jobs, async () => {
      if (fromOrder < toOrder) {
        await db.jobs
          .where('order')
          .between(fromOrder + 1, toOrder, true, true)
          .modify({ order: Dexie.DEXIE_ADD(-1) })
      } else if (fromOrder > toOrder) {
        await db.jobs
          .where('order')
          .between(toOrder, fromOrder - 1, true, true)
          .modify({ order: Dexie.DEXIE_ADD(1) })
      }
      await db.jobs.update(jobId, { order: toOrder })
    })

    return HttpResponse.json({ success: true }, { status: 200 })
  }),
]
