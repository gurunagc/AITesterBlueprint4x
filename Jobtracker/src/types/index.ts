// Runtime values — safe to import normally
export const KANBAN_COLUMNS: { id: KanbanStatus; label: string; color: string }[] = [
  { id: 'wishlist',  label: 'Wishlist',   color: '#6366f1' },
  { id: 'applied',   label: 'Applied',    color: '#3b82f6' },
  { id: 'followup',  label: 'Follow-up',  color: '#f59e0b' },
  { id: 'interview', label: 'Interview',  color: '#8b5cf6' },
  { id: 'offer',     label: 'Offer',      color: '#10b981' },
  { id: 'rejected',  label: 'Rejected',   color: '#ef4444' },
];

export const REMINDER_ELIGIBLE_STATUSES: KanbanStatus[] = ['applied', 'followup', 'interview'];

// ── Type aliases (erased at runtime) ─────────────────────────────────────────

export type KanbanStatus =
  | 'wishlist'
  | 'applied'
  | 'followup'
  | 'interview'
  | 'offer'
  | 'rejected';

export type ActivityEntry = {
  timestamp: string;
  action: string;
};

export type Job = {
  id: string;
  company: string;
  role: string;
  linkedInUrl?: string;
  resumeUsed?: string;
  appliedAt: string;       // ISO date string
  salaryRange?: string;
  notes?: string;
  status: KanbanStatus;
  columnOrder: number;
  activityLog: ActivityEntry[];
  reminderDismissed: boolean;
  snoozedUntil?: string;   // ISO date — suppress until this date passes
  createdAt: string;
  updatedAt: string;
};

export type ResumeEntry = {
  id: string;
  name: string;
};
