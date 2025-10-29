import React from 'react';
import { useParams } from 'react-router-dom';
import { useCandidateProfile } from '../hooks/useCandidateProfile';

// ✅ Reusable component for timeline events
const TimelineItem = ({ event }) => {
    const date = new Date(event.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    let icon = '📝'; // Default for Note
    if (event.type === 'StageChange') {
        icon = '➡️';
    }

    return (
        <div
            style={{
                display: 'flex',
                borderLeft: '3px solid #007bff',
                paddingLeft: '15px',
                marginBottom: '15px',
            }}
        >
            <div style={{ marginRight: '15px', fontWeight: 'bold' }}>{date}</div>
            <div>
                <span style={{ marginRight: '5px' }}>{icon}</span>
                {event.details}
                {event.type === 'StageChange' && (
                    <span
                        style={{
                            fontSize: '0.9em',
                            color: '#666',
                            marginLeft: '10px',
                        }}
                    >
                        (Status update)
                    </span>
                )}
            </div>
        </div>
    );
};

export default function CandidateProfile() {
    // ✅ Get candidate ID from URL — e.g. /candidates/42
    const { id } = useParams();
    const candidateId = parseInt(id, 10);

    // ✅ Use the custom React Query hook
    const { candidate, timeline, isLoading, error } = useCandidateProfile(candidateId);

    // ✅ Handle loading and errors
    if (isLoading) {
        return <div style={{ padding: '20px' }}>Loading Candidate Profile...</div>;
    }

    if (error) {
        return (
            <div style={{ color: 'red', padding: '20px' }}>
                Error loading profile: {error.message}
            </div>
        );
    }

    if (!candidate) {
        return <div style={{ padding: '20px' }}>Candidate not found.</div>;
    }

    // ✅ Render candidate details
    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Candidate Header */}
            <div
                style={{
                    borderBottom: '2px solid #ccc',
                    paddingBottom: '15px',
                    marginBottom: '30px',
                }}
            >
                <h1>{candidate.name}</h1>
                <p>Email: <strong>{candidate.email}</strong></p>
                <p>Current Stage: <strong>{candidate.stage?.toUpperCase()}</strong></p>
                <p>Applied Job: <strong>{candidate.jobTitle || 'N/A'}</strong></p>
                {candidate.summary && <p>{candidate.summary}</p>}
            </div>

            {/* Candidate Timeline */}
            <h2>Timeline of Activity</h2>
            <div style={{ marginTop: '20px' }}>
                {timeline.length > 0 ? (
                    timeline
                        .sort((a, b) => b.date - a.date)
                        .map((event, index) => <TimelineItem key={index} event={event} />)
                ) : (
                    <p>No activity timeline available.</p>
                )}
            </div>

            {/* Notes (future @mentions feature placeholder) */}
            <h2 style={{ marginTop: '40px' }}>Notes & Mentions</h2>
            <div style={{ border: '1px solid #ddd', padding: '20px' }}>
                <p>
                    Notes component goes here. It will support <strong>@mentions</strong> from
                    a local recruiter list.
                </p>
                <textarea
                    placeholder="Add a note... use @ to mention a recruiter."
                    rows="4"
                    style={{ width: '100%', resize: 'vertical' }}
                    disabled // Placeholder functionality
                />
            </div>
        </div>
    );
}
