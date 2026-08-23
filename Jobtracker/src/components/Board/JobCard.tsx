import React from 'react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ExternalLink, Pencil, Trash2, Bell, BellOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Job, KanbanStatus } from '../../types';
import { isDue } from '../../hooks/useReminders';

interface JobCardProps {
  job: Job;
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
  onDismissReminder: (id: string) => void;
  onSnoozeReminder: (id: string) => void;
  isFiltered?: boolean;
}

const STATUS_BORDER: Record<KanbanStatus, string> = {
  wishlist: 'border-l-purple-400',
  applied: 'border-l-blue-400',
  followup: 'border-l-yellow-400',
  interview: 'border-l-orange-400',
  offer: 'border-l-green-400',
  rejected: 'border-l-red-400',
};

export default function JobCard({ job, onEdit, onDelete, onDismissReminder, onSnoozeReminder }: JobCardProps) {
  const due = isDue(job);
  const daysSince = differenceInDays(new Date(), parseISO(job.appliedAt));

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const borderClass = due
    ? 'border-l-amber-400'
    : STATUS_BORDER[job.status];

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      layout
      className={`
        card-base border-l-4 ${borderClass} p-3.5 cursor-grab active:cursor-grabbing
        hover:shadow-md transition-shadow group relative select-none
        ${due ? 'ring-1 ring-amber-300 dark:ring-amber-700' : ''}
      `}
      id={`job-card-${job.id}`}
    >
      {/* Reminder pulse overlay */}
      {due && (
        <div className="absolute inset-0 rounded-xl pointer-events-none border-2 border-amber-400/50 animate-pulse" />
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight truncate">
            {job.company}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{job.role}</p>
        </div>

        {/* Action buttons — visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pointer-events-none group-hover:pointer-events-auto">
          {due && (
            <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
              <button
                title="Snooze reminder 1 day"
                onClick={() => onSnoozeReminder(job.id)}
                className="p-1 rounded hover:bg-amber-50 dark:hover:bg-amber-900/30 text-amber-500"
              >
                <Bell className="w-3.5 h-3.5" />
              </button>
              <button
                title="Dismiss reminder"
                onClick={() => onDismissReminder(job.id)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
              >
                <BellOff className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <button
            title="Edit job"
            onClick={(e) => { e.stopPropagation(); onEdit(job); }}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-500"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            title="Delete job"
            onClick={(e) => { e.stopPropagation(); onDelete(job); }}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tags row */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {/* Days since applied */}
        <span className={`
          text-xs px-2 py-0.5 rounded-full font-medium
          ${due
            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          }
        `}>
          {daysSince === 0 ? 'Today' : `${daysSince}d ago`}
          {due && ' ⏰'}
        </span>

        {/* Resume tag */}
        {job.resumeUsed && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-[120px]">
            {job.resumeUsed}
          </span>
        )}

        {/* Salary */}
        {job.salaryRange && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-medium">
            {job.salaryRange}
          </span>
        )}
      </div>

      {/* LinkedIn link */}
      {job.linkedInUrl && (
        <a
          href={job.linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 mt-2 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          LinkedIn
        </a>
      )}

      {/* Applied date */}
      <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-2">
        Applied {format(parseISO(job.appliedAt), 'MMM d, yyyy')}
      </p>
    </motion.div>
  );
}
