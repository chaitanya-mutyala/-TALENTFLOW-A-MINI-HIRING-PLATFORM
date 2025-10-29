// src/api/jobs.js

/**
 * ---------------------------------------------
 * Type Definitions and Constants
 * ---------------------------------------------
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
 * ---------------------------------------------
 * Fetch Jobs (GET /jobs)
 * Mirrors logic from jobHandlers.js
 * ---------------------------------------------
 * @param {Object} params
 * @param {string} [params.search=''] - Filter by search term.
 * @param {string} [params.status] - Filter by job status ('active' | 'archived').
 * @param {number} [params.page=1] - Page number.
 * @param {number} [params.pageSize=10] - Items per page.
 * @param {string} [params.sort='order'] - Sort field.
 * @returns {Promise<JobsResponse>}
 */
export async function fetchJobs({ search = '', status, page = 1, pageSize = 10, sort = 'order' } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sort,
  });

  if (search) params.append('search', search);
  if (status) params.append('status', status);

  const response = await fetch(`/jobs?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch jobs: ${response.statusText}`);
  }

  return response.json();
}

/**
 * ---------------------------------------------
 * Create Job (POST /jobs)
 * Mirrors job creation in handler
 * ---------------------------------------------
 * @param {{ title: string, tags?: string[], description?: string }} jobData
 * @returns {Promise<Job>}
 */
export async function createJob(jobData) {
  const response = await fetch('/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jobData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create job.');
  }

  return response.json();
}

/**
 * ---------------------------------------------
 * Update Job (PATCH /jobs/:id)
 * ---------------------------------------------
 * @param {number} id
 * @param {Partial<Job>} updates
 * @returns {Promise<Job>}
 */
export async function updateJob(id, updates) {
  const response = await fetch(`/jobs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update job.');
  }

  return response.json();
}

/**
 * ---------------------------------------------
 * Reorder Job (PATCH /jobs/:id/reorder)
 * Used for drag-drop ordering in UI
 * ---------------------------------------------
 * @param {number} id
 * @param {{ fromOrder: number, toOrder: number }} reorderData
 * @returns {Promise<{ success: boolean }>}
 */
export async function reorderJob(id, reorderData) {
  const response = await fetch(`/jobs/${id}/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reorderData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to reorder job.');
  }

  return response.json();
}
