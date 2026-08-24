import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  RotateCcw, 
  Users, 
  CheckSquare, 
  BarChart3, 
  FileText, 
  Database,
  Calendar,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { ActiveAppTab, ThemeMode, UserProfile } from '../types';
import { WadiDeglaLogo } from './WadiDeglaLogo';
import { getTeamUsers } from '../utils/teamDatabase';

interface MastheadProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onResetSession: () => void;
  activeTab: ActiveAppTab;
  onChangeTab: (tab: ActiveAppTab) => void;
  currentUser: UserProfile;
  onSwitchUser: (user: UserProfile) => void;
  onOpenDatabaseModal: () => void;
  pendingApprovalsCount: number;
}

export const Masthead: React.FC<MastheadProps> = ({
  theme,
  onToggleTheme,
  onResetSession,
  activeTab,
  onChangeTab,
  currentUser,
  onSwitchUser,
  onOpenDatabaseModal,
  pendingApprovalsCount,
}) => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const teamUsers = getTeamUsers();

  // Check 14th of month payroll cutoff
  const today = new Date();
  const currentDayOfMonth = today.getDate();
  const isCutoffNear = currentDayOfMonth >= 10 && currentDayOfMonth <= 15;

  return (
    <header className="space-y-4 pb-4 mb-6 border-b border-border/80">
      {/* Top Bar: Brand, Identity, User Role Switcher, Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-13 flex items-center justify-center shrink-0">
            <WadiDeglaLogo className="w-full h-full" variant="image" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-1">
              AttendanceTracker<span className="text-amber-500">.</span>
            </h1>
            <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest font-medium">
              Wadi Degla Clubs Attendance &amp; Overtime System
            </p>
          </div>
        </div>

        {/* Right Action Bar: User Switcher, Reset, Theme */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
          {/* User Account Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium bg-card border border-border hover:bg-muted transition-all cursor-pointer shadow-xs"
            >
              <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-foreground font-semibold max-w-[130px] truncate">{currentUser.name}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                  currentUser.role === 'manager'
                    ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                    : currentUser.role === 'team_leader'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}
              >
                {currentUser.role.replace('_', ' ')}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-card border border-border shadow-2xl p-2 z-50 space-y-1">
                <div className="px-2 py-1.5 text-[10px] font-mono uppercase text-muted-foreground border-b border-border flex items-center justify-between">
                  <span>Switch Active Profile</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      onOpenDatabaseModal();
                    }}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    + Add New
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 py-1">
                  {teamUsers.map((user) => {
                    const isSelected = user.id === currentUser.id || user.sapId === currentUser.sapId;
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          onSwitchUser(user);
                          setIsUserDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <div className="truncate">
                          <div className="truncate">{user.name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground truncate">
                            #{user.sapId} • {user.title}
                          </div>
                        </div>
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground shrink-0 ml-1">
                          {user.role.replace('_', ' ')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Reset Session */}
          <button
            onClick={onResetSession}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-full border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-all shadow-xs cursor-pointer"
            title="Clear employee details and punch ledger to start a new employee entry"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Theme Switcher */}
          <div className="flex items-center bg-card border border-border p-1 rounded-full shadow-xs">
            <button
              onClick={() => theme !== 'dark' && onToggleTheme()}
              className={`px-2.5 py-1 rounded-full text-xs font-medium font-mono transition-all flex items-center gap-1 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-muted text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-amber-400" />
              <span>Dark</span>
            </button>
            <button
              onClick={() => theme !== 'light' && onToggleTheme()}
              className={`px-2.5 py-1 rounded-full text-xs font-medium font-mono transition-all flex items-center gap-1 cursor-pointer ${
                theme === 'light'
                  ? 'bg-muted text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>
          </div>
        </div>
      </div>

      {/* 14th of Month Payroll Notification Banner */}
      <div
        className={`px-4 py-2 rounded-xl text-xs flex items-center justify-between gap-3 border ${
          isCutoffNear
            ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
            : 'bg-muted/40 text-muted-foreground border-border'
        }`}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            <strong className="text-foreground">Monthly Payroll Cycle (16th – 15th):</strong> All overtime submissions must be filed with mandatory reasons before the <strong>14th cutoff</strong> for Team Leader approval.
          </span>
        </div>
        <div className="text-[11px] font-mono px-2 py-0.5 rounded bg-background border border-border shrink-0 hidden sm:block">
          Tuesday Early Departure: 4:00 PM
        </div>
      </div>

      {/* Main Navigation Tabs - Prominent Sticky Bar */}
      <div className="bg-card border-2 border-primary/40 rounded-2xl p-2.5 shadow-xl sticky top-2 z-40">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-2 flex-nowrap shrink-0">
            {/* TAB 1: EMPLOYEE LEDGER */}
            <button
              type="button"
              onClick={() => onChangeTab('employee_ledger')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black font-mono transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                activeTab === 'employee_ledger'
                  ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/40 scale-[1.02]'
                  : 'bg-muted/70 text-foreground hover:bg-muted border border-border'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>TAB 1: My Timesheet (Employee)</span>
            </button>

            {/* TAB 2: TEAM LEADER APPROVALS */}
            <button
              type="button"
              onClick={() => onChangeTab('team_leader_approvals')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black font-mono transition-all cursor-pointer whitespace-nowrap shadow-sm relative ${
                activeTab === 'team_leader_approvals'
                  ? 'bg-amber-500 text-black shadow-md ring-2 ring-amber-500/60 scale-[1.02]'
                  : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-500/30 border-2 border-amber-500/40'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-amber-500" />
              <span>TAB 2: Team Leader Approvals</span>
              {pendingApprovalsCount > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500 text-white animate-pulse">
                  {pendingApprovalsCount} PENDING
                </span>
              )}
            </button>

            {/* TAB 3: MANAGER OVERVIEW */}
            <button
              type="button"
              onClick={() => onChangeTab('manager_overview')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black font-mono transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                activeTab === 'manager_overview'
                  ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-600/60 scale-[1.02]'
                  : 'bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-500/30 border-2 border-indigo-500/40'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <span>TAB 3: Manager Overview &amp; Matrix</span>
            </button>
          </div>

          {/* TAB 4: XAMPP CENTER */}
          <button
            type="button"
            onClick={() => onOpenDatabaseModal()}
            className="flex items-center gap-2 px-3.5 py-3 rounded-xl text-xs font-black font-mono transition-all cursor-pointer whitespace-nowrap shrink-0 ml-auto bg-orange-500/20 text-orange-800 dark:text-orange-300 hover:bg-orange-500/30 border-2 border-orange-500/40 shadow-xs"
          >
            <Database className="w-4 h-4 text-orange-500" />
            <span>TAB 4: XAMPP Database</span>
          </button>
        </div>
      </div>
    </header>
  );
};
