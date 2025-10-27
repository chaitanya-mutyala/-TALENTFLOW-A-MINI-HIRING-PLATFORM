// src/pages/CandidateProfile.jsx

import React from 'react';
// Assuming you use react-router-dom and can access the ID
// import { useParams } from 'react-router-dom'; 
import { useCandidateProfile } from '../hooks/useCandidateProfile';

// Mock the useParams hook for development context
const MOCK_CANDIDATE_ID = 42; 

const TimelineItem = ({ event }) => {
    const date = new Date(event.date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    let icon = '📝'; // Default for Note
    if (event.type === 'StageChange') {
        icon = '➡️';
    }

    return (
        <div style={{ display: 'flex', borderLeft: '3px solid #007bff', paddingLeft: '15px', marginBottom: '15px' }}>
            <div style={{ marginRight: '15px', fontWeight: 'bold' }}>{date}</div>
            <div>
                <span style={{ marginRight: '5px' }}>{icon}</span>
                {event.details}
                {event.type === 'StageChange' && 
                    <span style={{ fontSize: '0.9em', color: '#666', marginLeft: '10px' }}>
                        (Status update)
                    </span>
                }
            </div>
        </div>
    );
};

export default function CandidateProfile() {
    // In a real app: const { candidateId } = useParams();
    const candidateId = MOCK_CANDIDATE_ID; 

    const { candidate, timeline, isLoading, error } = useCandidateProfile(candidateId);

    if (isLoading) {
        return <div style={{ padding: '20px' }}>Loading Candidate Profile...</div>;
    }

    if (error) {
        return <div style={{ color: 'red', padding: '20px' }}>Error loading profile: {error.message}</div>;
    }

    if (!candidate) {
        return <div style={{ padding: '20px' }}>Candidate not found.</div>;
    }

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
            
            {/* Candidate Details Header */}
            <div style={{ borderBottom: '2px solid #ccc', paddingBottom: '15px', marginBottom: '30px' }}>
                <h1>{candidate.name}</h1>
                <p>Email: **{candidate.email}**</p>
                <p>Current Stage: **{candidate.stage.toUpperCase()}**</p>
                <p>Applied to Job ID: **{candidate.jobId}**</p>
            </div>

            {/* Timeline of Status Changes */}
            <h2>Timeline of Activity</h2>
            <div style={{ marginTop: '20px' }}>
                {timeline.length > 0 ? (
                    timeline
                        // Sort by date descending (most recent first)
                        .sort((a, b) => b.date - a.date) 
                        .map((event, index) => (
                            <TimelineItem key={index} event={event} />
                        ))
                ) : (
                    <p>No activity timeline available.</p>
                )}
            </div>
            
            {/* Stub for Notes with @mentions requirement */}
            <h2 style={{ marginTop: '40px' }}>Notes & Mentions</h2>
            <div style={{ border: '1px solid #ddd', padding: '20px' }}>
                <p>Notes component goes here. It needs to support rendering **@mentions** (suggestions from local list).</p>
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