import { useMemo } from 'react';
import type { Job, KanbanStatus } from '../types';

export type FilterState = {
  search: string;
  statusFilter: KanbanStatus | 'all';
  resumeFilter: string;
  sort: 'newest' | 'oldest';
};

export const DEFAULT_FILTER: FilterState = {
  search: '',
  statusFilter: 'all',
  resumeFilter: '',
  sort: 'newest',
};

export function useFilter(jobs: Job[], filters: FilterState) {
  return useMemo(() => {
    let result = [...jobs];

    // Text search
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (j) =>
          j.company.toLowerCase().includes(q) ||
          j.role.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filters.statusFilter !== 'all') {
      result = result.filter((j) => j.status === filters.statusFilter);
    }

    // Resume filter
    if (filters.resumeFilter) {
      result = result.filter((j) => j.resumeUsed === filters.resumeFilter);
    }

    // Sort
    result.sort((a, b) => {
      const diff = new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
      return filters.sort === 'newest' ? -diff : diff;
    });

    return result;
  }, [jobs, filters]);
}

export function getJobsByStatus(jobs: Job[], status: KanbanStatus, sort: 'newest' | 'oldest' = 'newest') {
  const filtered = jobs.filter((j) => j.status === status);
  filtered.sort((a, b) => {
    // First sort by columnOrder, then by date as tiebreaker
    const orderDiff = a.columnOrder - b.columnOrder;
    if (orderDiff !== 0) return orderDiff;
    const diff = new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
    return sort === 'newest' ? -diff : diff;
  });
  return filtered;
}
