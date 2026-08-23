import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Moon, Sun, Download, Upload, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useJobs } from './hooks/useJobs';
import { useReminders } from './hooks/useReminders';
import { useTheme } from './hooks/useTheme';
import { DEFAULT_FILTER } from './hooks/useFilter';
import type { FilterState } from './hooks/useFilter';
import { getAllResumes } from './lib/db';
import type { Job, ResumeEntry, KanbanStatus } from './types';
import KanbanBoard from './components/Board/KanbanBoard';
import JobFormModal from './components/Modals/JobFormModal';
import DeleteConfirmModal from './components/Modals/DeleteConfirmModal';
import ReminderBell from './components/Reminders/ReminderBell';
import FilterBar from './components/Filters/FilterBar';
import StatsStrip from './components/Dashboard/StatsStrip';
import ResumeManager from './components/Settings/ResumeManager';

export default function App() {
  const { jobs, loading, addJob, updateJob, deleteJob, moveJob, reorderWithinColumn, importJobs } = useJobs();
  const { dueJobs, dismissReminder, snoozeReminder } = useReminders(jobs, updateJob);
  const { dark, toggleTheme } = useTheme();

  const [modalOpen, setModalOpen] = useState(false);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [resumeManagerOpen, setResumeManagerOpen] = useState(false);
  const [resumes, setResumes] = useState<ResumeEntry[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load resumes
  const loadResumes = useCallback(() => {
    getAllResumes().then(setResumes);
  }, []);
  useEffect(() => { loadResumes(); }, [loadResumes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (e.key === 'n' && !isInput && !modalOpen) {
        setEditJob(null);
        setModalOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('filter-search')?.focus();
      }
      if (e.key === 'Escape') {
        setModalOpen(false);
        setDeleteTarget(null);
        setResumeManagerOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen]);

  // Save handler
  const handleSave = useCallback(
    async (data: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'activityLog' | 'columnOrder' | 'reminderDismissed'>) => {
      if (editJob) {
        const note = editJob.status !== data.status
          ? `Status changed: ${editJob.status} → ${data.status}`
          : 'Job updated';
        await updateJob(editJob.id, { ...data }, note);
      } else {
        await addJob(data);
      }
      setModalOpen(false);
      setEditJob(null);
    },
    [editJob, addJob, updateJob]
  );

  // Export
  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ jobs, resumes, exportedAt: new Date().toISOString() }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (Array.isArray(parsed.jobs)) {
          await importJobs(parsed.jobs as Job[]);
        }
      } catch {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2 mr-4">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">JT</span>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 hidden sm:block">
              Job Tracker
            </span>
          </div>

          {/* Filter bar */}
          <div className="flex-1 min-w-0">
            <FilterBar
              filters={filters}
              onChange={(partial) => setFilters((f) => ({ ...f, ...partial }))}
              resumes={resumes}
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-2 shrink-0">
            <ReminderBell
              dueJobs={dueJobs}
              onDismiss={dismissReminder}
              onSnooze={snoozeReminder}
            />

            {/* Resume manager */}
            <button
              id="btn-resumes"
              title="Manage Resumes"
              onClick={() => setResumeManagerOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>

            {/* Export */}
            <button
              id="btn-export"
              title="Export JSON"
              onClick={handleExport}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Download className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>

            {/* Import */}
            <label title="Import JSON" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <Upload className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input id="btn-import" type="file" accept=".json" className="sr-only" onChange={handleImport} />
            </label>

            {/* Dark mode */}
            <button
              id="btn-theme"
              title="Toggle dark mode"
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {dark
                ? <Sun className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              }
            </button>

            {/* Add job */}
            <button
              id="btn-add-job"
              onClick={() => { setEditJob(null); setModalOpen(true); }}
              className="btn-primary flex items-center gap-1.5 ml-1"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Job</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 pt-4 pb-2 flex flex-col min-h-0">
        {/* Stats strip */}
        <StatsStrip jobs={jobs} />

        {/* Board */}
        <div className="flex-1 min-h-0">
          <KanbanBoard
            jobs={jobs}
            searchQuery={filters.search}
            sortOrder={filters.sort}
            onEdit={(job) => { setEditJob(job); setModalOpen(true); }}
            onDelete={(job) => setDeleteTarget(job)}
            onMove={moveJob}
            onReorder={reorderWithinColumn}
            onDismissReminder={dismissReminder}
            onSnoozeReminder={snoozeReminder}
          />
        </div>
      </main>

      {/* Modals */}
      <JobFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditJob(null); }}
        onSave={handleSave}
        editJob={editJob}
        resumes={resumes}
      />

      <DeleteConfirmModal
        job={deleteTarget}
        onConfirm={async () => {
          if (deleteTarget) await deleteJob(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <ResumeManager
        open={resumeManagerOpen}
        onClose={() => setResumeManagerOpen(false)}
        onUpdate={loadResumes}
      />
    </div>
  );
}
