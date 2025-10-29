# ⚡ TALENTFLOW – A Mini Hiring Platform (React Technical Assignment)

## 🧩 Project Overview
**TalentFlow** is a front-end hiring platform simulation built with **React (Vite)**.  
It replicates a modern applicant tracking system with **job management**, **candidate workflows**, and **assessment modules** — entirely powered by **local persistence** and **mock APIs**.

All data is stored locally using **IndexedDB** (via Dexie.js), and network requests are simulated with **MSW (Mock Service Worker)** for a fully offline, yet realistic, development experience.

---

## 🚀 Live Demo & Repository

| Aspect | Detail |
|--------|---------|
| **Live Demo Link** | [https://talentflow-a-mini-hiring-platform-omega.vercel.app/](https://talentflow-a-mini-hiring-platform-omega.vercel.app/) |
| **Code Repository** | [https://github.com/chaitanya-mutyala/-TALENTFLOW-A-MINI-HIRING-PLATFORM](https://github.com/chaitanya-mutyala/-TALENTFLOW-A-MINI-HIRING-PLATFORM) |
| **Contribution** | Made with 💙 by [Chaitanya Mutyala](https://github.com/chaitanya-mutyala) |

---

> ⚠️ **Note:**  
> The **Candidate Profile page** may not load correctly on **Vercel deployment** .  
> However, it works **perfectly on localhost** during local development.  
>
> To demonstrate full functionality, a **video demo** has been provided showing the app running locally:  
> 🎥 [▶️ Watch Demo on Google Drive](https://drive.google.com/file/d/1eOme_hv5Vxp78Cyyq0vd9WNkULhAq2-F/view?usp=sharing)

---


## 🛠️ Setup and Installation

### **Prerequisites**
- Node.js (v18+)
- npm or yarn

### **Installation Steps**
```bash
# Clone the repository
git clone https://github.com/chaitanya-mutyala/-TALENTFLOW-A-MINI-HIRING-PLATFORM.git
cd "-TALENTFLOW-A-MINI-HIRING-PLATFORM"

# Install dependencies
#pip install -r requirements.txt (deleted requirements.txt due to vercel running it install following
#react-dom
#react-router-dom
#@tanstack/react-query
#dexie
#msw
#@dnd-kit
#tailwindcss)


# Start development server
npm run dev
```
Your app should now be running at **http://localhost:5173** 🚀

---

## ⚙️ Technical Decisions and Architecture

The application architecture emphasizes **robustness**, **testability**, and **offline-first reliability**.

| Component | Technology / Library | Rationale |
|------------|----------------------|------------|
| **Local Persistence** | Dexie.js (IndexedDB) | Chosen for its promise-based API over IndexedDB, providing atomic operations and local data persistence. |
| **API Simulation** | MSW (Mock Service Worker) | Simulates REST APIs, intercepting requests and providing IndexedDB data. Injects 200–1200 ms latency and 5–10% random write errors for realism. |
| **State Management** | TanStack Query (React Query) | Handles data fetching, caching, and optimistic updates with rollback for reordering operations. |
| **Drag & Drop** | @dnd-kit | Implements reordering and candidate Kanban transitions with modern DnD support. |
| **Data Handling** | react-window | Virtualized list for efficient rendering of 1,000+ candidate records. |

---

## 🧠 Core Feature Implementation Summary

### **A. Jobs Board**
- **List & Filtering** – Implements pagination, search, and tag-based filters.
- **CRUD Operations** – Add/Edit/Archive/Unarchive jobs via modal; validates unique slug and title.
- **Reordering with Rollback** – Drag-and-drop supported with optimistic updates and rollback on failure.
- **Deep Linking** – Supports navigation via `/jobs/:jobId`.

### **B. Candidates Flow**
- **Virtualized List** – Displays 1,000+ seeded candidates efficiently; supports search and stage-based filters.
- **Kanban Board** – Drag-and-drop transitions between stages: *applied → screen → offer → hired → rejected*.
- **Profile Route** – `/candidates/:id` shows full details and timeline.

### **C. Assessments Flow**
- **Assessment Builder** – Dual-pane system to create HR assessments with various question types (choice, text, numeric, file upload).
- **Persistence** – Stores both assessment structure and responses in Dexie (IndexedDB).
- **Form Runtime** – Enforces client-side validation (required fields, numeric ranges, max length).  

---

## 🧩 Technical Challenges and Resolutions

### **1. MSW/Dexie Synchronization (Race Condition)**
- **Issue:** MSW intercepted API calls before Dexie completed initialization, causing `TypeError: Cannot read properties of undefined (reading 'get')`.
- **Fix:** Introduced `ensureDbOpen()` helper with `await db.open()` at the start of every MSW handler (`jobHandlers.js`, `candidateHandlers.js`, and `assessmentHandlers.js`), ensuring database readiness before queries.

### **2. Dependency Compatibility**
- **Issue:** React 18 broke compatibility with `react-beautiful-dnd`.
- **Fix:** Replaced with the stable, performant **@dnd-kit** library for modern React versions.

---

## 🧰 Tech Stack Summary

- **Frontend:** React (Vite)
- **Local Database:** Dexie.js (IndexedDB)
- **Mock API Layer:** MSW
- **Data Fetching:** TanStack Query (React Query)
- **Drag & Drop:** @dnd-kit
- **Virtualized Rendering:** react-window
- **Styling:** Tailwind CSS

---

## 📂 Project Structure
-TALENTFLOW-A-MINI-HIRING-PLATFORM
┣ 📁 public/        # Static assets (logo, mockServiceWorker.js, etc.)
┣ 📁 src/
┃ ┣ 📁 api/         # Custom API logic (e.g., jobs.js)
┃ ┣ 📁 hooks/       # Custom React hooks
┃ ┣ 📁 components/  # Reusable UI components
┃ ┣ 📁 pages/       # Route-based pages
┃ ┣ 📁 mocks/       # MSW handlers & mock DB setup
┃ ┣ 📄 db.js        # Dexie database setup and seeding
┃ ┣ 📄 main.jsx     # App entry and mock initialization
┃ ┗ 📄 App.jsx      # Main app routes
┣ 📄 index.html
┣ 📄 package.json
┣ 📄 .gitignore
┗ 📄 README.md      # this file



---

## 🤝 Contribution

Contributions are welcome!  
Feel free to **fork** this repository and submit a **pull request** for new features, bug fixes, or improvements.

---

## 📜 License

This project is released under the **MIT License**.

---
✨ *Crafted with care as part of a React technical assignment to simulate a full hiring workflow for ENTNT.*
