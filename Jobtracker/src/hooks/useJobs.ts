import { useState, useEffect, useCallback } from 'react';
import type { Job, KanbanStatus, ActivityEntry } from '../types';
import { REMINDER_ELIGIBLE_STATUSES } from '../types';
import { getAllJobs, putJob, deleteJob as dbDeleteJob } from '../lib/db';

// ── Seed data — Job 1 to Job 5 ───────────────────────────────────────────────
function makeSeedJobs(): Job[] {
  const now = new Date();
  const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  };
  const ts = now.toISOString();

  return [
    {
      id: 'seed-job-1',
      company: 'Google',
      role: 'Senior Software Engineer',
      linkedInUrl: 'https://linkedin.com/jobs/view/111111',
      resumeUsed: 'SDE_v3',
      appliedAt: daysAgo(1),
      salaryRange: '$180–220K',
      notes: 'Referred by Jane Doe in the Cloud team.',
      status: 'wishlist',
      columnOrder: 0,
      activityLog: [{ timestamp: ts, action: 'Job added with status: wishlist' }],
      reminderDismissed: false,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'seed-job-2',
      company: 'Meta',
      role: 'Staff Engineer — Infrastructure',
      linkedInUrl: 'https://linkedin.com/jobs/view/222222',
      resumeUsed: 'SDE_v3',
      appliedAt: daysAgo(5),   // >3 days → reminder will fire
      salaryRange: '$200–240K',
      notes: 'Applied via recruiter outreach. Contact: alex@meta.com',
      status: 'applied',
      columnOrder: 0,
      activityLog: [{ timestamp: ts, action: 'Job added with status: applied' }],
      reminderDismissed: false,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'seed-job-3',
      company: 'Stripe',
      role: 'Backend Engineer — Payments',
      linkedInUrl: 'https://linkedin.com/jobs/view/333333',
      resumeUsed: 'FinTech_Resume',
      appliedAt: daysAgo(4),   // >3 days → reminder will fire
      salaryRange: '$160–195K',
      notes: 'Technical screen scheduled. Ask about team structure.',
      status: 'interview',
      columnOrder: 0,
      activityLog: [{ timestamp: ts, action: 'Job added with status: interview' }],
      reminderDismissed: false,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'seed-job-4',
      company: 'Vercel',
      role: 'Developer Experience Engineer',
      linkedInUrl: 'https://linkedin.com/jobs/view/444444',
      resumeUsed: 'SDE_v3',
      appliedAt: daysAgo(2),
      salaryRange: '$140–170K',
      notes: 'Remote-first. Great OSS culture.',
      status: 'followup',
      columnOrder: 0,
      activityLog: [{ timestamp: ts, action: 'Job added with status: followup' }],
      reminderDismissed: false,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'seed-job-5',
      company: 'Figma',
      role: 'Product Engineer',
      linkedInUrl: 'https://linkedin.com/jobs/view/555555',
      resumeUsed: 'ProductEng_Resume',
      appliedAt: daysAgo(10),
      salaryRange: '₹50–60 LPA',
      notes: 'Final round done. Waiting for offer letter.',
      status: 'offer',
      columnOrder: 0,
      activityLog: [{ timestamp: ts, action: 'Job added with status: offer' }],
      reminderDismissed: false,
      createdAt: ts,
      updatedAt: ts,
    },
  ];
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all jobs from IDB on mount; seed if empty
  useEffect(() => {
    getAllJobs().then(async (data) => {
      if (data.length === 0) {
        const seeds = makeSeedJobs();
        for (const job of seeds) {
          await putJob(job);
        }
        setJobs(seeds);
      } else {
        setJobs(data);
      }
      setLoading(false);
    });
  }, []);

  const addJob = useCallback(
    async (
      jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'activityLog' | 'columnOrder' | 'reminderDismissed'>
    ) => {
      const now = new Date().toISOString();
      const existingInColumn = jobs.filter((j) => j.status === jobData.status);
      const maxOrder =
        existingInColumn.length > 0
          ? Math.max(...existingInColumn.map((j) => j.columnOrder))
          : -1;

      const newJob: Job = {
        ...jobData,
        id: crypto.randomUUID(),
        columnOrder: maxOrder + 1,
        activityLog: [{ timestamp: now, action: `Job added with status: ${jobData.status}` }],
        reminderDismissed: false,
        createdAt: now,
        updatedAt: now,
      };
      await putJob(newJob);
      setJobs((prev) => [...prev, newJob]);
      return newJob;
    },
    [jobs]
  );

  const updateJob = useCallback(
    async (id: string, updates: Partial<Job>, activityNote?: string) => {
      const now = new Date().toISOString();
      setJobs((prev) => {
        const updated = prev.map((j) => {
          if (j.id !== id) return j;
          const newLog: ActivityEntry[] = activityNote
            ? [...j.activityLog, { timestamp: now, action: activityNote }]
            : j.activityLog;
          const updatedJob: Job = { ...j, ...updates, activityLog: newLog, updatedAt: now };
          putJob(updatedJob); // fire-and-forget persist
          return updatedJob;
        });
        return updated;
      });
    },
    []
  );

  const deleteJob = useCallback(async (id: string) => {
    await dbDeleteJob(id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const moveJob = useCallback(
    async (id: string, newStatus: KanbanStatus) => {
      const job = jobs.find((j) => j.id === id);
      if (!job || job.status === newStatus) return;
      const oldStatus = job.status;
      const note = `Status changed: ${capitalize(oldStatus)} → ${capitalize(newStatus)}`;
      const inNewCol = jobs.filter((j) => j.status === newStatus);
      const newOrder = inNewCol.length;
      await updateJob(id, { status: newStatus, columnOrder: newOrder }, note);
    },
    [jobs, updateJob]
  );

  const reorderWithinColumn = useCallback(
    async (id: string, newOrder: number) => {
      await updateJob(id, { columnOrder: newOrder });
    },
    [updateJob]
  );

  const importJobs = useCallback(async (importedJobs: Job[]) => {
    const { clearAllJobs } = await import('../lib/db');
    await clearAllJobs();
    for (const job of importedJobs) {
      await putJob(job);
    }
    setJobs(importedJobs);
  }, []);

  return { jobs, loading, addJob, updateJob, deleteJob, moveJob, reorderWithinColumn, importJobs };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
