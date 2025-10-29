// src/hooks/useCandidates.js

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// --- Type Definitions (Define these in a candidates.js API file later) ---
export const CandidateStages = {
    APPLIED: 'applied',
    SCREEN: 'screen',
    OFFER: 'offer',
    HIRED: 'hired',
    REJECTED: 'rejected',
};

// --- Fetcher Function ---
export async function fetchCandidates({ search = '', stage }) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (stage) params.append('stage', stage);

    const response = await fetch(`/candidates?${params.toString()}`);

    if (!response.ok) {
        throw new Error('Failed to fetch candidates.');
    }

    return response.json();
}

/**
 * Hook to fetch and manage the state for the Candidates board list.
 */
export function useCandidates() {
    const [search, setSearch] = useState('');
    const [stage, setStage] = useState(null); // null for all stages

    // React Query to manage data fetching, caching, and state
    const queryResult = useQuery({
        // The queryKey changes when stage or search changes, triggering a fetch
        queryKey: ['candidates', { search, stage }],
        queryFn: () => fetchCandidates({ search, stage }),
        staleTime: 60000, 
    });
    
    // The data returned from the API is the full, filtered array for virtualization
    const candidates = queryResult.data?.candidates || [];

    return {
        // Data and status from React Query
        candidates,
        isLoading: queryResult.isLoading,
        isFetching: queryResult.isFetching,
        error: queryResult.error,
        
        // State for filters
        search,
        stage,
        
        // Actions to update state
        setSearch,
        setStage,
        
        CandidateStages, // Export constants for use in the UI
    };
}