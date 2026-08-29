# 📋 Job Tracker —  Kanban Application

A modern, fast, and local-first Job Application Tracker built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**. Manage your job search pipeline across custom Kanban stages, track resume versions, get automated follow-up reminders, and analyze your interview/offer conversion rates—with 100% data privacy and offline IndexedDB persistence.

---

## ✨ Features

- 🎯 **Interactive Kanban Pipeline**: Drag-and-drop jobs seamlessly across 6 stages:
  - `Wishlist`, `Applied`, `Follow-up`, `Interview`, `Offer`, and `Rejected`.
- ⏰ **Smart Follow-Up Reminders**: Automatically detects applications that have been pending for more than 3 days without response. Includes snooze, dismiss, and optional browser desktop notifications.
- 📄 **Resume Version Management**: Tag applications with specific resume versions (e.g., `SDE_v3`, `FinTech_Resume`) to identify which version yields the best response rate.
- 📊 **Real-Time Analytics & Funnel Stats**: Live dashboard strip calculating total applications, active pipelines, interview rates, offer conversion rates, and rejection breakdowns.
- 🔍 **Instant Search & Multi-Filters**: Instant text search (`Ctrl+K` / `Cmd+K`), filter by status, filter by resume version, and sort by date.
- 💾 **Local-First & Offline IndexedDB Storage**: All application data, custom resumes, and settings are stored locally in your browser using IndexedDB—no external cloud dependencies.
- 📦 **Data Export & Import**: Backup your entire job application history and resume profiles into a standalone JSON file and restore anytime.
- 🌓 **Dark & Light Mode**: Seamless dark and light themes with persisted user preference.
- ⌨️ **Keyboard Shortcuts**:
  - `N`: Open "Add Job" modal
  - `Ctrl + K` / `Cmd + K`: Focus search bar
  - `Esc`: Close any open modal or dialog

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React 19** | Modern UI framework with React hooks and concurrent rendering |
| **TypeScript** | Type-safe development with strict checking |
| **Vite 8** | Ultra-fast bundling, HMR, and production builds |
| **Tailwind CSS v4** | Modern utility-first styling with `@tailwindcss/vite` |
| **@dnd-kit** | Accessible, performant drag-and-drop toolkit |
| **Framer Motion** | Fluid layout transitions and modal animations |
| **idb** | Lightweight Promise-based wrapper for IndexedDB |
| **date-fns** | Modular date formatting and duration calculations |
| **Lucide React** | Clean, modern iconography |
| **Oxlint** | High-performance Rust-based JavaScript/TypeScript linter |

---

## 🚀 Getting Started & Installation

### Prerequisites

Ensure you have **Node.js** (v18.0.0 or higher) and **npm** installed:

```bash
node -v
npm -v
```

### Installation Steps

1. **Clone the repository or navigate to the project root**:
   ```bash
   cd Task1
   ```

2. **Install all dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser to view the application with Hot Module Replacement (HMR).
   IT will open app with 5 Default enteries -- This is kept for testing purpose .

---

## 📦 Production Build & Deployment

### Build the Application

To compile TypeScript and create an optimized production bundle:

```bash
npm run build
```

This runs `tsc -b` for type-checking and `vite build` to output optimized static assets into the `dist/` directory.

### Preview the Production Build

To preview the built production app locally:

```bash
npm run preview
```
Open [http://localhost:4173](http://localhost:4173) to test the production build.

### Run Code Quality & Linting

To run Oxlint on all source files:

```bash
npm run lint
```

---

## 📁 Project Structure

```text
Task1/
├── dist/                      # Production build output
├── public/                    # Static assets & icons
├── src/
│   ├── components/
│   │   ├── Board/             # KanbanBoard, KanbanColumn, JobCard
│   │   ├── Dashboard/         # StatsStrip metrics & funnel breakdown
│   │   ├── Filters/           # FilterBar & search controls
│   │   ├── Modals/            # JobFormModal & DeleteConfirmModal
│   │   ├── Reminders/         # ReminderBell & notification popovers
│   │   └── Settings/          # ResumeManager dialog
│   ├── hooks/
│   │   ├── useJobs.ts         # Job state management & IDB operations
│   │   ├── useReminders.ts    # Follow-up detection & snooze logic
│   │   ├── useFilter.ts       # Filtering, searching, and sorting
│   │   └── useTheme.ts        # Dark/light theme persistence
│   ├── lib/
│   │   ├── db.ts              # IndexedDB database initialization & schema
│   │   └── notifications.ts   # Web Notification API wrapper
│   ├── types/
│   │   └── index.ts           # Job, KanbanStatus, and Resume types
│   ├── App.tsx                # Main application component
│   ├── index.css              # Global styles & Tailwind theme tokens
│   └── main.tsx               # Application entry point
├── package.json               # Project dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── vite.config.ts             # Vite configuration with React & Tailwind plugins
```

---

