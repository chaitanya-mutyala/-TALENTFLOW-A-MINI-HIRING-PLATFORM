import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// --- Import All Pages ---
import JobsBoard from './pages/jobsBoard';
import CandidateKanban from './pages/CandidateKanban';
import CandidateProfile from './pages/CandidateProfile';
import AssessmentBuilder from './pages/AssessmentBuilder';
import AssessmentRuntime from './pages/AssessmentRuntime';

// Initialize React Query client
const queryClient = new QueryClient();

// --- Navigation Bar ---
const NavBar = () => (
  <header style={{
    backgroundColor: '#2c3e50',
    padding: '20px 0',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  }}>
    {/* Title */}
    <h1 style={{
      margin: 0,
      fontSize: '28px',
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: '1px',
    }}>
      TALENTFLOW – A MINI HIRING PLATFORM
    </h1>

    {/* Navigation Links */}
    <nav style={{ marginTop: '16px', width: '100%' }}>
      <ul style={{
        display: 'flex',
        justifyContent: 'center',
        listStyle: 'none',
        margin: 0,
        padding: 0,
        gap: '40px',
      }}>
        <li><NavLink to="/jobs" style={linkStyle} activeStyle={activeLinkStyle}>Jobs Board</NavLink></li>
        <li><NavLink to="/candidates" style={linkStyle} activeStyle={activeLinkStyle}>Candidates</NavLink></li>
        <li><NavLink to="/assessments/1/builder" style={linkStyle} activeStyle={activeLinkStyle}>Assessment Builder</NavLink></li>
        <li><NavLink to="/assessments/1/runtime/42" style={linkStyle} activeStyle={activeLinkStyle}>Assessment Runtime</NavLink></li>
      </ul>
    </nav>
  </header>
);

// --- Styles for Links ---
const linkStyle = {
  color: '#ecf0f1',
  textDecoration: 'none',
  fontWeight: '500',
  fontSize: '17px',
  transition: 'color 0.2s, border-bottom 0.2s',
};

const activeLinkStyle = {
  borderBottom: '2px solid #1abc9c',
  paddingBottom: '4px',
  color: '#1abc9c',
};

// --- Main App ---
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <NavBar />
        <main style={{ padding: '20px' }}>
          <Routes>
            {/* Default route */}
            <Route path="/" element={<JobsBoard />} />

            {/* JOBS */}
            <Route path="/jobs" element={<JobsBoard />} />
            <Route path="/jobs/:jobId" element={<div>Job Details View Placeholder</div>} />

            {/* CANDIDATES */}
            <Route path="/candidates" element={<CandidateKanban />} />
            <Route path="/candidates/:id" element={<CandidateProfile />} />

            {/* ASSESSMENTS */}
            <Route path="/assessments/:jobId/builder" element={<AssessmentBuilder />} />
            <Route path="/assessments/:jobId/runtime/:candidateId" element={<AssessmentRuntime />} />

            {/* 404 */}
            <Route path="*" element={<div style={{ padding: '20px' }}>404 - Page Not Found</div>} />
          </Routes>
        </main>
      </Router>
    </QueryClientProvider>
  );
}
