import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence } from 'framer-motion';
import type { Job, KanbanStatus } from '../../types';
import JobCard from './JobCard';

interface KanbanColumnProps {
  status: KanbanStatus;
  label: string;
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
  onDismissReminder: (id: string) => void;
  onSnoozeReminder: (id: string) => void;
}

const COLUMN_STYLES: Record<KanbanStatus, { header: string; badge: string; dot: string }> = {
  wishlist:  { header: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300', dot: 'bg-purple-400' },
  applied:   { header: 'text-blue-600 dark:text-blue-400',   badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',     dot: 'bg-blue-400'   },
  followup:  { header: 'text-yellow-600 dark:text-yellow-400', badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-400' },
  interview: { header: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300', dot: 'bg-orange-400' },
  offer:     { header: 'text-green-600 dark:text-green-400',  badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',   dot: 'bg-green-400'  },
  rejected:  { header: 'text-red-600 dark:text-red-400',     badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',           dot: 'bg-red-400'    },
};

export default function KanbanColumn({
  status, label, jobs,
  onEdit, onDelete, onDismissReminder, onSnoozeReminder,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const style = COLUMN_STYLES[status];

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
        <h2 className={`text-sm font-bold uppercase tracking-wider ${style.header}`}>
          {label}
        </h2>
        <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
          {jobs.length}
        </span>
      </div>

      {/* Card list */}
      <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          id={`column-${status}`}
          className={`
            flex-1 min-h-[200px] flex flex-col gap-2.5 p-2 rounded-xl transition-colors
            ${isOver
              ? 'bg-indigo-50/70 dark:bg-indigo-950/30 ring-2 ring-indigo-300 dark:ring-indigo-700'
              : 'bg-gray-100/60 dark:bg-gray-800/40'
            }
            overflow-y-auto max-h-[calc(100vh-200px)]
          `}
        >
          <AnimatePresence>
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onEdit={onEdit}
                onDelete={onDelete}
                onDismissReminder={onDismissReminder}
                onSnoozeReminder={onSnoozeReminder}
              />
            ))}
          </AnimatePresence>

          {jobs.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-6">
                Drop cards here
              </p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
