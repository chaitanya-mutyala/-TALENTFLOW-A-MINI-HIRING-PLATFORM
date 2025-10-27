// src/db.js (FINALIZED and CORRECT)

import Dexie from 'dexie';

// 1. Initialize the Database
export const db = new Dexie('TalentFlowDB');

// 2. Define the Schema (Stores and Indexes)
db.version(1).stores({
    jobs: '++id, slug, status, order',        
    candidates: '++id, email, stage, jobId',         // Index on email, stage, AND jobId
    assessments: 'jobId', 
    responses: '++id, candidateId, jobId',                    
});

// Helper function to convert text into a URL-friendly slug
export const slugify = (text) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

// --- Seed Data Generation Functions (Unchanged) ---

export function generateSeedJobs(count) {
    // ... (Job seeding logic) ...
    const jobs = [];
    const titles = ["Front-End Developer", "Senior UX Designer", "DevOps Engineer", "HR Specialist", "Product Manager"];
    const tags = ["React", "Remote", "Full-Time", "Urgent", "New"];

    for (let i = 1; i <= count; i++) {
        const title = `${titles[i % titles.length]} (${i % 2 === 0 ? 'Active' : 'Archived'})`;
        jobs.push({
            id: i,
            title: title,
            slug: slugify(title), 
            status: i % 5 === 0 ? "archived" : "active", 
            tags: [tags[i % tags.length], tags[(i + 1) % tags.length]],
            order: i, 
            description: `This is a description for the role: ${title}. We are seeking a motivated individual.`,
            createdAt: Date.now() - (count - i) * 86400000, 
        });
    }
    return jobs;
}


export function generateSeedCandidates(count, jobIds) {
    const candidates = [];
    const names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry", "Ivy", "Jack"];
    // The required candidate stages 
    const stages = ["applied", "screen", "tech", "offer", "hired", "rejected"]; 

    for (let i = 1; i <= count; i++) {
        const firstName = names[i % names.length];
        const lastName = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(97 + Math.floor(Math.random() * 26)) + String(i);
        const name = `${firstName} ${lastName}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@talentflow.com`;
        
        const jobId = jobIds[Math.floor(Math.random() * jobIds.length)]; 
        const stage = stages[Math.floor(Math.random() * stages.length)]; 

        candidates.push({
            id: i,
            jobId: jobId,
            name: name,
            email: email,
            stage: stage,
            appliedAt: Date.now() - Math.floor(Math.random() * 30) * 86400000,
        });
    }
    return candidates;
}
export function generateSeedAssessments(jobIds) {
    // ... (Assessment seeding logic) ...
    const assessments = [];
    
    const questionTypes = ["single-choice", "multi-choice", "short text", "long text", "numeric", "file upload stub"];
    
    for (let i = 0; i < 3; i++) {
        const jobId = jobIds[i]; 
        
        const sections = [{
            id: `s1-${jobId}`,
            title: "General Aptitude",
            questions: Array.from({ length: 12 }, (_, qIndex) => ({
                id: `q${qIndex + 1}-s1-${jobId}`,
                type: questionTypes[qIndex % questionTypes.length],
                label: `Question ${qIndex + 1}: Assessment question for experience level.`,
                required: qIndex < 5,
                options: (qIndex === 0 || qIndex === 1) ? [{ id: 'optA', value: 'Yes' }, { id: 'optB', value: 'No' }] : null,
                range: qIndex === 4 ? { min: 0, max: 100 } : null,
                conditional: qIndex === 5 ? {
                    condition: "==='Yes'", 
                    dependsOn: `q1-s1-${jobId}` 
                } : null
            }))
        }];

        assessments.push({
            jobId: jobId, 
            name: `Initial Screening Quiz - Job #${jobId}`,
            sections: sections,
            createdAt: Date.now(),
        });
    }
    return assessments;
}

// 5. Seeding Master Function (FIXED to ensure connection is open)
export async function seedDatabase() {
    try {
        // 💡 CRITICAL FIX: Explicitly open the database connection
        await db.open();

        if ((await db.jobs.count()) === 0) {
            console.log('Seeding database with initial data...');

            // A. Seed 25 Jobs
            const initialJobs = generateSeedJobs(25); 
            await db.jobs.bulkAdd(initialJobs);
            const jobIds = initialJobs.map(j => j.id);

            // B. Seed 1000 Candidates
            const initialCandidates = generateSeedCandidates(1000, jobIds); 
            await db.candidates.bulkAdd(initialCandidates);

            // C. Seed Assessments
            const initialAssessments = generateSeedAssessments(jobIds);
            await db.assessments.bulkAdd(initialAssessments);
            console.log(`Successfully seeded ${initialAssessments.length} assessments.`);

        } else {
             console.log('Database already seeded. Skipping.');
        }
    } catch (error) {
        console.error("Error seeding database:", error);
    }
}