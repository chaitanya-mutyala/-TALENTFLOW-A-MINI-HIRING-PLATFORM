// src/hooks/useCandidateMutations.js

import { useMutation, useQueryClient } from '@tanstack/react-query';

async function updateCandidateStage({ id, stage }) {
    const response = await fetch(`/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
    });

    if (!response.ok) {
        throw new Error('Failed to update candidate stage.');
    }
    return response.json();
}

export function useCandidateMutations() {
    const queryClient = useQueryClient();

    const updateStageMutation = useMutation({
        mutationFn: updateCandidateStage,
        
        // Optimistic Update for stage change (for a smoother UX)
        onMutate: async ({ id, stage }) => {
            const queryKey = ['candidates', { search: '', stage: null }]; 
            
            await queryClient.cancelQueries({ queryKey });
            const previousCandidatesData = queryClient.getQueryData(queryKey);

            queryClient.setQueryData(queryKey, (oldData) => {
                if (!oldData) return previousCandidatesData;

                const newCandidates = oldData.candidates.map(c => 
                    c.id === id ? { ...c, stage: stage } : c
                );

                return { ...oldData, candidates: newCandidates };
            });

            return { previousCandidatesData, queryKey };
        },

        // Rollback on failure
        onError: (err, variables, context) => {
            if (context?.previousCandidatesData) {
                queryClient.setQueryData(context.queryKey, context.previousCandidatesData);
                console.error("Stage update failed, rolling back:", err.message);
            }
        },

        // Always refetch on success or failure to ensure data accuracy
        onSettled: (data, error, variables, context) => {
            queryClient.invalidateQueries({ queryKey: context.queryKey });
        },
    });

    return {
        updateCandidateStage: updateStageMutation.mutate,
        isUpdating: updateStageMutation.isLoading,
    };
}