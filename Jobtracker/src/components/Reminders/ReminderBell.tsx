import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import type { Job } from '../../types';

interface ReminderBellProps {
  dueJobs: Job[];
  onDismiss: (id: string) => void;
  onSnooze: (id: string) => void;
}

export default function ReminderBell({ dueJobs, onDismiss, onSnooze }: ReminderBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        id="reminder-bell-btn"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={`${dueJobs.length} reminders due`}
      >
        <Bell className={`w-5 h-5 ${dueJobs.length > 0 ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`} />
        {dueJobs.length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          >
            {dueJobs.length > 9 ? '9+' : dueJobs.length}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 w-80 z-50 card-base shadow-xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Follow-up Reminders
              </span>
              <span className="ml-auto text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                {dueJobs.length} due
              </span>
            </div>

            {dueJobs.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                All caught up! 🎉
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                {dueJobs.map((job) => (
                  <div key={job.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-750">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {job.company}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{job.role}</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                          Applied {format(parseISO(job.appliedAt), 'MMM d')}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => { onSnooze(job.id); }}
                          className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
                        >
                          Snooze 1d
                        </button>
                        <button
                          onClick={() => { onDismiss(job.id); }}
                          className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
