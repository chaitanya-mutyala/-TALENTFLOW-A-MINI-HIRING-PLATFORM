// src/hooks/useCandidateProfile.js

import { useQuery } from '@tanstack/react-query';

// --- API Fetchers ---

async function fetchCandidateDetails(candidateId) {
    // NOTE: We don't have a specific GET /candidates/:id, so we'll mock a lookup
    // In a real app, this would be a direct API call.
    // For this assignment, we'll assume the full list provides enough details or we fetch from local DB.
    // Since the requirement is focused on the timeline, we'll keep this stub simple.
    return {
        id: candidateId,
        name: `Candidate ${candidateId} Name`,
        email: `candidate${candidateId}@talentflow.com`,
        jobId: 1, // Assume assigned to job 1 for context
        stage: 'tech',
        appliedAt: Date.now() - 5 * 86400000,
    };
}

async function fetchCandidateTimeline(candidateId) {
    const response = await fetch(`/candidates/${candidateId}/timeline`);
    if (!response.ok) {
        throw new Error(`Failed to fetch timeline for candidate ${candidateId}.`);
    }
    return response.json();
}

// --- Main Hook ---

export function useCandidateProfile(candidateId) {
    const isEnabled = !!candidateId;
    
    // Fetch basic details
    const detailsQuery = useQuery({
        queryKey: ['candidate', candidateId],
        queryFn: () => fetchCandidateDetails(candidateId),
        enabled: isEnabled,
    });
    
    // Fetch timeline data
    const timelineQuery = useQuery({
        queryKey: ['candidateTimeline', candidateId],
        queryFn: () => fetchCandidateTimeline(candidateId),
        enabled: isEnabled,
    });

    return {
        candidate: detailsQuery.data,
        timeline: timelineQuery.data?.timeline || [],
        isLoading: detailsQuery.isLoading || timelineQuery.isLoading,
        error: detailsQuery.error || timelineQuery.error,
    };
}