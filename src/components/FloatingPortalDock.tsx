import React from 'react';
import { ActiveAppTab } from '../types';
import { FileText, CheckSquare, BarChart3, Database, Sparkles } from 'lucide-react';

interface FloatingPortalDockProps {
  activeTab: ActiveAppTab;
  onChangeTab: (tab: ActiveAppTab) => void;
  onOpenDatabase: () => void;
  pendingApprovalsCount: number;
}

export const FloatingPortalDock: React.FC<FloatingPortalDockProps> = ({
  activeTab,
  onChangeTab,
  onOpenDatabase,
  pendingApprovalsCount,
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4 pointer-events-none">
      <div className="pointer-events-auto bg-card/95 backdrop-blur-xl border-2 border-primary/40 shadow-2xl rounded-2xl p-2 sm:p-2.5 flex items-center justify-between gap-1.5 ring-4 ring-black/10 transition-all">
        {/* TAB 1: EMPLOYEE */}
        <button
          type="button"
          onClick={() => onChangeTab('employee_ledger')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'employee_ledger'
              ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/40 scale-[1.02]'
              : 'bg-muted/70 hover:bg-muted text-foreground'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">1. Employee Timesheet</span>
          <span className="sm:hidden">1. Timesheet</span>
        </button>

        {/* TAB 2: TEAM LEADER */}
        <button
          type="button"
          onClick={() => onChangeTab('team_leader_approvals')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap relative ${
            activeTab === 'team_leader_approvals'
              ? 'bg-amber-500 text-black shadow-md ring-2 ring-amber-500/50 scale-[1.02]'
              : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30'
          }`}
        >
          <CheckSquare className="w-4 h-4 shrink-0 text-amber-500" />
          <span className="hidden sm:inline">2. Team Leader</span>
          <span className="sm:hidden">2. TL Approvals</span>
          {pendingApprovalsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        {/* TAB 3: MANAGER */}
        <button
          type="button"
          onClick={() => onChangeTab('manager_overview')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'manager_overview'
              ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-600/50 scale-[1.02]'
              : 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0 text-indigo-500" />
          <span className="hidden sm:inline">3. Manager Matrix</span>
          <span className="sm:hidden">3. Manager</span>
        </button>

        {/* TAB 4: XAMPP */}
        <button
          type="button"
          onClick={onOpenDatabase}
          className="flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap bg-orange-500/15 hover:bg-orange-500/25 text-orange-700 dark:text-orange-300 border border-orange-500/30"
          title="XAMPP & MySQL Database center"
        >
          <Database className="w-4 h-4 shrink-0 text-orange-500" />
          <span className="hidden md:inline">4. XAMPP</span>
        </button>
      </div>
    </div>
  );
};
