import { useState } from 'react';
import type { FormEvent } from 'react';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Job, KanbanStatus, ResumeEntry } from '../../types';
import { KANBAN_COLUMNS } from '../../types';
import { format } from 'date-fns';

interface JobFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'activityLog' | 'columnOrder' | 'reminderDismissed'>) => void;
  editJob?: Job | null;
  resumes: ResumeEntry[];
}

const EMPTY_FORM = {
  company: '',
  role: '',
  linkedInUrl: '',
  resumeUsed: '',
  appliedAt: format(new Date(), 'yyyy-MM-dd'),
  salaryRange: '',
  notes: '',
  status: 'wishlist' as KanbanStatus,
  snoozedUntil: undefined as string | undefined,
};

function JobFormContent({
  editJob,
  resumes,
  onClose,
  onSave,
}: {
  editJob?: Job | null;
  resumes: ResumeEntry[];
  onClose: () => void;
  onSave: (data: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'activityLog' | 'columnOrder' | 'reminderDismissed'>) => void;
}) {
  const [form, setForm] = useState(() => {
    if (editJob) {
      return {
        company: editJob.company,
        role: editJob.role,
        linkedInUrl: editJob.linkedInUrl ?? '',
        resumeUsed: editJob.resumeUsed ?? '',
        appliedAt: editJob.appliedAt,
        salaryRange: editJob.salaryRange ?? '',
        notes: editJob.notes ?? '',
        status: editJob.status,
        snoozedUntil: editJob.snoozedUntil,
      };
    }
    return { ...EMPTY_FORM, appliedAt: format(new Date(), 'yyyy-MM-dd') };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customResume, setCustomResume] = useState('');

  const set = (key: keyof typeof form, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.company.trim()) e.company = 'Company name is required';
    if (!form.role.trim()) e.role = 'Job title is required';
    return e;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const resumeUsed = form.resumeUsed === '__custom__' ? customResume.trim() : form.resumeUsed;

    onSave({
      company: form.company.trim(),
      role: form.role.trim(),
      linkedInUrl: form.linkedInUrl.trim() || undefined,
      resumeUsed: resumeUsed || undefined,
      appliedAt: form.appliedAt,
      salaryRange: form.status === 'offer' ? undefined : (form.salaryRange.trim() || undefined),
      notes: form.notes.trim() || undefined,
      status: form.status,
      snoozedUntil: form.snoozedUntil,
    });
    onClose();
  };

  return (
    <Dialog.Panel className="card-base shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {editJob ? 'Edit Job' : 'Add New Job'}
        </Dialog.Title>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          {/* Company */}
          <div className="col-span-2 sm:col-span-1">
            <label className="label-base">Company *</label>
            <input
              id="field-company"
              className={`input-base ${errors.company ? 'border-red-400 ring-1 ring-red-400' : ''}`}
              placeholder="e.g. Google"
              value={form.company}
              onChange={(e) => set('company', e.target.value)}
              autoFocus
            />
            {errors.company && <p className="text-xs text-red-500 mt-1">{errors.company}</p>}
          </div>

          {/* Role */}
          <div className="col-span-2 sm:col-span-1">
            <label className="label-base">Job Title *</label>
            <input
              id="field-role"
              className={`input-base ${errors.role ? 'border-red-400 ring-1 ring-red-400' : ''}`}
              placeholder="e.g. Senior SDE"
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
            />
            {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
          </div>

          {/* Status */}
          <div className="col-span-2 sm:col-span-1">
            <label className="label-base">Status</label>
            <select
              id="field-status"
              className="input-base"
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
            >
              {KANBAN_COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Applied At */}
          <div className="col-span-2 sm:col-span-1">
            <label className="label-base">Date Applied</label>
            <input
              id="field-appliedAt"
              type="date"
              className="input-base"
              value={form.appliedAt}
              onChange={(e) => set('appliedAt', e.target.value)}
            />
          </div>

          {/* LinkedIn URL */}
          <div className="col-span-2">
            <label className="label-base">LinkedIn Job URL</label>
            <input
              id="field-linkedin"
              type="url"
              className="input-base"
              placeholder="https://linkedin.com/jobs/..."
              value={form.linkedInUrl}
              onChange={(e) => set('linkedInUrl', e.target.value)}
            />
          </div>

          {/* Resume */}
          <div className="col-span-2 sm:col-span-1">
            <label className="label-base">Resume Used</label>
            <select
              id="field-resume"
              className="input-base"
              value={form.resumeUsed}
              onChange={(e) => set('resumeUsed', e.target.value)}
            >
              <option value="">— None —</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
              <option value="__custom__">+ Type a new name…</option>
            </select>
            {form.resumeUsed === '__custom__' && (
              <input
                className="input-base mt-2"
                placeholder="e.g. SDE_Resume_v3"
                value={customResume}
                onChange={(e) => setCustomResume(e.target.value)}
              />
            )}
          </div>

          {/* Salary / Package (not applicable when offer accepted) */}
          {form.status !== 'offer' && (
            <div className="col-span-2 sm:col-span-1">
              <label className="label-base">Salary Range</label>
              <input
                id="field-salary"
                className="input-base"
                placeholder="e.g. ₹25-30 LPA or $150K"
                value={form.salaryRange}
                onChange={(e) => set('salaryRange', e.target.value)}
              />
            </div>
          )}

          {/* Notes */}
          <div className="col-span-2">
            <label className="label-base">Notes</label>
            <textarea
              id="field-notes"
              className="input-base resize-none"
              rows={3}
              placeholder="Recruiter name, referral info, interview rounds…"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
        </div>
      </form>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <button type="button" onClick={onClose} className="btn-ghost">
          Cancel
        </button>
        <button
          id="btn-save-job"
          type="submit"
          onClick={handleSubmit}
          className="btn-primary"
        >
          {editJob ? 'Save Changes' : 'Add Job'}
        </button>
      </div>
    </Dialog.Panel>
  );
}

export default function JobFormModal({ open, onClose, onSave, editJob, resumes }: JobFormModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onClose={onClose} className="relative z-50">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          <div className="fixed inset-0 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 28, stiffness: 400 }}
              className="w-full max-w-lg"
            >
              <JobFormContent
                key={editJob ? editJob.id : 'new-job'}
                editJob={editJob}
                resumes={resumes}
                onClose={onClose}
                onSave={onSave}
              />
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
