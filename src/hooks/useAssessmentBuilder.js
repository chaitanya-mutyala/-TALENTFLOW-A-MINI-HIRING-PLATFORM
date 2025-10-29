// src/hooks/useAssessmentBuilder.js
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';

export const QuestionTypes = {
  SINGLE_CHOICE: 'single-choice',
  MULTI_CHOICE: 'multi-choice',
  SHORT_TEXT: 'short text',
  LONG_TEXT: 'long text',
  NUMERIC: 'numeric',
  FILE_UPLOAD: 'file upload stub',
};

// --- API Calls ---
async function fetchAssessment(jobId) {
  const response = await fetch(`/assessments/${jobId}`);
  if (response.status === 404) {
    return { jobId, sections: [], name: 'New Job Assessment' };
  }
  if (!response.ok) throw new Error('Failed to fetch assessment builder data.');
  return response.json();
}

async function saveAssessment(assessment) {
  const response = await fetch(`/assessments/${assessment.jobId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assessment),
  });
  if (!response.ok) throw new Error('Failed to save assessment structure.');
  return response.json();
}

// --- Main Hook ---
export function useAssessmentBuilder(jobId) {
  const queryClient = useQueryClient();

  const { data: fetchedAssessment, isLoading: isFetching } = useQuery({
    queryKey: ['assessmentBuilder', jobId],
    queryFn: () => fetchAssessment(jobId),
    enabled: !!jobId,
    staleTime: Infinity,
  });

  const [assessment, setAssessment] = useState(null);

  useEffect(() => {
    if (fetchedAssessment) setAssessment(fetchedAssessment);
  }, [fetchedAssessment]);

  const saveMutation = useMutation({
    mutationFn: saveAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessmentBuilder', jobId] });
    },
  });

  // --- Actions ---

  const addSection = useCallback(() => {
    setAssessment(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        { id: uuidv4(), title: `New Section ${prev.sections.length + 1}`, questions: [] },
      ],
    }));
  }, []);

  const addQuestion = useCallback((sectionId, type) => {
    setAssessment(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              questions: [
                ...section.questions,
                {
                  id: uuidv4(),
                  type,
                  label: `New ${type} Question`,
                  required: false,
                  ...(type === QuestionTypes.SINGLE_CHOICE || type === QuestionTypes.MULTI_CHOICE
                    ? { options: [{ id: uuidv4(), value: 'Option 1' }] }
                    : {}),
                  ...(type === QuestionTypes.NUMERIC
                    ? { range: { min: 0, max: 100 } }
                    : {}),
                },
              ],
            }
          : section
      ),
    }));
  }, []);

  const updateQuestion = useCallback((sectionId, questionId, updates) => {
    setAssessment(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map(question =>
                question.id === questionId ? { ...question, ...updates } : question
              ),
            }
          : section
      ),
    }));
  }, []);

  // ✅ NEW: Update section title
  const updateSection = useCallback((sectionId, updates) => {
    setAssessment(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      ),
    }));
  }, []);

  // ✅ NEW: Update top-level assessment data (e.g., name)
  const updateAssessment = useCallback((updates) => {
    setAssessment(prev => ({ ...prev, ...updates }));
  }, []);

  const handleSave = () => {
    if (assessment) saveMutation.mutate(assessment);
  };

  const hasUnsavedChanges =
    JSON.stringify(assessment) !== JSON.stringify(fetchedAssessment);

  return {
    assessment,
    isFetching,
    isSaving: saveMutation.isLoading,
    error: saveMutation.error,
    hasUnsavedChanges,

    addSection,
    addQuestion,
    updateQuestion,
    updateSection,      // ✅ now available
    updateAssessment,   // ✅ now available
    handleSave,
    QuestionTypes,
  };
}
