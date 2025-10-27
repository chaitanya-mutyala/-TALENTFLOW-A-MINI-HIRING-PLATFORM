// src/hooks/useJobs.js

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchJobs, JobStatus } from '../api/jobs';

// Default query parameters
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT = 'order';

/**
 * Hook to fetch and manage the state for the Jobs board list.
 */
export function useJobs() {
    // State for user-driven filters and pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState(null); // null, 'active', or 'archived'
    const [sort, setSort] = useState(DEFAULT_SORT);

    // React Query to manage data fetching, caching, and state
    const queryResult = useQuery({
        // The queryKey is crucial: it tells React Query when to refetch.
        // Any change in these parameters will trigger a new fetch.
        queryKey: ['jobs', { search, status, page, pageSize, sort }],
        queryFn: () => fetchJobs({ search, status, page, pageSize, sort }),
        // Keep previous data when fetching new pages (good for smoother UX)
        keepPreviousData: true, 
        staleTime: 60000, // Data is fresh for 60 seconds
    });

    // Helper function to reset page to 1 whenever filters change
    const handleFilterChange = (newFilters) => {
        // Only set page to 1 if a *filter* (not page/pageSize) changed
        if (newFilters.search !== undefined || newFilters.status !== undefined) {
             setPage(1);
        }

        if (newFilters.search !== undefined) setSearch(newFilters.search);
        if (newFilters.status !== undefined) setStatus(newFilters.status);
        if (newFilters.sort !== undefined) setSort(newFilters.sort);
    };

    return {
        // Data and status from React Query
        jobsData: queryResult.data,
        jobs: queryResult.data?.jobs || [],
        isLoading: queryResult.isLoading,
        isFetching: queryResult.isFetching,
        error: queryResult.error,
        
        // State for filters and pagination
        page,
        pageSize,
        search,
        status,
        sort,
        
        // Actions to update state
        setPage,
        setPageSize,
        setSearch,
        setStatus,
        setSort,
        handleFilterChange,
        
        // Pagination metadata
        totalCount: queryResult.data?.totalCount,
        totalPages: queryResult.data?.totalPages,
        JobStatus, // Export status constants for use in the UI
    };
}