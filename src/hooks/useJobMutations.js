// src/hooks/useJobMutations.js

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { slugify } from '../db'; // Assuming you can import this helper
import { fetchJobs } from '../api/jobs'; // Needed for reorder logic

// --- Core API Calls (Mutations) ---

/**
 * Creates a new job.
 * @param {Object} jobData
 * @returns {Promise<Job>}
 */
async function createJob(jobData) {
    const response = await fetch('/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
    });

    if (response.status === 409) {
        throw new Error('Job title already exists (slug conflict).');
    }
    if (!response.ok) {
        throw new Error('Failed to create job due to a server error.');
    }
    return response.json();
}

/**
 * Updates an existing job (title, status, tags, description).
 * @param {Object} updates
 * @param {number} updates.id
 * @returns {Promise<Job>}
 */
async function updateJob({ id, ...updates }) {
    const response = await fetch(`/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });

    if (response.status === 409) {
        throw new Error('New title conflicts with existing job slug.');
    }
    if (!response.ok) {
        throw new Error('Failed to update job due to a server error.');
    }
    return response.json();
}

/**
 * Handles the drag-and-drop reorder operation.
 * @param {Object} data
 * @param {number} data.id - The ID of the job being moved.
 * @param {number} data.fromOrder
 * @param {number} data.toOrder
 * @returns {Promise<Object>}
 */
async function reorderJob({ id, fromOrder, toOrder }) {
    const response = await fetch(`/jobs/${id}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromOrder, toOrder }),
    });

    if (!response.ok) {
        // This is the simulated 500 error for rollback testing!
        throw new Error('Reorder failed. Rolling back changes.');
    }
    return response.json();
}

// --- Combined Mutation Hook ---

export function useJobMutations() {
    const queryClient = useQueryClient();

    // 1. Create Job Mutation
    const createMutation = useMutation({
        mutationFn: createJob,
        onSuccess: () => {
            // Invalidate the 'jobs' query to force a refetch and show the new job
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        },
    });

    // 2. Update Job Mutation (for Edit/Archive)
    const updateMutation = useMutation({
        mutationFn: updateJob,
        onSuccess: () => {
            // Invalidate the 'jobs' query to show the updated status/details
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        },
    });

    // 3. Reorder Job Mutation (Optimistic Update Logic)
    const reorderMutation = useMutation({
        mutationFn: reorderJob,
        
        // Optimistic Update: Runs before the API call
        onMutate: async ({ id, fromOrder, toOrder, queryKey }) => {
            // 1. Cancel any outgoing refetches for the jobs list to prevent stale data overwriting the optimistic update
            await queryClient.cancelQueries({ queryKey });

            // 2. Snapshot the previous value
            const previousJobsData = queryClient.getQueryData(queryKey);

            // 3. Optimistically update the cache
            queryClient.setQueryData(queryKey, (oldData) => {
                if (!oldData) return previousJobsData;

                const newJobs = [...oldData.jobs];
                const jobIndex = newJobs.findIndex(j => j.id === id);

                if (jobIndex > -1) {
                    const job = newJobs[jobIndex];
                    
                    // Simple in-memory reordering logic based on order property
                    newJobs.forEach(j => {
                        if (j.id === id) {
                            j.order = toOrder;
                        } else if (fromOrder < toOrder) {
                            // Moving down: shift jobs up (decrement order)
                            if (j.order > fromOrder && j.order <= toOrder) {
                                j.order -= 1;
                            }
                        } else if (fromOrder > toOrder) {
                            // Moving up: shift jobs down (increment order)
                            if (j.order >= toOrder && j.order < fromOrder) {
                                j.order += 1;
                            }
                        }
                    });
                    
                    // Re-sort the list *optimistically* to reflect the new order visually
                    newJobs.sort((a, b) => a.order - b.order);
                }

                return { ...oldData, jobs: newJobs };
            });

            // Return a context object with the snapshot value
            return { previousJobsData };
        },
        
        // Rollback on failure (500 error from MSW)
        onError: (err, newJob, context) => {
            // If the mutation fails, use the context snapshot to restore the cache
            if (context?.previousJobsData) {
                queryClient.setQueryData(context.queryKey, context.previousJobsData);
                console.error("Reorder failed, rolling back:", err.message);
                // Optionally show a notification to the user
                alert(err.message);
            }
        },
        
        // Always refetch after error or success to ensure client state matches server state
        onSettled: (data, error, variables, context) => {
            queryClient.invalidateQueries({ queryKey: context.queryKey });
        },
    });

    return {
        createJob: createMutation.mutateAsync,
        isCreating: createMutation.isLoading,
        updateJob: updateMutation.mutateAsync,
        isUpdating: updateMutation.isLoading,
        reorderJob: reorderMutation.mutate, // Use mutate, not mutateAsync, for simple action
        isReordering: reorderMutation.isLoading,
    };
}