import { Briefcase, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import type { Job } from '../../types';
import { KANBAN_COLUMNS } from '../../types';

interface StatsStripProps {
  jobs: Job[];
}

export default function StatsStrip({ jobs }: StatsStripProps) {
  const total = jobs.length;
  const applied = jobs.filter((j) => j.status === 'applied').length;
  const interviews = jobs.filter((j) => j.status === 'interview').length;
  const offers = jobs.filter((j) => j.status === 'offer').length;
  const rejected = jobs.filter((j) => j.status === 'rejected').length;
  const active = jobs.filter((j) => !['offer', 'rejected'].includes(j.status)).length;

  const interviewRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0;
  const offerRate = interviews > 0 ? Math.round((offers / interviews) * 100) : 0;

  const stats = [
    { label: 'Total Jobs', value: total, icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
    { label: 'Active', value: active, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Interview Rate', value: `${interviewRate}%`, icon: CheckCircle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/30' },
    { label: 'Offer Rate', value: `${offerRate}%`, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/30' },
    { label: 'Rejected', value: rejected, icon: XCircle, color: 'text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
  ];

  // Column breakdown for funnel bar
  const colCounts = KANBAN_COLUMNS.map((c) => ({
    ...c,
    count: jobs.filter((j) => j.status === c.id).length,
  }));

  return (
    <div className="card-base px-4 py-3 mb-4">
      <div className="flex items-center gap-4 flex-wrap">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}>
              <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-none">{s.label}</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">{s.value}</p>
            </div>
          </div>
        ))}

        {/* Funnel visual bar */}
        {total > 0 && (
          <div className="ml-auto hidden lg:flex items-center gap-1">
            {colCounts.map((c) => (
              c.count > 0 && (
                <div key={c.id} className="text-center">
                  <div
                    className="h-1.5 rounded-full min-w-[20px] transition-all"
                    style={{ width: `${Math.max(20, (c.count / total) * 120)}px` }}
                    title={`${c.label}: ${c.count}`}
                  />
                  <span className="text-[10px] text-gray-400">{c.count}</span>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
