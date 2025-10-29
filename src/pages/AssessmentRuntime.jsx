// src/pages/AssessmentRuntime.jsx
import { useParams, NavLink } from 'react-router-dom';
import React, { useMemo } from 'react';
import { useAssessmentRuntime } from '../hooks/useAssessmentRuntime';
import { QuestionTypes } from '../hooks/useAssessmentBuilder';

// --- Helper Functions ---
const isQuestionVisible = (question, allQuestionsMap, answers) => {
    if (!question.conditional) return true;
    const { dependsOn, condition } = question.conditional;
    if (!dependsOn) return true;

    const dependencyAnswer = answers[dependsOn];
    const requiredValue = condition.replace(/[=']/g, '').trim(); 
    return String(dependencyAnswer) === String(requiredValue);
};

// --- Input Renderer ---
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
            return <textarea {...baseProps} rows={4} />;
        case QuestionTypes.NUMERIC:
            return <input {...baseProps} type="number" min={question.range?.min} max={question.range?.max} />;
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
            const isChecked = (value) => (answer || []).includes(value);
            const handleMultiChange = (value) => {
                const current = answer || [];
                const updated = isChecked(value)
                    ? current.filter(v => v !== value)
                    : [...current, value];
                updateAnswer(question.id, updated);
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
            return <input type="file" disabled placeholder="(File upload not implemented)" />;
        default:
            return null;
    }
};

// --- Main Component ---
export default function AssessmentRuntime() {
    const { jobId, candidateId } = useParams();
    const numericJobId = Number(jobId);
    const nextJobId = numericJobId + 1;
    const lastJobId = 3; // 🟡 Change this based on how many jobs exist

    const { 
        assessment, 
        answers, 
        updateAnswer, 
        handleSubmit,
        isAssessmentLoading, 
        isSubmitting, 
        submitError 
    } = useAssessmentRuntime(numericJobId, candidateId);

    const allQuestionsMap = useMemo(() => {
        return assessment?.sections
            .flatMap(s => s.questions)
            .reduce((map, q) => ((map[q.id] = q), map), {}) || {};
    }, [assessment]);

    if (isAssessmentLoading) return <div style={{ padding: '20px' }}>Loading Assessment...</div>;
    if (submitError) return <div style={{ color: 'red', padding: '20px' }}>Error: {submitError.message}</div>;
    if (!assessment || !assessment.sections.length) return <div style={{ padding: '20px' }}>No assessment found.</div>;

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h1>Assessment: {assessment.name}</h1>
            <p>Please complete the following form.</p>
            
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
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
                    </button>

                    {/* ✅ Conditionally render "Next" button */}
                    {numericJobId < lastJobId && (
                        <NavLink 
                            to={`/assessments/${nextJobId}/runtime/${candidateId}`} 
                            style={{ 
                                padding: '10px 20px', 
                                backgroundColor: '#28a745', 
                                color: 'white', 
                                borderRadius: '4px', 
                                textDecoration: 'none'
                            }}
                        >
                            Next ➜
                        </NavLink>
                    )}
                </div>
            </form>
        </div>
    );
}
