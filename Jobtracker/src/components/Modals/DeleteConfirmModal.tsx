import React from 'react';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import type { Job } from '../../types';

interface DeleteConfirmModalProps {
  job: Job | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ job, onConfirm, onCancel }: DeleteConfirmModalProps) {
  if (!job) return null;
  return (
    <AnimatePresence>
      {job && (
        <Dialog open={!!job} onClose={onCancel} className="relative z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 28, stiffness: 500 }}
            >
              <Dialog.Panel className="card-base shadow-xl p-6 w-full max-w-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Delete Job?
                    </Dialog.Title>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      This cannot be undone.
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
                  Remove <strong>{job.company}</strong> — {job.role}?
                </p>
                <div className="flex gap-3 justify-end">
                  <button id="btn-cancel-delete" onClick={onCancel} className="btn-ghost">Cancel</button>
                  <button id="btn-confirm-delete" onClick={onConfirm} className="btn-danger">Delete</button>
                </div>
              </Dialog.Panel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
