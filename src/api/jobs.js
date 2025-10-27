// src/api/jobs.js

/**
 * Type definitions for Jobs
 */
export const JobStatus = {
    ACTIVE: 'active',
    ARCHIVED: 'archived',
};

/**
 * @typedef {Object} Job
 * @property {number} id
 * @property {string} title
 * @property {string} slug
 * @property {string} status - 'active' or 'archived'
 * @property {string[]} tags
 * @property {number} order
 * @property {string} description
 * @property {number} createdAt
 */

/**
 * @typedef {Object} JobsResponse
 * @property {Job[]} jobs
 * @property {number} page
 * @property {number} pageSize
 * @property {number} totalCount
 * @property {number} totalPages
 */

/**
 * Fetches a list of jobs from the mock API.
 * @param {Object} params
 * @param {string} [params.search=''] - Search term for title/description.
 * @param {string} [params.status] - Filter by job status ('active' | 'archived').
 * @param {number} [params.page=1] - Current page number.
 * @param {number} [params.pageSize=10] - Number of items per page.
 * @param {string} [params.sort='order'] - Field to sort by.
 * @returns {Promise<JobsResponse>}
 */
export async function fetchJobs({ search = '', status, page = 1, pageSize = 10, sort = 'order' }) {
    const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sort,
    });
    
    if (search) {
        params.append('search', search);
    }
    if (status) {
        params.append('status', status);
    }

    const response = await fetch(`/jobs?${params.toString()}`);

    if (!response.ok) {
        throw new Error('Failed to fetch jobs.');
    }

    return response.json();
}