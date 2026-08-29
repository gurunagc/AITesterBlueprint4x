import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useState } from 'react';
import type { Job, KanbanStatus } from '../../types';
import { KANBAN_COLUMNS } from '../../types';
import KanbanColumn from './KanbanColumn';
import JobCard from './JobCard';
import { getJobsByStatus } from '../../hooks/useFilter';

interface KanbanBoardProps {
  jobs: Job[];
  searchQuery: string;
  sortOrder: 'newest' | 'oldest';
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
  onMove: (id: string, newStatus: KanbanStatus) => void;
  onReorder: (id: string, newOrder: number) => void;
  onDismissReminder: (id: string) => void;
  onSnoozeReminder: (id: string) => void;
}

export default function KanbanBoard({
  jobs, searchQuery, sortOrder,
  onEdit, onDelete, onMove, onReorder,
  onDismissReminder, onSnoozeReminder,
}: KanbanBoardProps) {
  const [activeJob, setActiveJob] = useState<Job | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Filter jobs by search query
  const filteredJobs = searchQuery.trim()
    ? jobs.filter(
        (j) =>
          j.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          j.role.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : jobs;

  function handleDragStart(event: DragStartEvent) {
    const job = jobs.find((j) => j.id === event.active.id);
    if (job) setActiveJob(job);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveJob(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeJob = jobs.find((j) => j.id === activeId);
    if (!activeJob) return;

    // Check if dropped over a column (status) or another card
    const isColumn = KANBAN_COLUMNS.some((c) => c.id === overId);

    if (isColumn) {
      // Moved to a new column
      if (activeJob.status !== overId) {
        onMove(activeId, overId as KanbanStatus);
      }
    } else {
      // Dropped over another card
      const overJob = jobs.find((j) => j.id === overId);
      if (!overJob) return;

      if (activeJob.status !== overJob.status) {
        // Cross-column move
        onMove(activeId, overJob.status);
      } else {
        // Same-column reorder
        const colJobs = getJobsByStatus(jobs, activeJob.status, sortOrder);
        const oldIdx = colJobs.findIndex((j) => j.id === activeId);
        const newIdx = colJobs.findIndex((j) => j.id === overId);
        if (oldIdx !== newIdx) {
          const reordered = arrayMove(colJobs, oldIdx, newIdx);
          reordered.forEach((j, idx) => onReorder(j.id, idx));
        }
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-5 overflow-x-auto pb-6 pt-2 px-1 min-h-full">
        {KANBAN_COLUMNS.map(({ id, label }) => {
          const colJobs = getJobsByStatus(filteredJobs, id, sortOrder);
          return (
            <KanbanColumn
              key={id}
              status={id}
              label={label}
              jobs={colJobs}
              onEdit={onEdit}
              onDelete={onDelete}
              onDismissReminder={onDismissReminder}
              onSnoozeReminder={onSnoozeReminder}
            />
          );
        })}
      </div>

      {/* Drag overlay — ghost card while dragging */}
      <DragOverlay>
        {activeJob && (
          <div className="rotate-2 opacity-90">
            <JobCard
              job={activeJob}
              onEdit={() => {}}
              onDelete={() => {}}
              onDismissReminder={() => {}}
              onSnoozeReminder={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
