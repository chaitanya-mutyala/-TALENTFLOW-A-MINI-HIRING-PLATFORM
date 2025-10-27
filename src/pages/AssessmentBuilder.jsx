// src/pages/AssessmentBuilder.jsx

import React, { useState, useEffect, useCallback } from 'react'; // Added useEffect and useCallback
import { useAssessmentBuilder, QuestionTypes } from '../hooks/useAssessmentBuilder';
// IMPORTANT: You MUST install the 'uuid' package (npm install uuid)
import { v4 as uuidv4 } from 'uuid'; 

// Mock jobId for testing the builder (e.g., Job ID 1 from your seed data)
const MOCK_JOB_ID = 1; 


// --- Helper Components ---

// Options Management Component (for Single/Multi-Choice)
const OptionsControl = ({ question, sectionId, updateQuestion }) => {
    const handleAddOption = () => {
        const newOption = { id: uuidv4(), value: `Option ${question.options.length + 1}` };
        updateQuestion(sectionId, question.id, { 
            options: [...(question.options || []), newOption] 
        });
    };

    const handleUpdateOption = (optionId, value) => {
        updateQuestion(sectionId, question.id, {
            options: question.options.map(opt => 
                opt.id === optionId ? { ...opt, value } : opt
            )
        });
    };

    const handleRemoveOption = (optionId) => {
        updateQuestion(sectionId, question.id, {
            options: question.options.filter(opt => opt.id !== optionId)
        });
    };

    return (
        <div style={{ padding: '5px 0' }}>
            {question.options?.map(opt => (
                <div key={opt.id} style={{ display: 'flex', gap: '5px', marginBottom: '5px', alignItems: 'center' }}>
                    <input
                        type="text"
                        value={opt.value}
                        onChange={(e) => handleUpdateOption(opt.id, e.target.value)}
                        style={{ flexGrow: 1, padding: '4px' }}
                    />
                    <button onClick={() => handleRemoveOption(opt.id)} style={{ padding: '2px 8px' }}>-</button>
                </div>
            ))}
            <button onClick={handleAddOption} style={{ marginTop: '5px' }}>+ Add Option</button>
        </div>
    );
};

