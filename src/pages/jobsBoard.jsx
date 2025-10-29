// src/pages/JobsBoard.jsx (COMPLETE DND + EDIT)

import React, { useState } from 'react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'; // 💡 Import DND components
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useJobs } from '../hooks/useJobs';
import { useJobMutations } from '../hooks/useJobMutations';
import JobFormModal from '../components/JobFormModal';

// --- DND Helper Item (SortableJobListItem) ---
const SortableJobListItem = ({ job, onArchiveToggle, onEdit, isUpdating, queryKey }) => {
    // The queryKey is not directly used here but is necessary for the mutation payload in handleDragEnd

    // useSortable makes the item draggable. We use the job ID as the DND item's ID.
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(job.id) });
    
    // Custom style to apply transform, opacity, and transition for smooth dragging
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
        // Base item styling
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '10px', 
        borderBottom: '1px solid #eee',
        backgroundColor: isDragging ? '#f0f8ff' : (job.status === 'archived' ? '#f5f5f5' : 'white'),
        cursor: 'grab',
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} // Required for dnd-kit accessibility/setup
        >
            <div {...listeners}> {/* listeners attach drag controls to this area */}
                <strong>{job.title}</strong> ({job.status}) - Order: {job.order}
                <div style={{ fontSize: '12px', color: '#666' }}>Tags: {job.tags.join(', ')}</div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
                {/* Archive Button */}
                <button 
                    onClick={() => onArchiveToggle(job)} 
                    disabled={isUpdating}
                >
                    {job.status === 'active' ? 'Archive' : 'Unarchive'}
                </button>
                {/* Edit Button - **FIXED** to open the modal */}
                <button 
                    onClick={() => onEdit(job)}
                    disabled={isUpdating}
                >
                    Edit
                </button>
            </div>
        </div>
    );
};


// --- Stub Components (Re-integrated with logic) ---

const PaginationStub = ({ page, totalPages, setPage }) => (
    <div className="pagination-stub" style={{ marginTop: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        Page {page} of {totalPages || 1}
        <button onClick={() => setPage(page => Math.max(1, page - 1))} disabled={page === 1}>Previous</button>
        <button onClick={() => setPage(page => Math.min(totalPages || 1, page + 1))} disabled={page === totalPages}>Next</button>
    </div>
);

const FiltersStub = ({ search, status, setSearch, setStatus, JobStatus }) => (
    <div className="filters-stub" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input 
            type="text" 
            placeholder="Search by title..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status || ''} onChange={(e) => setStatus(e.target.value || null)}>
            <option value="">All Statuses</option>
            <option value={JobStatus.ACTIVE}>Active</option>
            <option value={JobStatus.ARCHIVED}>Archived</option>
        </select>
    </div>
);


// --- Main JobsBoard Component ---
export default function JobsBoard() {
    const { 
        jobs, 
        isLoading, 
        isFetching, 
        error,
        page, 
        totalPages, 
        jobsData, // Needed for queryKey and pagination
        setPage, 
        search, 
        status, 
        setSearch, 
        setStatus,
        JobStatus,
    } = useJobs();
    
    // Determine the queryKey for mutations
    const queryKey = jobsData ? ['jobs', { search, status, page, pageSize: jobsData.pageSize, sort: 'order' }] : ['jobs']; 

    const { updateJob, isUpdating, reorderJob } = useJobMutations();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [jobToEdit, setJobToEdit] = useState(null); // Null for create, job object for edit

    // --- Modal/Edit Handlers ---
    const handleOpenCreate = () => {
        setJobToEdit(null);
        setIsModalOpen(true);
    };

    // **FIXED**: Handler to open modal for editing
    const handleOpenEdit = (job) => {
        setJobToEdit(job);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setJobToEdit(null);
    };

    // --- Archive Handler ---
    const handleArchiveToggle = (job) => {
        const newStatus = job.status === JobStatus.ACTIVE ? JobStatus.ARCHIVED : JobStatus.ACTIVE;
        updateJob({ id: job.id, status: newStatus }); 
    };

    // --- DND Handlers ---
    const sensors = useSensors(useSensor(PointerSensor));

    const onDragEnd = (result) => {
        const { active, over } = result;

        // Check if the drop was valid and the position changed
        if (!over || active.id === over.id) {
            return;
        }

        // The jobs list array must be sorted by 'order' for this to work correctly
        const sortedJobs = jobs.sort((a, b) => a.order - b.order);
        
        const activeIndex = sortedJobs.findIndex(job => String(job.id) === String(active.id));
        const overIndex = sortedJobs.findIndex(job => String(job.id) === String(over.id));
        
        if (activeIndex === -1 || overIndex === -1) return;

        const movedJob = sortedJobs[activeIndex];

        const fromOrder = movedJob.order;
        const toOrder = sortedJobs[overIndex].order;

        if (fromOrder === toOrder) return;

        // Call the mutation with optimistic update logic
        reorderJob({
            id: movedJob.id,
            fromOrder,
            toOrder,
            queryKey, // Pass the queryKey for the optimistic update and rollback
        });
    };

    // List of item IDs for SortableContext
    const items = jobs.map(job => String(job.id));

    if (error) {
        return <div style={{ color: 'red', padding: '20px' }}>An error occurred: {error.message}</div>;
    }

    const loadingMessage = isLoading ? "Loading jobs..." : isFetching ? "Updating list..." : null;

    return (
        <div style={{ padding: '20px' }}>
            <h1>Jobs Board</h1>
            {loadingMessage && <p style={{ color: 'blue' }}>{loadingMessage}</p>}
            
            <button onClick={handleOpenCreate} style={{ marginBottom: '20px' }}>
                + Create New Job
            </button>
            
            {/* Modal for Create/Edit */}
            {isModalOpen && (
                <div style={{ height:'450px', position: 'fixed', top: '250px', left: '40%', transform: 'translateX(-50%)', backgroundColor: 'white', padding: '20px', zIndex: 10, border: '1px solid #000', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <JobFormModal job={jobToEdit} onClose={handleCloseModal} />
                </div>
            )}

            {/* Filtering Controls */}
            <FiltersStub 
                search={search} 
                status={status} 
                setSearch={setSearch} 
                setStatus={setStatus} 
                JobStatus={JobStatus}
            />

            {/* Main Job List with DND Context */}
            {!isLoading && jobs.length > 0 ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <div style={{ border: '1px solid #ddd', minHeight: '300px' }}>
                        <SortableContext items={items} strategy={verticalListSortingStrategy}>
                            {jobs.map(job => (
                                <SortableJobListItem
                                    key={job.id} 
                                    job={job} 
                                    onArchiveToggle={handleArchiveToggle}
                                    onEdit={handleOpenEdit} // **FIXED**
                                    isUpdating={isUpdating}
                                    queryKey={queryKey}
                                />
                            ))}
                        </SortableContext>
                    </div>

                    {/* Pagination Controls */}
                    {jobsData && (
                        <PaginationStub 
                            page={page} 
                            totalPages={totalPages} 
                            setPage={setPage} 
                        />
                    )}
                </DndContext>

            ) : !isLoading && <p>No jobs found matching your criteria.</p>}
        </div>
    );
}