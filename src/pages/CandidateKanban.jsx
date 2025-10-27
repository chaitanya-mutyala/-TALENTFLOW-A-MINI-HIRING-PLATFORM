// src/pages/CandidateKanban.jsx

import React, { useMemo } from 'react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCandidates, CandidateStages } from '../hooks/useCandidates';
import { useCandidateMutations } from '../hooks/useCandidateMutations';

// --- Reusable Column Component ---
const KanbanColumn = ({ stage, candidates, onCandidateDrop }) => {
    return (
        <div style={{ flex: 1, minWidth: '250px', backgroundColor: '#f4f7f9', padding: '10px', borderRadius: '8px', margin: '10px' }}>
            <h3 style={{ borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
                {stage.toUpperCase()} ({candidates.length})
            </h3>
            
            <DroppableColumn id={stage} candidates={candidates} onCandidateDrop={onCandidateDrop}>
                {/* Candidates are rendered inside the SortableContext provided by DroppableColumn */}
            </DroppableColumn>
        </div>
    );
};

// --- Droppable Area (Dnd-kit component) ---
// We use the column ID as the drop target
const DroppableColumn = ({ id, children, candidates }) => {
    // The useSortable hook is not strictly necessary for the column itself, 
    // but the column ID acts as the drop zone identifier.
    // For simplicity with dnd-kit, we can just use a regular div wrapped in the DndContext.
    return (
        <div id={id} data-stage={id} style={{ minHeight: '300px', backgroundColor: '#eef2f5', borderRadius: '4px', padding: '8px' }}>
             {/* SortableContext manages the Draggable items within this list */}
             <SortableContext items={candidates.map(c => String(c.id))} strategy={verticalListSortingStrategy}>
                {candidates.map(candidate => (
                    <SortableCandidateItem key={candidate.id} candidate={candidate} />
                ))}
             </SortableContext>
        </div>
    );
};

// --- Draggable Candidate Item ---
const SortableCandidateItem = ({ candidate }) => {
    // useSortable makes the item draggable and sortable within its column
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(candidate.id) });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        border: '1px solid #ccc',
        backgroundColor: 'white',
        padding: '10px',
        margin: '5px 0',
        borderRadius: '4px',
        cursor: 'grab',
        boxShadow: isDragging ? '0 4px 8px rgba(0,0,0,0.1)' : 'none',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <strong>{candidate.name}</strong>
            <div style={{ fontSize: '12px', color: '#666' }}>{candidate.email}</div>
            {/* Deep link requirement: */}
            <a href={`/candidates/${candidate.id}`} style={{ fontSize: '12px', color: 'blue' }}>View Profile</a>
            {/* Note: The assignment also requires attaching notes, which would be an action here */}
        </div>
    );
};


// --- Main Kanban Board Component ---
export default function CandidateKanban() {
    const { candidates, isLoading, error, CandidateStages } = useCandidates();
    const { updateCandidateStage } = useCandidateMutations();

    // Use PointerSensor for basic drag events
    const sensors = useSensors(useSensor(PointerSensor));

    // Memoize candidates by stage for efficient rendering of columns
    const candidatesByStage = useMemo(() => {
        const grouped = Object.values(CandidateStages).reduce((acc, stage) => {
            acc[stage] = [];
            return acc;
        }, {});

        candidates.forEach(c => {
            grouped[c.stage]?.push(c);
        });
        return grouped;
    }, [candidates, CandidateStages]);

    // --- Drag End Handler (The core logic for stage transition) ---
    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over) return;
        
        const activeId = parseInt(active.id);
        const overId = over.id; // Could be a candidate ID or the column ID if dropped outside a card

        // Determine if the drop was into a new column (stage)
        let newStage = null;
        
        // 1. If dropped onto another candidate card, the stage remains the same (for sorting within the column)
        const activeCandidate = candidates.find(c => c.id === activeId);
        
        // 2. Determine the new stage (This assumes the over.id is the column ID if it's not a candidate ID)
        if (activeCandidate) {
            // Find the true stage ID of the drop target (must traverse the DOM to find the parent column ID)
            let newStageElement = over.id; 
            
            // Simple check to see if the drop target ID matches a stage name
            if (Object.values(CandidateStages).includes(String(overId))) {
                 newStage = String(overId);
            } else {
                 // If dropped on a card, the new stage is the stage of the dropped-on card
                 const overCandidate = candidates.find(c => String(c.id) === String(overId));
                 if (overCandidate) {
                     newStage = overCandidate.stage;
                 }
            }
        }
        
        // Final check: did the stage actually change?
        if (newStage && newStage !== activeCandidate.stage) {
            console.log(`Candidate ${activeId} moving from ${activeCandidate.stage} to ${newStage}`);
            updateCandidateStage({ id: activeId, stage: newStage });
        }
        
        // NOTE: Internal sorting within the column is handled automatically by SortableContext, 
        // but we skip calling an internal reorder API since the requirement only mentioned 
        // moving between stages via kanban.
    };

    if (error) {
        return <div style={{ color: 'red', padding: '20px' }}>An error occurred: {error.message}</div>;
    }
    
    // Only render the board if data is loaded
    if (isLoading) {
        return <div style={{ padding: '20px' }}>Loading Kanban Board...</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1>Candidate Stage Kanban Board</h1>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', minHeight: '600px' }}>
                    {Object.values(CandidateStages).map(stage => (
                        <KanbanColumn
                            key={stage}
                            stage={stage}
                            candidates={candidatesByStage[stage]}
                        />
                    ))}
                </div>
            </DndContext>
        </div>
    );
}