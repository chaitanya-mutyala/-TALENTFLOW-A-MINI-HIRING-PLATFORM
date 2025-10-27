// src/hooks/useAssessmentRuntime.js

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// We reuse the fetchAssessment function from the builder hook (or a separate API file)
async function fetchAssessmentStructure(jobId) {
    const response = await fetch(`/assessments/${jobId}`);
    if (!response.ok) {
        throw new Error('Failed to load assessment structure.');
    }
    return response.json();
}

async function submitAssessmentResponse({ jobId, candidateId, responses }) {
    const response = await fetch(`/assessments/${jobId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, responses }),
    });
    if (!response.ok) {
        throw new Error('Failed to submit assessment.');
    }
    return response.json();
}

export function useAssessmentRuntime(jobId, candidateId) {
    const queryClient = useQueryClient();
    
    // State to hold the candidate's answers
    const [answers, setAnswers] = useState({});
    
    // Fetch the assessment structure
    const { data: assessment, isLoading: isAssessmentLoading, error: fetchError } = useQuery({
        queryKey: ['assessmentRuntime', jobId],
        queryFn: () => fetchAssessmentStructure(jobId),
        enabled: !!jobId,
        staleTime: 5 * 60 * 1000, // Keep structure cached for a while
    });
    
    // Mutation for submission
    const submitMutation = useMutation({
        mutationFn: submitAssessmentResponse,
        onSuccess: (data) => {
            console.log('Submission successful:', data);
            // In a real app, you might navigate the candidate to a 'Thank You' page
        },
        onError: (err) => {
            console.error('Submission failed:', err);
        }
    });
    
    const isSubmitting = submitMutation.isLoading;
    
    // --- Answer Handling ---
    const updateAnswer = useCallback((questionId, value) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    }, []);

    // --- Submission Logic ---
    const handleSubmit = useCallback(() => {
        // 1. Basic check
        if (!assessment || !candidateId) {
            console.error("Missing assessment or candidate ID.");
            return;
        }

        // 2. Run Validation (Required fields, range checks, etc.)
        const validationErrors = {};
        
        assessment.sections.flatMap(s => s.questions).forEach(q => {
            const answer = answers[q.id];
            
            // Check required fields (only if question is visible - handled in UI)
            if (q.required && (!answer || (Array.isArray(answer) && answer.length === 0))) {
                // NOTE: In production, we'd only validate visible questions. 
                validationErrors[q.id] = `${q.label} is required.`;
            }

            // Check numeric range
            if (q.type === 'numeric' && q.range && answer) {
                const num = parseFloat(answer);
                if (isNaN(num) || num < q.range.min || num > q.range.max) {
                    validationErrors[q.id] = `Must be between ${q.range.min} and ${q.range.max}.`;
                }
            }
            // Check max length (short text only)
            if (q.type === 'short text' && answer && answer.length > 100) {
                 validationErrors[q.id] = `Maximum length is 100 characters.`;
            }
        });

        if (Object.keys(validationErrors).length > 0) {
            console.error("Validation failed:", validationErrors);
            alert('Please correct the validation errors before submitting.');
            return;
        }

        // 3. Submit
        submitMutation.mutate({
            jobId: assessment.jobId,
            candidateId,
            responses: answers,
        });

    }, [assessment, answers, candidateId, submitMutation]);
    
    return {
        assessment,
        answers,
        updateAnswer,
        handleSubmit,
        isAssessmentLoading,
        isSubmitting,
        submitError: submitMutation.error || fetchError,
    };
}