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
        const title = `${titles[i % titles.length]}`;
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
    const stages = ["applied", "screen", "offer", "hired", "rejected"]; 

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
  const assessments = [];

  // Fixed categories for 3 different assessments
  const categories = [
    {
      title: "Aptitude and Logical Reasoning",
      questions: [
        { type: "single-choice", label: "What is 25% of 200?", options: [{ id: "optA", value: "25" }, { id: "optB", value: "50" }, { id: "optC", value: "75" }] },
        { type: "numeric", label: "Enter the next number in the series: 2, 6, 12, 20, ?", range: { min: 0, max: 100 } },
        { type: "long text", label: "Explain how you would solve a logical puzzle under time pressure." },
        { type: "multi-choice", label: "Select all prime numbers from below.", options: [{ id: "optA", value: "2" }, { id: "optB", value: "4" }, { id: "optC", value: "7" }] },
        { type: "short text", label: "Define ‘critical thinking’ in one sentence." },
        { type: "single-choice", label: "Which figure does not belong in the sequence?", options: [{ id: "optA", value: "Triangle" }, { id: "optB", value: "Square" }, { id: "optC", value: "Circle" }] },
        { type: "long text", label: "Describe a scenario where logical reasoning helped you make a decision." },
        { type: "multi-choice", label: "Choose all correct statements about even numbers.", options: [{ id: "optA", value: "Divisible by 2" }, { id: "optB", value: "Always prime" }, { id: "optC", value: "Ends with 0, 2, 4, 6, or 8" }] },
        { type: "numeric", label: "Enter a two-digit number divisible by both 3 and 5.", range: { min: 10, max: 99 } },
        { type: "short text", label: "State one quality of a good problem solver." },
      ]
    },
    {
      title: "Technical and Coding Skills",
      questions: [
        { type: "single-choice", label: "Which data structure uses FIFO?", options: [{ id: "optA", value: "Stack" }, { id: "optB", value: "Queue" }, { id: "optC", value: "Tree" }] },
        { type: "multi-choice", label: "Select all programming languages that are object-oriented.", options: [{ id: "optA", value: "Java" }, { id: "optB", value: "C" }, { id: "optC", value: "Python" }] },
        { type: "short text", label: "Write the syntax to declare a variable in JavaScript." },
        { type: "numeric", label: "What is the output of 5 * 4 + 3?", range: { min: 0, max: 100 } },
        { type: "file upload stub", label: "Upload a screenshot of your code editor setup." },
        { type: "long text", label: "Explain how REST APIs work in your own words." },
        { type: "single-choice", label: "Which sorting algorithm has the best average complexity?", options: [{ id: "optA", value: "Bubble Sort" }, { id: "optB", value: "Merge Sort" }, { id: "optC", value: "Selection Sort" }] },
        { type: "multi-choice", label: "Select the front-end frameworks you’ve used.", options: [{ id: "optA", value: "React" }, { id: "optB", value: "Angular" }, { id: "optC", value: "Vue" }] },
        { type: "long text", label: "Describe your approach to debugging a complex program." },
        { type: "short text", label: "What is Big-O notation?" },
      ]
    },
    {
      title: "Communication and Behavioral Skills",
      questions: [
        { type: "single-choice", label: "How do you usually handle team conflicts?", options: [{ id: "optA", value: "Avoid discussion" }, { id: "optB", value: "Communicate openly" }, { id: "optC", value: "Report to manager" }] },
        { type: "long text", label: "Describe a situation where you successfully persuaded someone at work." },
        { type: "short text", label: "What does 'active listening' mean to you?" },
        { type: "multi-choice", label: "Select all qualities of an effective communicator.", options: [{ id: "optA", value: "Empathy" }, { id: "optB", value: "Confidence" }, { id: "optC", value: "Interrupting often" }] },
        { type: "file upload stub", label: "Upload a video or document demonstrating your presentation skills." },
        { type: "numeric", label: "Rate your confidence level from 1 to 10.", range: { min: 1, max: 10 } },
        { type: "long text", label: "Explain how you manage stress during deadlines." },
        { type: "multi-choice", label: "Choose all correct practices for workplace etiquette.", options: [{ id: "optA", value: "Respect deadlines" }, { id: "optB", value: "Ignore feedback" }, { id: "optC", value: "Collaborate with peers" }] },
        { type: "short text", label: "What motivates you to work efficiently?" },
        { type: "single-choice", label: "Which type of communication do you prefer?", options: [{ id: "optA", value: "Email" }, { id: "optB", value: "Chat" }, { id: "optC", value: "Meetings" }] },
      ]
    }
  ];

  // Generate up to 3 structured assessments (one per category), but guard if jobIds shorter
  for (let i = 0; i < Math.min(3, jobIds.length); i++) {
    const jobId = jobIds[i];
    const sectionData = categories[i];
    const section = {
      id: `s1-${jobId}`,
      title: sectionData.title,
      questions: sectionData.questions.map((q, idx) => ({
        id: `q${idx + 1}-s1-${jobId}`,
        label: q.label,
        type: q.type,
        required: idx < 6,
        options: q.options ? JSON.parse(JSON.stringify(q.options)) : null,
        range: q.range ? { ...q.range } : null,
        conditional: null,
      })),
    };

    assessments.push({
      jobId: jobId,
      name: `${sectionData.title} - Assignment for Job #${jobId}`,
      sections: [section],
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