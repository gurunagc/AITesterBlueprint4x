import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Job, ResumeEntry } from '../types';

interface SettingsEntry {
  key: string;
  value: string;
}

interface JobTrackerDB extends DBSchema {
  jobs: {
    key: string;
    value: Job;
    indexes: {
      'by-status': string;
      'by-appliedAt': string;
      'by-company': string;
    };
  };
  resumes: {
    key: string;
    value: ResumeEntry;
  };
  settings: {
    key: string;
    value: SettingsEntry;
  };
}

let dbPromise: Promise<IDBPDatabase<JobTrackerDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<JobTrackerDB>('job-tracker-db', 2, {
      upgrade(db) {
        // Jobs store
        if (!db.objectStoreNames.contains('jobs')) {
          const jobStore = db.createObjectStore('jobs', { keyPath: 'id' });
          jobStore.createIndex('by-status', 'status');
          jobStore.createIndex('by-appliedAt', 'appliedAt');
          jobStore.createIndex('by-company', 'company');
        }
        // Resumes store
        if (!db.objectStoreNames.contains('resumes')) {
          db.createObjectStore('resumes', { keyPath: 'id' });
        }
        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

// ── Jobs ──────────────────────────────────────────────────────────────────────
export async function getAllJobs(): Promise<Job[]> {
  const db = await getDB();
  return db.getAll('jobs');
}

export async function putJob(job: Job): Promise<void> {
  const db = await getDB();
  await db.put('jobs', job);
}

export async function deleteJob(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('jobs', id);
}

export async function clearAllJobs(): Promise<void> {
  const db = await getDB();
  await db.clear('jobs');
}

// ── Resumes ───────────────────────────────────────────────────────────────────
export async function getAllResumes(): Promise<ResumeEntry[]> {
  const db = await getDB();
  return db.getAll('resumes');
}

export async function putResume(resume: ResumeEntry): Promise<void> {
  const db = await getDB();
  await db.put('resumes', resume);
}

export async function deleteResume(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('resumes', id);
}

// ── Settings ──────────────────────────────────────────────────────────────────
export async function getSetting(key: string): Promise<string | undefined> {
  const db = await getDB();
  const entry = await db.get('settings', key);
  return entry?.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key, value });
}
