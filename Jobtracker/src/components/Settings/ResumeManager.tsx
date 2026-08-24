import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, FileText } from 'lucide-react';
import type { ResumeEntry } from '../../types';
import { getAllResumes, putResume, deleteResume } from '../../lib/db';

interface ResumeManagerProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ResumeManager({ open, onClose, onUpdate }: ResumeManagerProps) {
  const [resumes, setResumes] = useState<ResumeEntry[]>([]);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (open) getAllResumes().then(setResumes);
  }, [open]);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const entry: ResumeEntry = { id: crypto.randomUUID(), name: trimmed };
    await putResume(entry);
    setResumes((prev) => [...prev, entry]);
    setNewName('');
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    await deleteResume(id);
    setResumes((prev) => prev.filter((r) => r.id !== id));
    onUpdate();
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onClose={onClose} className="relative z-50">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 28, stiffness: 400 }}
              className="w-full max-w-sm"
            >
              <Dialog.Panel className="card-base shadow-xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <Dialog.Title className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Manage Resumes
                  </Dialog.Title>
                  <button onClick={onClose} className="ml-auto p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className="px-5 py-4 space-y-3 max-h-72 overflow-y-auto">
                  {resumes.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">No resumes saved yet.</p>
                  )}
                  {resumes.map((r) => (
                    <div key={r.id} className="flex items-center gap-2 group">
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{r.name}</span>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="px-5 pb-4">
                  <div className="flex gap-2">
                    <input
                      id="resume-name-input"
                      className="input-base flex-1"
                      placeholder="e.g. SDE_Resume_v3"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <button
                      id="btn-add-resume"
                      onClick={handleAdd}
                      className="btn-primary px-3"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
