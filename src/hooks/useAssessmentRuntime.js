// src/hooks/useAssessmentRuntime.js
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- Fetch assessment structure from API or mock ---
async function fetchAssessmentStructure(jobId) {
  const response = await fetch(`/assessments/${jobId}`, {
    headers: { 'Accept': 'application/json' },
  });

  // If response is not OK, try to extract readable error
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to load assessment structure: ${text}`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error('Invalid JSON in assessment structure response.');
  }
}

// --- Submit candidate's assessment responses ---
async function submitAssessmentResponse({ jobId, candidateId, responses }) {
  const response = await fetch(`/assessments/${jobId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidateId, responses }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to submit assessment: ${text}`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error('Invalid JSON in submission response.');
  }
}

export function useAssessmentRuntime(jobId, candidateId) {
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState({});

  // --- Fetch the assessment structure ---
  const {
    data: assessment,
    isLoading: isAssessmentLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['assessmentRuntime', jobId],
    queryFn: () => fetchAssessmentStructure(jobId),
    enabled: !!jobId,
    staleTime: 5 * 60 * 1000, // Cache 5 mins
  });

  // --- Mutation for submission ---
  const submitMutation = useMutation({
    mutationFn: submitAssessmentResponse,
    onSuccess: (data) => {
      console.log('✅ Submission successful:', data);
    },
    onError: (err) => {
      console.error('❌ Submission failed:', err);
    },
  });

  const isSubmitting = submitMutation.isLoading;

  // --- Update Answer Logic ---
  const updateAnswer = useCallback((questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  // --- Handle Submit ---
  const handleSubmit = useCallback(() => {
    if (!assessment || !candidateId) {
      console.error('Missing assessment or candidate ID.');
      return;
    }

    const validationErrors = {};

    assessment.sections.flatMap((s) => s.questions).forEach((q) => {
      const answer = answers[q.id];

      if (q.required && (!answer || (Array.isArray(answer) && answer.length === 0))) {
        validationErrors[q.id] = `${q.label} is required.`;
      }

      if (q.type === 'numeric' && q.range && answer) {
        const num = parseFloat(answer);
        if (isNaN(num) || num < q.range.min || num > q.range.max) {
          validationErrors[q.id] = `Must be between ${q.range.min} and ${q.range.max}.`;
        }
      }

      if (q.type === 'short text' && answer && answer.length > 100) {
        validationErrors[q.id] = `Maximum length is 100 characters.`;
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      console.error('Validation failed:', validationErrors);
      alert('Please correct validation errors before submitting.');
      return;
    }

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
