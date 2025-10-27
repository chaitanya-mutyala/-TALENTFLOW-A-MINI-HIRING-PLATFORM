// src/components/jobs/JobFormModal.jsx
import React, { useState, useEffect } from 'react';
import { useJobMutations } from '../hooks/useJobMutations';

/**
 * @typedef {import('../../api/jobs').Job} Job
 */

// Initial state for the form
const getInitialState = (job) => ({
    title: job?.title || '',
    tags: job?.tags?.join(', ') || '', // Convert array to comma-separated string
    description: job?.description || '',
});

export default function JobFormModal({ job, onClose }) {
    const isEdit = !!job;
    const { createJob, updateJob, isCreating, isUpdating } = useJobMutations();
    
    const [formData, setFormData] = useState(getInitialState(job));
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    // Reset form data if the job prop changes (e.g., modal is reused)
    useEffect(() => {
        setFormData(getInitialState(job));
        setError(null);
        setValidationErrors({});
    }, [job]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear validation error on change
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validate = () => {
        const errors = {};
        if (!formData.title.trim()) {
            errors.title = 'Job Title is required.';
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!validate()) return;
        
        const payload = {
            title: formData.title.trim(),
            // Convert tags string back to array, cleaning up whitespace
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag), 
            description: formData.description.trim(),
        };

        try {
            if (isEdit) {
                await updateJob({ id: job.id, ...payload });
            } else {
                await createJob(payload);
            }
            onClose(); // Close the modal on successful operation
        } catch (err) {
            // Handle the specific slug conflict error from the mock API
            if (err.message.includes('conflict')) {
                 setValidationErrors(prev => ({ ...prev, title: err.message }));
            } else {
                 setError(err.message);
            }
        }
    };
    
    const isSubmitting = isCreating || isUpdating;

    return (
        <div className="modal-content" style={{ padding: '20px', border: '1px solid #ccc' }}>
            <h3>{isEdit ? 'Edit Job' : 'Create New Job'}</h3>
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="title">Title (Required):</label>
                    <input 
                        id="title"
                        name="title"
                        value={formData.title} 
                        onChange={handleChange}
                        disabled={isSubmitting}
                        style={{ borderColor: validationErrors.title ? 'red' : '' }}
                    />
                    {validationErrors.title && <p style={{ color: 'red', fontSize: '12px' }}>{validationErrors.title}</p>}
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="tags">Tags (Comma separated):</label>
                    <input 
                        id="tags"
                        name="tags"
                        value={formData.tags} 
                        onChange={handleChange}
                        disabled={isSubmitting}
                    />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="description">Description:</label>
                    <textarea 
                        id="description"
                        name="description"
                        value={formData.description} 
                        onChange={handleChange}
                        disabled={isSubmitting}
                    />
                </div>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Job')}
                </button>
                <button type="button" onClick={onClose} disabled={isSubmitting} style={{ marginLeft: '10px' }}>
                    Cancel
                </button>
            </form>
        </div>
    );
}