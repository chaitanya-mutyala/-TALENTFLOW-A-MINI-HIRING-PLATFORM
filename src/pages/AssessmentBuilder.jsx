import React from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { useAssessmentBuilder, QuestionTypes } from '../hooks/useAssessmentBuilder';
import { v4 as uuidv4 } from 'uuid';



// --- Options Management Component ---
const OptionsControl = ({ question, sectionId, updateQuestion }) => {
  const handleAddOption = () => {
    const newOption = { id: uuidv4(), value: `Option ${question.options.length + 1}` };
    updateQuestion(sectionId, question.id, {
      options: [...(question.options || []), newOption],
    });
  };

  const handleUpdateOption = (optionId, value) => {
    updateQuestion(sectionId, question.id, {
      options: question.options.map(opt =>
        opt.id === optionId ? { ...opt, value } : opt
      ),
    });
  };

  const handleRemoveOption = optionId => {
    updateQuestion(sectionId, question.id, {
      options: question.options.filter(opt => opt.id !== optionId),
    });
  };

  return (
    <div style={{ padding: '5px 0' }}>
      {question.options?.map(opt => (
        <div
          key={opt.id}
          style={{
            display: 'flex',
            gap: '5px',
            marginBottom: '5px',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            value={opt.value}
            onChange={e => handleUpdateOption(opt.id, e.target.value)}
            style={{ flexGrow: 1, padding: '4px' }}
          />
          <button onClick={() => handleRemoveOption(opt.id)} style={{ padding: '2px 8px' }}>
            -
          </button>
        </div>
      ))}
      <button onClick={handleAddOption} style={{ marginTop: '5px' }}>
        + Add Option
      </button>
    </div>
  );
};

// --- Question Control Component ---
const QuestionControl = ({ question, sectionId, updateQuestion, deleteQuestion }) => {
  const isChoice =
    question.type === QuestionTypes.SINGLE_CHOICE ||
    question.type === QuestionTypes.MULTI_CHOICE;
  const isNumeric = question.type === QuestionTypes.NUMERIC;

  const toggleRequired = () =>
    updateQuestion(sectionId, question.id, { required: !question.required });

  return (
    <div
      style={{
        padding: '8px',
        border: '1px dashed #bbb',
        margin: '10px 0',
        backgroundColor: '#f9f9f9',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <input
          type="text"
          value={question.label}
          onChange={e => updateQuestion(sectionId, question.id, { label: e.target.value })}
          style={{ flexGrow: 1, padding: '4px' }}
        />
        <span style={{ fontSize: '12px', color: '#007bff', marginLeft: '10px' }}>
          [{question.type}]
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '5px',
          fontSize: '12px',
        }}
      >
        <label>
          <input type="checkbox" checked={question.required} onChange={toggleRequired} /> Required
        </label>
        <button
          onClick={() => deleteQuestion(sectionId, question.id)}
          style={{ color: 'red', border: 'none', background: 'none' }}
        >
          Delete
        </button>
      </div>

      {/* Options Control */}
      {isChoice && (
        <OptionsControl question={question} sectionId={sectionId} updateQuestion={updateQuestion} />
      )}

      {/* Numeric Range Control */}
      {isNumeric && (
        <div style={{ marginTop: '10px', fontSize: '12px' }}>
          Range:
          Min:{' '}
          <input
            type="number"
            value={question.range?.min || 0}
            onChange={e =>
              updateQuestion(sectionId, question.id, {
                range: { ...question.range, min: parseInt(e.target.value) },
              })
            }
            style={{ width: '60px', margin: '0 5px' }}
          />
          Max:{' '}
          <input
            type="number"
            value={question.range?.max || 100}
            onChange={e =>
              updateQuestion(sectionId, question.id, {
                range: { ...question.range, max: parseInt(e.target.value) },
              })
            }
            style={{ width: '60px', margin: '0 5px' }}
          />
        </div>
      )}
    </div>
  );
};

// --- Assessment Preview Component ---
const AssessmentPreview = ({ assessment }) => {
  const renderQuestionInput = question => {
    switch (question.type) {
      case QuestionTypes.SHORT_TEXT:
        return <input type="text" maxLength={100} disabled placeholder="Short text (max 100 chars)" />;
      case QuestionTypes.LONG_TEXT:
        return <textarea disabled placeholder="Long text" />;
      case QuestionTypes.NUMERIC:
        return (
          <input
            type="number"
            disabled
            placeholder={`Numeric (${question.range.min}-${question.range.max})`}
          />
        );
      case QuestionTypes.SINGLE_CHOICE:
        return (
          <div>
            {question.options?.map(opt => (
              <label key={opt.id} style={{ marginRight: '10px' }}>
                <input type="radio" disabled /> {opt.value}
              </label>
            ))}
          </div>
        );
      case QuestionTypes.MULTI_CHOICE:
        return (
          <div>
            {question.options?.map(opt => (
              <label key={opt.id} style={{ marginRight: '10px' }}>
                <input type="checkbox" disabled /> {opt.value}
              </label>
            ))}
          </div>
        );
      case QuestionTypes.FILE_UPLOAD:
        return <input type="file" disabled />;
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        padding: '15px',
        border: '1px solid #ccc',
        backgroundColor: '#fff',
        maxHeight: '70vh',
        overflowY: 'auto',
      }}
    >
      <h2>Preview: {assessment?.name}</h2>
      {assessment?.sections.map(section => (
        <div
          key={section.id}
          style={{ marginBottom: '20px', paddingLeft: '10px', borderLeft: '3px solid #007bff' }}
        >
          <h4>{section.title}</h4>
          {section.questions.map(question => (
            <div
              key={question.id}
              style={{
                marginBottom: '10px',
                border: '1px solid #eee',
                padding: '10px',
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

// --- Main Builder Page ---
export default function AssessmentBuilder() {
  const { jobId } = useParams();

  const {
    assessment,
    isFetching,
    isSaving,
    handleSave,
    addSection,
    addQuestion,
    updateQuestion,
    updateSection,
    updateAssessment,
    deleteQuestion,
    hasUnsavedChanges,
    QuestionTypes,
  } = useAssessmentBuilder(jobId);

  if (isFetching || !assessment) {
    return <div style={{ padding: '20px' }}>Loading Assessment Builder...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Assessment Builder</h1>

      <div
        style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          value={assessment.name}
          onChange={e => updateAssessment({ name: e.target.value })}
          style={{ fontSize: '1.5em', border: 'none', borderBottom: '1px solid #ccc' }}
        />
        <button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
          {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* 1️⃣ Builder Pane */}
        <div>
          <h2>Builder Controls</h2>
          <button onClick={addSection} disabled={isSaving}>
            + Add Section
          </button>

          {assessment.sections.map(section => (
            <div
              key={section.id}
              style={{ border: '2px solid #ddd', padding: '15px', margin: '15px 0' }}
            >
              <input
                type="text"
                value={section.title}
                onChange={e => updateSection(section.id, { title: e.target.value })}
                style={{ fontWeight: 'bold', marginBottom: '10px' }}
              />

              {section.questions.map(question => (
                <QuestionControl
                  key={question.id}
                  question={question}
                  sectionId={section.id}
                  updateQuestion={updateQuestion}
                  deleteQuestion={deleteQuestion}
                />
              ))}

              <select
                onChange={e => addQuestion(section.id, e.target.value)}
                value=""
                disabled={isSaving}
                style={{ marginTop: '10px', width: '100%' }}
              >
                <option value="" disabled>
                  + Add Question Type
                </option>
                {Object.values(QuestionTypes).map(type => (
                  <option key={type} value={type}>
                    {type.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* 2️⃣ Live Preview Pane */}
        <div>
          <h2>Live Preview</h2>
          <AssessmentPreview assessment={assessment} />
          {/* ✅ Next Assessment Navigation */}
{Number(jobId) < 3 && (
  <NavLink 
    to={`/assessments/${Number(jobId) + 1}/builder`} 
    style={{ 
      display: 'inline-block',
      marginTop: '20px',
      padding: '10px 20px', 
      backgroundColor: '#28a745', 
      color: 'white', 
      borderRadius: '4px', 
      textDecoration: 'none',
      fontWeight: 'bold'
    }}
  >
    Next Assessment ➜
  </NavLink>
)}

        </div>
      </div>
    </div>
  );
}
