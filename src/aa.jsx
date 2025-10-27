import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Dexie from 'dexie';

// --- Global Setup & Mocking ---

// Mocking dnd components since external imports are not allowed in single file
// This provides a visual list and a way to trigger the reorder logic (Mock Reorder button)
const DragDropContext = ({ children, onDragEnd }) => {
    const handleReorderClick = (e) => {
        if (e.target.dataset.reorderTest) {
            const jobs = Array.from(e.currentTarget.querySelectorAll('[data-drag-id]')).map(el => el.dataset.dragId);
            const sourceIndex = jobs.indexOf(e.target.dataset.reorderTest);
            
            // Mock destination: swap with the next item or the first item if last
            let destinationIndex = (sourceIndex + 1) % jobs.length; 
            if (jobs.length < 2 || sourceIndex === destinationIndex) return;

            const result = {
                source: { index: sourceIndex }, 
                destination: { index: destinationIndex }, 
                draggableId: e.target.dataset.reorderTest
            };
            onDragEnd(result);
        }
    };
    return <div onClick={handleReorderClick}>{children}</div>;
};

const Droppable = ({ droppableId, children }) => children({ provided: { innerRef: React.useRef() }, snapshot: {} });
const Draggable = ({ draggableId, index, children }) => children({ 
    provided: { innerRef: React.useRef(), draggableProps: { 'data-drag-id': draggableId }, dragHandleProps: {} }, 
    snapshot: {} 
});


// ----------------------------------------------------------------------
// 0. DATABASE & MSW SETUP (Integrated Logic from db.js & jobHandlers.js)
// ----------------------------------------------------------------------

// DEXIE SETUP (Must be initialized outside React component lifecycle)
const db = new Dexie('TalentFlowDB');
db.version(1).stores({ jobs: '++id, slug, status, order', candidates: '++id, email, stage', assessments: 'jobId' });

const slugify = (text) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

function generateSeedJobs(count) {
    const jobs = [];
    const titles = ["Front-End Developer", "Senior UX Designer", "DevOps Engineer", "HR Specialist", "Product Manager"];
    const tags = ["React", "Remote", "Full-Time", "Urgent", "New"];
    
    for (let i = 1; i <= count; i++) {
        const title = `${titles[i % titles.length]} Job #${i}`;
        jobs.push({ id: i, title, slug: slugify(title),
            status: i % 5 === 0 ? "archived" : "active", 
            tags: [tags[i % tags.length], tags[(i + 1) % tags.length]],
            order: i, description: `Job description for ${title}.`,
            createdAt: Date.now() - (count - i) * 86400000,
        });
    }
    return jobs;
}

async function seedDatabase() {
    try {
        if ((await db.jobs.count()) === 0) {
            const initialJobs = generateSeedJobs(25);
            await db.jobs.bulkAdd(initialJobs);
        }
    } catch (error) {
        console.error("Error seeding database:", error);
    }
}

