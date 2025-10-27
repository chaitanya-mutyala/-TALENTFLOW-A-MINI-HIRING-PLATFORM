// src/pages/AssessmentRuntime.jsx

import React, { useState, useMemo } from 'react';
import { useAssessmentRuntime } from '../hooks/useAssessmentRuntime';
// Assuming QuestionTypes is exported from your useAssessmentBuilder file for reuse
import { QuestionTypes } from '../hooks/useAssessmentBuilder'; 

// Mock data for runtime testing
const MOCK_JOB_ID = 1; 
const MOCK_CANDIDATE_ID = 42; // Example candidate ID

// --- Component Helpers ---

// Logic to determine if a question should be visible (reused from builder preview)
const isQuestionVisible = (question, allQuestionsMap, answers) => {
    if (!question.conditional) return true;
    
    const { dependsOn, condition } = question.conditional;
    if (!dependsOn) return true;

    // Get the answer for the dependency question
    const dependencyAnswer = answers[dependsOn];
    
    // Simplified evaluation: Check if the dependency answer equals the required value 
    // (Real-world would use a robust expression evaluator)
    const requiredValue = condition.replace(/[=']/g, '').trim(); 
    
    return String(dependencyAnswer) === String(requiredValue);
};

// Component to render the actual question input
const QuestionInput = ({ question, answer, updateAnswer }) => {
    const baseProps = {
        name: question.id,
        value: answer || '',
        onChange: (e) => updateAnswer(question.id, e.target.value),
        style: { width: '100%', padding: '8px', border: '1px solid #ccc' },
    };

    switch (question.type) {
        case QuestionTypes.SHORT_TEXT:
            return <input {...baseProps} type="text" maxLength={100} />;
        case QuestionTypes.LONG_TEXT:
            return <textarea {...baseProps} onChange={(e) => updateAnswer(question.id, e.target.value)} rows={4} />;
        case QuestionTypes.NUMERIC:
            return <input 
                        {...baseProps} 
                        type="number" 
                        min={question.range?.min} 
                        max={question.range?.max}
                        onChange={(e) => updateAnswer(question.id, e.target.value)} 
                    />;
        case QuestionTypes.SINGLE_CHOICE:
            return (
                <div>
                    {question.options?.map(opt => (
                        <label key={opt.id} style={{ marginRight: '15px' }}>
                            <input 
                                type="radio" 
                                name={`q-${question.id}`} 
                                checked={answer === opt.value}
                                onChange={() => updateAnswer(question.id, opt.value)}
                            /> {opt.value}
                        </label>
                    ))}
                </div>
            );
        case QuestionTypes.MULTI_CHOICE:
            // Multi-choice logic requires handling the answer as an array
            const isChecked = (value) => (answer || []).includes(value);
            const handleMultiChange = (value) => {
                const currentAnswers = answer || [];
                const newAnswers = isChecked(value) 
                    ? currentAnswers.filter(v => v !== value) 
                    : [...currentAnswers, value];
                updateAnswer(question.id, newAnswers);
            };

            return (
                <div>
                    {question.options?.map(opt => (
                        <label key={opt.id} style={{ marginRight: '15px' }}>
                            <input 
                                type="checkbox" 
                                checked={isChecked(opt.value)}
                                onChange={() => handleMultiChange(opt.value)}
                            /> {opt.value}
                        </label>
                    ))}
                </div>
            );
        case QuestionTypes.FILE_UPLOAD:
            return <input type="file" disabled={true} placeholder="(File submission is stubbed)" />;
        default:
            return null;
    }
};


// --- Main Runtime Component ---
export default function AssessmentRuntime() {
    // NOTE: In a router, jobId and candidateId would come from URL params or context
    const jobId = MOCK_JOB_ID; 
    const candidateId = MOCK_CANDIDATE_ID;
    
    const { 
        assessment, 
        answers, 
        updateAnswer, 
        handleSubmit,
        isAssessmentLoading, 
        isSubmitting, 
        submitError 
    } = useAssessmentRuntime(jobId, candidateId);

    // Create a flat map of all questions for conditional logic lookup
    const allQuestionsMap = useMemo(() => {
        return assessment?.sections.flatMap(s => s.questions).reduce((map, q) => {
            map[q.id] = q;
            return map;
        }, {}) || {};
    }, [assessment]);

    if (isAssessmentLoading) {
        return <div style={{ padding: '20px' }}>Loading Assessment...</div>;
    }

    if (submitError) {
         return <div style={{ color: 'red', padding: '20px' }}>An error occurred: {submitError.message}</div>;
    }

    if (!assessment || !assessment.sections.length) {
        return <div style={{ padding: '20px' }}>No assessment found for this job.</div>;
    }

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h1>Assessment: {assessment.name}</h1>
            <p>Please complete the following form for job {jobId}.</p>
            
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                {assessment.sections.map(section => (
                    <div key={section.id} style={{ marginBottom: '30px', borderBottom: '1px dashed #eee', paddingBottom: '20px' }}>
                        <h3>{section.title}</h3>
                        
                        {section.questions.map(question => {
                            const isVisible = isQuestionVisible(question, allQuestionsMap, answers);
                            
                            return (
                                <div 
                                    key={question.id} 
                                    style={{ 
                                        marginBottom: '20px', 
                                        padding: '15px', 
                                        border: '1px solid #f0f0f0',
                                        display: isVisible ? 'block' : 'none' 
                                    }}
                                >
                                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                                        {question.label} {question.required && <span style={{ color: 'red' }}>*</span>}
                                    </label>
                                    
                                    <QuestionInput
                                        question={question}
                                        answer={answers[question.id]}
                                        updateAnswer={updateAnswer}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ))}
                
                <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
                </button>
            </form>
        </div>
    );
}