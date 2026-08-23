import { useMemo, useEffect, useCallback } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import type { Job } from '../types';
import { REMINDER_ELIGIBLE_STATUSES } from '../types';
import { fireNotification, requestNotificationPermission } from '../lib/notifications';

export function isDue(job: Job): boolean {
  if (!REMINDER_ELIGIBLE_STATUSES.includes(job.status)) return false;
  if (job.reminderDismissed) return false;
  const daysSince = differenceInDays(new Date(), parseISO(job.appliedAt));
  if (daysSince <= 3) return false;
  if (job.snoozedUntil) {
    const snoozeDate = parseISO(job.snoozedUntil);
    if (new Date() < snoozeDate) return false;
  }
  return true;
}

export function useReminders(
  jobs: Job[],
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>
) {
  const dueJobs = useMemo(() => jobs.filter(isDue), [jobs]);

  // Request permission + fire OS notification on mount and window focus
  const checkAndNotify = useCallback(async () => {
    if (dueJobs.length === 0) return;
    await requestNotificationPermission();
    const names = dueJobs
      .slice(0, 5)
      .map((j) => `${j.company} (${j.role})`)
      .join(', ');
    const extra = dueJobs.length > 5 ? ` +${dueJobs.length - 5} more` : '';
    fireNotification(
      `⏰ ${dueJobs.length} job${dueJobs.length > 1 ? 's' : ''} need follow-up`,
      names + extra
    );
  }, [dueJobs]);

  useEffect(() => {
    checkAndNotify();
    const handleFocus = () => checkAndNotify();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkAndNotify]);

  const dismissReminder = useCallback(
    async (id: string) => {
      await updateJob(id, { reminderDismissed: true }, 'Reminder dismissed');
    },
    [updateJob]
  );

  const snoozeReminder = useCallback(
    async (id: string) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await updateJob(id, { snoozedUntil: tomorrow.toISOString().split('T')[0] }, 'Reminder snoozed 1 day');
    },
    [updateJob]
  );

  return { dueJobs, dismissReminder, snoozeReminder };
}
