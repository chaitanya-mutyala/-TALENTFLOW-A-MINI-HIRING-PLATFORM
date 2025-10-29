// src/components/jobs/JobFormModal.jsx
import React, { useState, useEffect } from 'react';
import { useJobMutations } from '../hooks/useJobMutations';

/**
 * @typedef {import('../../api/jobs').Job} Job
 */

const getInitialState = (job) => ({
  title: job?.title || '',
  tags: job?.tags?.join(', ') || '',
  description: job?.description || '',
});

export default function JobFormModal({ job, onClose }) {
  const isEdit = !!job;
  const { createJob, updateJob, isCreating, isUpdating } = useJobMutations();
  const [formData, setFormData] = useState(getInitialState(job));
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    setFormData(getInitialState(job));
    setError(null);
    setValidationErrors({});
  }, [job]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Job Title is required.';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    const payload = {
      title: formData.title.trim(),
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      description: formData.description.trim(),
    };

    try {
      if (isEdit) {
        await updateJob({ id: job.id, ...payload });
      } else {
        await createJob(payload);
      }
      onClose();
    } catch (err) {
      if (err.message.includes('conflict')) {
        setValidationErrors((prev) => ({ ...prev, title: err.message }));
      } else {
        setError(err.message);
      }
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <div
      className="modal-content"
      style={{
        padding: '15px 20px',
        borderRadius: '12px',
        backgroundColor: '#fff',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        maxWidth: '450px',
       
      }}
    >
      <h2
        style={{
          textAlign: 'center',
          marginBottom: '20px',
          color: '#333',
          fontWeight: '600',
        }}
      >
        {isEdit ? 'Edit Job' : 'Create New Job'}
      </h2>

      {error && <p style={{ color: 'red', textAlign: 'center' }}>Error: {error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label
            htmlFor="title"
            style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}
          >
            Title <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid red',
              outline: 'none',
              fontSize: '14px',
            }}
          />
          {validationErrors.title && (
            <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {validationErrors.title}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label
            htmlFor="tags"
            style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}
          >
            Tags (comma separated)
          </label>
          <input
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              outline: 'none',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label
            htmlFor="description"
            style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={isSubmitting}
            rows="4"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              outline: 'none',
              resize: 'none',
              fontSize: '14px',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              backgroundColor: '#e0e0e0',
              color: '#333',
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              backgroundColor: isEdit ? '#007bff' : '#28a745',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {isSubmitting
              ? 'Saving...'
              : isEdit
              ? 'Save Changes'
              : 'Create Job'}
          </button>
        </div>
      </form>
    </div>
  );
}