// Conditional Logic Stub Component
const ConditionalControl = ({ question, sectionId, updateQuestion, questionsInAssessment }) => {
    const { dependsOn, condition } = question.conditional || {};
    
    // Filter out the current question to prevent circular dependency
    const availableQuestions = questionsInAssessment.filter(q => q.id !== question.id);

    const handleToggleConditional = (e) => {
        const isEnabled = e.target.checked;
        if (isEnabled && !question.conditional) {
            updateQuestion(sectionId, question.id, { 
                conditional: { 
                    dependsOn: availableQuestions[0]?.id || '', // Default to first available question
                    condition: "==='Yes'" // Default condition
                } 
            });
        } else if (!isEnabled) {
            updateQuestion(sectionId, question.id, { conditional: null });
        }
    };

    return (
        <div style={{ marginTop: '10px', padding: '10px', border: '1px solid orange', fontSize: '12px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
                <input type="checkbox" checked={!!question.conditional} onChange={handleToggleConditional} />
                **Conditional Question**
            </label>
            {question.conditional && (
                <div>
                    Show if 
                    <select 
                        value={dependsOn} 
                        onChange={(e) => updateQuestion(sectionId, question.id, { conditional: { dependsOn: e.target.value, condition } })}
                        style={{ margin: '0 5px' }}
                    >
                        {availableQuestions.map(q => (
                            <option key={q.id} value={q.id}>Q: {q.label.substring(0, 20)}...</option>
                        ))}
                    </select>
                    is 
                    <input 
                        type="text" 
                        value={condition} 
                        onChange={(e) => updateQuestion(sectionId, question.id, { conditional: { dependsOn, condition: e.target.value } })}
                        placeholder="e.g., ==='Yes'"
                        style={{ width: '80px', margin: '0 5px' }}
                    />
                </div>
            )}
        </div>
    );
};


// Question Control Component (for Builder Pane)
const QuestionControl = ({ question, sectionId, updateQuestion, questionsInAssessment }) => {
    
    const isChoice = question.type === QuestionTypes.SINGLE_CHOICE || question.type === QuestionTypes.MULTI_CHOICE;
    const isNumeric = question.type === QuestionTypes.NUMERIC;
    
    const toggleRequired = () => updateQuestion(sectionId, question.id, { required: !question.required });

    return (
        <div style={{ padding: '8px', border: '1px dashed #bbb', margin: '10px 0', backgroundColor: '#f9f9f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <input 
                    type="text" 
                    value={question.label} 
                    onChange={(e) => updateQuestion(sectionId, question.id, { label: e.target.value })}
                    style={{ flexGrow: 1, padding: '4px' }}
                />
                <span style={{ fontSize: '12px', color: '#007bff', marginLeft: '10px' }}>[{question.type}]</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '12px' }}>
                <label>
                    <input type="checkbox" checked={question.required} onChange={toggleRequired} />
                    Required
                </label>
                <button onClick={() => console.log('Delete Question', question.id)} style={{ color: 'red', border: 'none', background: 'none' }}>Delete</button>
            </div>

            {/* Options Control */}
            {isChoice && (
                <OptionsControl question={question} sectionId={sectionId} updateQuestion={updateQuestion} />
            )}

            {/* Numeric Range Control */}
            {isNumeric && (
                <div style={{ marginTop: '10px', fontSize: '12px' }}>
                    Range:
                    Min: <input 
                        type="number" 
                        value={question.range?.min || 0} 
                        onChange={(e) => updateQuestion(sectionId, question.id, { range: { ...question.range, min: parseInt(e.target.value) } })}
                        style={{ width: '60px', margin: '0 5px' }}
                    />
                    Max: <input 
                        type="number" 
                        value={question.range?.max || 100} 
                        onChange={(e) => updateQuestion(sectionId, question.id, { range: { ...question.range, max: parseInt(e.target.value) } })}
                        style={{ width: '60px', margin: '0 5px' }}
                    />
                </div>
            )}
            
            {/* Conditional Logic Control */}
            <ConditionalControl 
                question={question} 
                sectionId={sectionId} 
                updateQuestion={updateQuestion} 
                questionsInAssessment={questionsInAssessment}
            />
        </div>
    );
};


// Assessment Preview Component (Live Rendering)
const AssessmentPreview = ({ assessment }) => {
    
    const allQuestions = assessment?.sections.flatMap(s => s.questions).reduce((map, q) => {
        map[q.id] = q;
        return map;
    }, {});
    
    const [mockAnswers, setMockAnswers] = useState({});

    // Logic to determine if a question should be visible (simulates conditional check)
    const isQuestionVisible = (question) => {
        if (!question.conditional) return true;
        
        const { dependsOn, condition } = question.conditional;
        if (!dependsOn) return true;

        const dependencyQuestion = allQuestions[dependsOn];
        if (!dependencyQuestion) return true;

        // Simplified evaluation: Check if the mock answer equals the required value 
        const requiredValue = condition.replace(/[=']/g, ''); // Extracts the value from ==='Value'
        return String(mockAnswers[dependsOn]) === String(requiredValue);
    };

    const renderQuestionInput = (question) => {
        switch (question.type) {
            case QuestionTypes.SHORT_TEXT:
                return <input type="text" maxLength={100} disabled={true} placeholder="Short text (max length 100)" />;
            case QuestionTypes.LONG_TEXT:
                return <textarea disabled={true} placeholder="Long text" />;
            case QuestionTypes.NUMERIC:
                return <input type="number" disabled={true} placeholder={`Numeric (${question.range.min}-${question.range.max})`} />;
            case QuestionTypes.SINGLE_CHOICE:
                return (
                    <div>{question.options?.map(opt => (
                        <label key={opt.id} style={{ marginRight: '10px' }}>
                            <input 
                                type="radio" 
                                name={`q-${question.id}`} 
                                value={opt.value} 
                                disabled={false} // Enable for mock interaction
                                onChange={() => setMockAnswers(prev => ({ ...prev, [question.id]: opt.value }))}
                            /> {opt.value}
                        </label>
                    ))}</div>
                );
            case QuestionTypes.MULTI_CHOICE:
                return (
                    <div>{question.options?.map(opt => (
                         <label key={opt.id} style={{ marginRight: '10px' }}>
                            <input type="checkbox" disabled={true} /> {opt.value}
                        </label>
                    ))}</div>
                );
            case QuestionTypes.FILE_UPLOAD:
                return <input type="file" disabled={true} placeholder="(File Upload Stub)" />;
            default:
                return null;
        }
    };

    return (
        <div style={{ padding: '15px', border: '1px solid #ccc', backgroundColor: '#fff', maxHeight: '70vh', overflowY: 'auto' }}>
            <h2>Preview: {assessment?.name}</h2>
            <p style={{ color: 'orange', fontSize: '12px' }}>*Click choices to test conditional logic visibility*</p>
            {assessment?.sections.map(section => (
                <div key={section.id} style={{ marginBottom: '20px', paddingLeft: '10px', borderLeft: '3px solid #007bff' }}>
                    <h4>{section.title}</h4>
                    {section.questions.map(question => (
                        <div 
                            key={question.id} 
                            style={{ 
                                marginBottom: '10px', 
                                border: '1px solid #eee', 
                                padding: '10px',
                                display: isQuestionVisible(question) ? 'block' : 'none' // Conditional display logic
                            }}
                        >
                            <label style={{ fontWeight: 'bold' }}>
                                {question.label} {question.required && '*'}
                            </label>
                            {renderQuestionInput(question)}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};


// --- Main Builder Layout ---
export default function AssessmentBuilder() {
    const jobId = MOCK_JOB_ID; 
    
    const { 
        assessment, 
        isFetching, 
        isSaving, 
        handleSave, 
        addSection, 
        addQuestion, 
        updateQuestion,
        hasUnsavedChanges,
        QuestionTypes,
    } = useAssessmentBuilder(jobId);

    // Extract all questions from the nested structure into a flat array for controls/logic
    const allQuestions = assessment?.sections.flatMap(s => s.questions) || [];

    if (isFetching || !assessment) {
        return <div style={{ padding: '20px' }}>Loading Assessment Builder...</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1>Assessment Builder for Job ID: {jobId}</h1>

            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <input 
                    type="text" 
                    value={assessment.name} 
                    onChange={(e) => updateQuestion(null, null, { name: e.target.value })} 
                    style={{ fontSize: '1.5em', border: 'none', borderBottom: '1px solid #ccc' }}
                />
                <button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
                    {isSaving ? 'Saving...' : (hasUnsavedChanges ? 'Save Changes' : 'Saved')}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                
                {/* 1. Assessment Controls/Builder Pane */}
                <div>
                    <h2>Builder Controls</h2>
                    <button onClick={addSection} disabled={isSaving}>+ Add Section</button>

                    {assessment.sections.map(section => (
                        <div key={section.id} style={{ border: '2px solid #ddd', padding: '15px', margin: '15px 0' }}>
                            <input 
                                type="text" 
                                value={section.title} 
                                onChange={(e) => updateQuestion(section.id, null, { title: e.target.value })}
                                style={{ fontWeight: 'bold', marginBottom: '10px' }}
                            />
                            
                            {/* Question List */}
                            {section.questions.map(question => (
                                <QuestionControl 
                                    key={question.id}
                                    question={question}
                                    sectionId={section.id}
                                    updateQuestion={updateQuestion}
                                    questionsInAssessment={allQuestions} // Pass the flat list for conditional logic
                                />
                            ))}

                            {/* Add Question Dropdown */}
                            <select 
                                onChange={(e) => addQuestion(section.id, e.target.value)} 
                                value=""
                                disabled={isSaving}
                                style={{ marginTop: '10px', width: '100%' }}
                            >
                                <option value="" disabled>+ Add Question Type</option>
                                {Object.values(QuestionTypes).map(type => (
                                    <option key={type} value={type}>{type.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>

                {/* 2. Live Preview Pane */}
                <div>
                    <h2>Live Preview</h2>
                    <AssessmentPreview 
                        assessment={assessment} 
                    />
                </div>
            </div>
        </div>
    );
}