// MSW Handlers (Defined as an async function to be callable later)
const getJobHandlers = async () => {
    // Dynamically import MSW libraries to avoid compilation errors
    const { rest } = await import('msw'); 

    const injectLatency = (ctx) => ctx.delay(Math.random() * 1000 + 200);
    const shouldFail = () => Math.random() < 0.08;

    return [
        // GET /jobs 
        rest.get('/jobs', async (req, res, ctx) => {
            await injectLatency(ctx); 
            const search = req.url.searchParams.get('search')?.toLowerCase() || '';
            const status = req.url.searchParams.get('status'); 
            const page = parseInt(req.url.searchParams.get('page')) || 1;
            const pageSize = parseInt(req.url.searchParams.get('pageSize')) || 10;
            const sort = req.url.searchParams.get('sort') || 'order';

            const allJobs = await db.jobs.orderBy(sort).toArray();
            
            const filteredJobs = allJobs.filter(job => {
                const matchesStatus = !status || job.status === status;
                const matchesSearch = job.title.toLowerCase().includes(search) || job.description.toLowerCase().includes(search);
                return matchesStatus && matchesSearch;
            });

            const totalCount = filteredJobs.length;
            const start = (page - 1) * pageSize;
            const pagedJobs = filteredJobs.slice(start, start + pageSize);

            return res(ctx.status(200), ctx.json({ jobs: pagedJobs, page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) }));
        }),
        
        // POST /jobs 
        rest.post('/jobs', async (req, res, ctx) => {
            await injectLatency(ctx);
            if (shouldFail()) return res(ctx.status(500), ctx.json({ error: 'Simulated server error during creation' }));

            const { title, tags, description } = await req.json();
            if (!title) return res(ctx.status(400), ctx.json({ error: 'Title is required' }));
            
            const newSlug = slugify(title);
            const existingJob = await db.jobs.where({ slug: newSlug }).first();
            if (existingJob) return res(ctx.status(409), ctx.json({ error: 'Job title already exists (slug conflict)' }));

            const maxOrder = (await db.jobs.orderBy('order').last())?.order || 0;

            const newJob = { title, slug: newSlug, tags: tags || [], description: description || '',
                status: 'active', order: maxOrder + 1, createdAt: Date.now(),
            };

            const id = await db.jobs.add(newJob);
            return res(ctx.status(201), ctx.json({ id, ...newJob }));
        }),
        
        // PATCH /jobs/:id 
        rest.patch('/jobs/:id', async (req, res, ctx) => {
            await injectLatency(ctx);
            if (shouldFail()) return res(ctx.status(500), ctx.json({ error: 'Simulated server error during update' }));

            const id = parseInt(req.params.id);
            const updates = await req.json();
            await db.jobs.update(id, updates);
            return res(ctx.status(200), ctx.json({ success: true }));
        }),
        
        // PATCH /jobs/:id/reorder 
        rest.patch('/jobs/:id/reorder', async (req, res, ctx) => {
            await injectLatency(ctx);
            if (Math.random() < 0.15) { 
                return res(ctx.status(500), ctx.json({ error: 'Simulated rollback test failure' }));
            }

            const jobId = parseInt(req.params.id);
            const { fromOrder, toOrder } = await req.json();

            await db.transaction('rw', db.jobs, async () => { 
                if (fromOrder < toOrder) {
                    await db.jobs.where('order').between(fromOrder + 1, toOrder, true, true)
                        .modify({ order: Dexie.DEXIE_ADD(-1) });
                } else if (fromOrder > toOrder) {
                    await db.jobs.where('order').between(toOrder, fromOrder - 1, true, true)
                        .modify({ order: Dexie.DEXIE_ADD(1) });
                }
                await db.jobs.update(jobId, { order: toOrder });
            });
            
            return res(ctx.status(200), ctx.json({ success: true }));
        }),
    ];
};

// MSW Setup (Called within useEffect later)
const startWorker = async () => {
    if (typeof window === 'undefined' || window.mswWorkerStarted) return;
    try {
        const { setupWorker } = await import('msw');
        const handlers = await getJobHandlers();
        const worker = setupWorker(...handlers);
        worker.start({ onUnhandledRequest: 'bypass' });
        window.mswWorkerStarted = true;
    } catch (error) {
        console.error("Failed to start MSW worker:", error);
    }
};


// ----------------------------------------------------------------------
// 1. REACT HOOKS & COMPONENTS (The Visualization)
// ----------------------------------------------------------------------

