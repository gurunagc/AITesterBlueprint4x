import React from 'react';
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import type { KanbanStatus, ResumeEntry } from '../../types';
import { KANBAN_COLUMNS } from '../../types';
import type { FilterState } from '../../hooks/useFilter';

interface FilterBarProps {
  filters: FilterState;
  onChange: (f: Partial<FilterState>) => void;
  resumes: ResumeEntry[];
}

export default function FilterBar({ filters, onChange, resumes }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          id="filter-search"
          type="text"
          className="input-base pl-9 py-1.5 text-xs"
          placeholder="Search company or role… (Ctrl+K)"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1.5">
        <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
        <select
          id="filter-status"
          className="input-base py-1.5 text-xs w-auto pr-7"
          value={filters.statusFilter}
          onChange={(e) => onChange({ statusFilter: e.target.value as KanbanStatus | 'all' })}
        >
          <option value="all">All Statuses</option>
          {KANBAN_COLUMNS.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Resume filter */}
      {resumes.length > 0 && (
        <select
          id="filter-resume"
          className="input-base py-1.5 text-xs w-auto pr-7"
          value={filters.resumeFilter}
          onChange={(e) => onChange({ resumeFilter: e.target.value })}
        >
          <option value="">All Resumes</option>
          {resumes.map((r) => (
            <option key={r.id} value={r.name}>{r.name}</option>
          ))}
        </select>
      )}

      {/* Sort */}
      <button
        id="filter-sort"
        onClick={() => onChange({ sort: filters.sort === 'newest' ? 'oldest' : 'newest' })}
        className="flex items-center gap-1.5 btn-ghost text-xs py-1.5"
        title="Toggle sort order"
      >
        <ArrowUpDown className="w-3.5 h-3.5" />
        {filters.sort === 'newest' ? 'Newest first' : 'Oldest first'}
      </button>
    </div>
  );
}
