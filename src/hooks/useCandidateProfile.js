import { useQuery } from '@tanstack/react-query';

// --- Fetch Candidate Details ---
async function fetchCandidateDetails(candidateId) {
    const response = await fetch(`/candidates/${candidateId}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch candidate details for ID ${candidateId}.`);
    }
    return response.json();
}

// --- Fetch Candidate Timeline ---
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
    
    // Fetch candidate details
    const detailsQuery = useQuery({
        queryKey: ['candidate', candidateId],
        queryFn: () => fetchCandidateDetails(candidateId),
        enabled: isEnabled,
    });
    
    // Fetch candidate timeline
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