const useJobs = (filter) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, totalCount: 0, totalPages: 1 });
    const pageSize = 10;
    
    const [jobsBeforeUpdate, setJobsBeforeUpdate] = useState(null);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ search: filter.search, status: filter.status, page: filter.page, pageSize: pageSize, sort: 'order' });
            
            const response = await fetch(`/jobs?${params.toString()}`);
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error || 'Failed to fetch jobs.');
            setJobs(data.jobs);
            setPagination({ page: data.page, totalCount: data.totalCount, totalPages: data.totalPages });
        } catch (err) {
            setError(err.message);
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [filter.search, filter.status, filter.page]);

    const reorderJob = useCallback(async (jobId, fromIndex, toIndex) => {
        if (fromIndex === toIndex) return;

        const currentJob = jobs.find(j => j.id === jobId);
        if (!currentJob) return;

        const fromOrder = currentJob.order; 
        let targetOrder = jobs[toIndex] ? jobs[toIndex].order : fromOrder;
        
        if (toIndex >= jobs.length - 1 && toIndex > fromIndex) {
            const maxOrder = jobs.reduce((max, job) => Math.max(max, job.order), 0);
            targetOrder = maxOrder + 1;
        }

        setJobsBeforeUpdate([...jobs]); 
        const updatedJobs = Array.from(jobs);
        const [movedJob] = updatedJobs.splice(fromIndex, 1);
        updatedJobs.splice(toIndex, 0, movedJob);
        setJobs(updatedJobs);

        try {
            const response = await fetch(`/jobs/${jobId}/reorder`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, fromOrder, toOrder: targetOrder })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Reorder failed.');
            }
            
            setJobsBeforeUpdate(null); 
            await fetchJobs();

        } catch (err) {
            setError(`Reorder failed: ${err.message}. Rolling back.`);
            setJobs(jobsBeforeUpdate);
            setJobsBeforeUpdate(null);
        }
    }, [jobs, fetchJobs, jobsBeforeUpdate]);

    const saveJob = useCallback(async (jobData) => {
        setError(null);
        setLoading(true);
        try {
            const response = await fetch('/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(jobData) });
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error || 'Failed to create job.');
            
            await fetchJobs();
            return { success: true };

        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [fetchJobs]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    return { jobs, loading, error, pagination, fetchJobs, reorderJob, saveJob, pageSize };
};

// --- Job Modal Component for Create/Edit ---

const JobModal = ({ isOpen, onClose, onSave, isLoading, error }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setTitle(''); setDescription(''); setTagsInput(''); setFormError('');
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!title.trim()) { setFormError('Job Title is required.'); return; }

        const jobData = {
            title: title.trim(),
            description: description.trim(),
            tags: tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        };

        const result = await onSave(jobData);
        
        if (result.success) { onClose(); } 
        else { setFormError(result.error || 'A network error occurred. Please try again.'); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Create New Job</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    
                    {(formError || error) && (<div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm font-medium">{formError || error}</div>)}

                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Job Title (Required)</label>
                        <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Senior React Developer" required />
                    </div>
                    
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="4"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Describe the role, responsibilities, and requirements..." />
                    </div>
                    
                    <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags (Comma separated)</label>
                        <input id="tags" type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., React, Remote, Full-Time" />
                    </div>

                    <div className="pt-2 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} 
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition shadow-md" disabled={isLoading}>Cancel</button>
                        <button type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-lg disabled:opacity-50 flex items-center"
                            disabled={isLoading}
                        >
                            {isLoading ? (<><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Creating...</>) : 'Create Job'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const JobItem = ({ job, handleArchive }) => (
    <Draggable draggableId={String(job.id)} index={job.order} >
        {({ provided, dragHandleProps, draggableProps }) => (
            <div
                ref={provided.innerRef}
                {...draggableProps}
                {...dragHandleProps}
                className="bg-white shadow-lg p-4 mb-3 rounded-xl flex justify-between items-center transition-all hover:ring-2 ring-indigo-500 cursor-grab"
            >
                <div className="flex-grow">
                    <div className="text-xl font-semibold text-gray-800 flex items-center">
                        {job.title} 
                        <span className={`ml-3 px-3 py-1 text-xs font-medium rounded-full ${
                            job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>{job.status.toUpperCase()}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Order: {job.order} | Slug: {job.slug}</div>
                    <div className="mt-2 space-x-2">
                        {job.tags.map((tag, i) => (<span key={i} className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-600">{tag}</span>))}
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button 
                        className="px-3 py-1.5 text-sm font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition shadow-md"
                        onClick={() => handleArchive(job.id, job.status)}
                    >
                        {job.status === 'active' ? 'Archive' : 'Activate'}
                    </button>
                    <button 
                        className="px-3 py-1.5 text-sm font-medium rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition shadow-md"
                        data-reorder-test={String(job.id)} 
                        onClick={(e) => e.stopPropagation()}
                    >
                        Mock Reorder
                    </button>
                </div>
            </div>
        )}
    </Draggable>
);


// Main Jobs Board Component
const JobsBoard = ({ fetchJobs, reorderJob, jobs, loading, apiError, pagination, pageSize, filter, setFilter, saveJob }) => {
    const totalPages = pagination.totalPages;
    const [showModal, setShowModal] = useState(false);

    const handleArchive = async (jobId, status) => {
        const newStatus = status === 'active' ? 'archived' : 'active';
        try {
            await fetch(`/jobs/${jobId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
            fetchJobs();
        } catch (err) {
            console.error(`Failed to change status: ${err.message}`);
        }
    };
    
    const onDragEndMock = (result) => {
        if (!result.destination) return;
        if (result.source.index === result.destination.index) return;
        
        const jobId = parseInt(result.draggableId);
        reorderJob(jobId, result.source.index, result.destination.index);
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-2">Talent Flow Job Board</h1>
            
            {/* Controls */}
            <div className="bg-white p-4 rounded-xl shadow-md mb-6 flex flex-col md:flex-row gap-4 items-center">
                <input
                    type="text"
                    placeholder="Search by Title/Description"
                    value={filter.search}
                    onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                    className="w-full md:w-1/3 p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
                <select
                    value={filter.status}
                    onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                    className="w-full md:w-1/4 p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                </select>
                <button
                    className="w-full md:w-1/4 p-2.5 text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition font-medium disabled:opacity-50"
                    onClick={() => setShowModal(true)}
                    disabled={loading}
                >
                    + Create New Job
                </button>
            </div>

            {/* Status and Error */}
            {loading && (
                <div className="p-4 bg-indigo-100 text-indigo-700 rounded-xl mb-4 flex items-center justify-center font-medium">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Loading Jobs... (Simulated Latency)
                </div>
            )}
            {apiError && (
                <div className="p-4 bg-red-100 text-red-700 rounded-xl mb-4 font-medium shadow-md">
                    API Error: {apiError}
                </div>
            )}

            {/* Jobs List (Droppable area for drag-and-drop) */}
            <DragDropContext onDragEnd={onDragEndMock}>
                <Droppable droppableId="jobs-list">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-3"
                        >
                            {!loading && jobs.length === 0 && <p className="text-center text-gray-500 mt-10">No jobs found matching your criteria.</p>}
                            
                            {jobs.map((job) => (
                                <JobItem key={job.id} job={job} handleArchive={handleArchive} />
                            ))}
                            
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {/* Pagination */}
            <div className="mt-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-md">
                <span className="text-sm text-gray-700">
                    Showing {(pagination.page - 1) * pageSize + 1} to {Math.min(pagination.page * pageSize, pagination.totalCount)} of {pagination.totalCount} jobs.
                </span>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setFilter(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        disabled={pagination.page === 1 || loading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setFilter(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                        disabled={pagination.page >= totalPages || loading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition"
                    >
                        Next
                    </button>
                </div>
            </div>
            
            {/* Create Job Modal */}
            <JobModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={saveJob}
                isLoading={loading}
                error={apiError}
            />
        </div>
    );
}

// Main App Component (The entry point)
export default function App() {
    // 1. Database and MSW Initialization
    useEffect(() => {
        // Initialize Dexie and seed the database
        seedDatabase();
        // Start the MSW worker (API simulation)
        startWorker();
    }, []);

    const [filter, setFilter] = useState({
        search: '',
        status: 'active', 
        page: 1,
    });
    
    // 2. Integration: The JobsBoard logic is driven by the useJobs hook
    const { jobs, loading, error, pagination, fetchJobs, reorderJob, saveJob, pageSize } = useJobs(filter);

    return (
        <JobsBoard 
            fetchJobs={fetchJobs}
            reorderJob={reorderJob}
            saveJob={saveJob}
            jobs={jobs}
            loading={loading}
            apiError={error}
            pagination={pagination}
            pageSize={pageSize}
            filter={filter}
            setFilter={setFilter}
        />
    );
}
