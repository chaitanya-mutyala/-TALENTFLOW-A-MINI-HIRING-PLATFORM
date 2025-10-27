// src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 

// --- Import All Pages ---
import JobsBoard from './pages/jobsBoard';
import CandidateKanban from './pages/CandidateKanban';
import CandidateProfile from './pages/CandidateProfile';
import AssessmentBuilder from './pages/AssessmentBuilder';
import AssessmentRuntime from './pages/AssessmentRuntime'; 

// Initialize the Query Client for global state management
const queryClient = new QueryClient();

// --- Simple Navigation Bar Component ---
const NavBar = () => (
    <nav style={{ padding: '15px', backgroundColor: '#333', color: 'white' }}>
        <ul style={{ listStyle: 'none', display: 'flex', margin: 0, padding: 0 }}>
            <li style={{ marginRight: '20px' }}><Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>TALENTFLOW</Link></li>
            <li style={{ marginRight: '20px' }}><Link to="/jobs" style={{ color: 'white', textDecoration: 'none' }}>Jobs Board</Link></li>
            <li style={{ marginRight: '20px' }}><Link to="/candidates" style={{ color: 'white', textDecoration: 'none' }}>Candidates Kanban</Link></li>
            <li style={{ marginRight: '20px' }}><Link to="/assessments/1/builder" style={{ color: 'white', textDecoration: 'none' }}>Assessment Builder (Job 1)</Link></li>
            <li style={{ marginRight: '20px' }}><Link to="/assessments/1/runtime/42" style={{ color: 'white', textDecoration: 'none' }}>Assessment Runtime (Demo)</Link></li>
        </ul>
    </nav>
);

// --- Main App Component ---
export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <NavBar />
                <main>
                    <Routes>
                        {/* Root path defaults to Jobs Board (or a landing page) */}
                        <Route path="/" element={<JobsBoard />} /> 
                        
                        {/* JOBS FLOW */}
                        <Route path="/jobs" element={<JobsBoard />} />
                        {/* Deep link to a job: /jobs/:jobId [cite: 12] */}
                        <Route path="/jobs/:jobId" element={
                             // You might put the Job details view here, but for now, we point it to the Job Form/Details component
                             // Since the assignment implies a *link* but not a full details page structure, we reuse the JobFormModal concept or point to a new JobDetails page.
                             <div style={{ padding: '20px' }}>Job Details View Placeholder</div>
                        } />

                        {/* CANDIDATES FLOW */}
                        <Route path="/candidates" element={<CandidateKanban />} />
                        {/* Candidate profile route: /candidates/:id [cite: 17] */}
                        <Route path="/candidates/:id" element={<CandidateProfile />} />

                        {/* ASSESSMENTS FLOW */}
                        {/* HR Assessment Builder: /assessments/:jobId/builder */}
                        <Route path="/assessments/:jobId/builder" element={<AssessmentBuilder />} />
                        {/* Candidate Assessment Runtime: /assessments/:jobId/runtime/:candidateId */}
                        <Route path="/assessments/:jobId/runtime/:candidateId" element={<AssessmentRuntime />} />

                        {/* 404 Not Found */}
                        <Route path="*" element={<div style={{ padding: '20px' }}>404 - Page Not Found</div>} />
                    </Routes>
                </main>
            </Router>
        </QueryClientProvider>
    );
}
