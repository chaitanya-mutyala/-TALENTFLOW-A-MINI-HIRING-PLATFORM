// src/pages/CandidatesBoard.jsx

import React from 'react';
import { FixedSizeList as List } from 'react-window'; // 💡 Import virtualization component
import { useCandidates } from '../hooks/useCandidates';

// Height of a single list item
const ITEM_HEIGHT = 60; 

// --- Virtualized Row Component ---
// This component renders a single candidate item within the list
const CandidateRow = ({ index, style, data }) => {
    const candidate = data.candidates[index];
    
    // We pass index and style from react-window, style is crucial for positioning
    return (
        <div style={style} className="candidate-row" key={candidate.id}>
            <div style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <strong>{candidate.name}</strong>
                    <div style={{ fontSize: '14px', color: '#666' }}>{candidate.email}</div>
                </div>
                <div>
                    Stage: <span style={{ padding: '4px', borderRadius: '4px', backgroundColor: '#e0f7fa' }}>{candidate.stage}</span>
                </div>
                <button onClick={() => console.log('Go to profile:', candidate.id)}>
                    View Profile
                </button>
            </div>
        </div>
    );
};


// --- Main Board Component ---
export default function CandidatesBoard() {
    const { 
        candidates, 
        isLoading, 
        isFetching, 
        error,
        search, 
        stage, 
        setSearch, 
        setStage,
        CandidateStages,
    } = useCandidates();

    if (error) {
        return <div style={{ color: 'red', padding: '20px' }}>An error occurred: {error.message}</div>;
    }

    const loadingMessage = isLoading ? "Loading 1000+ candidates..." : isFetching ? "Updating list..." : null;
    const itemData = { candidates };
    
    // List height is set to display roughly 8 items at a time
    const listHeight = ITEM_HEIGHT * 8; 

    return (
        <div style={{ padding: '20px' }}>
            <h1>Candidates Board</h1>
            {loadingMessage && <p style={{ color: 'blue' }}>{loadingMessage}</p>}
            
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                {/* Client-side Search */}
                <input 
                    type="text" 
                    placeholder="Search name/email..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                />
                
                {/* Server-like Filter (Stage) */}
                <select value={stage || ''} onChange={(e) => setStage(e.target.value || null)}>
                    <option value="">All Stages</option>
                    {Object.values(CandidateStages).map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                </select>
                
                <p>Total Candidates: **{candidates.length}**</p>
            </div>

            {/* Virtualized List Implementation */}
            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <List
                    height={listHeight}
                    itemCount={candidates.length}
                    itemSize={ITEM_HEIGHT}
                    width={'100%'}
                    itemData={itemData}
                >
                    {CandidateRow}
                </List>
            )}
        </div>
    );
}