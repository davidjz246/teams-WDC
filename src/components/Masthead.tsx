import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  RotateCcw, 
  CheckSquare, 
  BarChart3, 
  FileText, 
  Database,
  Calendar,
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
    <header className="space-y-4 mb-6">
      {/* Top Bar: Brand, Identity, User Role Switcher, Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/80">
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 flex items-center justify-center shrink-0 rounded-xl overflow-hidden shadow-xs">
            <WadiDeglaLogo className="w-full h-full" variant="image" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-1">
              AttendanceTracker<span className="text-amber-500">.</span>
            </h1>
            <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest font-medium">
              Wadi Degla Clubs Attendance &amp; Overtime System
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span className="text-[10px] font-mono text-amber-400 font-bold tracking-wider uppercase">
                Made by David Kalad
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Bar: User Switcher, Reset, Theme */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* User Account Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-card border border-border hover:bg-muted/80 transition-all cursor-pointer shadow-2xs"
            >
              <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-bold">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-foreground font-semibold max-w-[130px] truncate">{currentUser.name}</span>
              <span
                className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                  currentUser.role === 'manager'
                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                    : currentUser.role === 'team_leader'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {currentUser.role.replace('_', ' ')}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-card border border-border shadow-2xl p-2 z-50 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border/80 flex items-center justify-between font-bold">
                  <span>Switch Profile</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      onOpenDatabaseModal();
                    }}
                    className="text-amber-500 hover:underline cursor-pointer"
                  >
                    + Manage
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
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30' : 'hover:bg-muted/80 text-foreground'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="truncate font-medium">{user.name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground truncate">
                            #{user.sapId} • {user.title}
                          </div>
                        </div>
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
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
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all shadow-2xs cursor-pointer"
            title="Clear employee details and punch ledger to start a new employee entry"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Theme Switcher */}
          <div className="flex items-center bg-card border border-border p-1 rounded-xl shadow-2xs">
            <button
              onClick={() => theme !== 'dark' && onToggleTheme()}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-muted text-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-amber-400" />
              <span>Dark</span>
            </button>
            <button
              onClick={() => theme !== 'light' && onToggleTheme()}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                theme === 'light'
                  ? 'bg-muted text-foreground font-semibold shadow-2xs'
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
        className={`px-4 py-2.5 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border shadow-2xs ${
          isCutoffNear
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            : 'bg-muted/30 text-muted-foreground border-border/80'
        }`}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            <strong className="text-foreground">Monthly Payroll Cycle (16th – 15th):</strong> All overtime submissions must be filed with mandatory reasons before the <strong>14th cutoff</strong> for Team Leader approval.
          </span>
        </div>
        <div className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-background border border-border/80 shrink-0 self-start sm:self-auto font-medium text-foreground">
          Tuesday Early Departure: 4:00 PM
        </div>
      </div>

      {/* Main Navigation Tabs - Prominent Sticky Bar */}
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl p-2 shadow-lg sticky top-2 z-40">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2 flex-nowrap shrink-0">
            {/* TAB 1: EMPLOYEE LEDGER */}
            <button
              type="button"
              onClick={() => onChangeTab('employee_ledger')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'employee_ledger'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-muted/50 text-foreground hover:bg-muted border border-border/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Tab 1: My Timesheet</span>
            </button>

            {/* TAB 2: TEAM LEADER APPROVALS */}
            <button
              type="button"
              onClick={() => onChangeTab('team_leader_approvals')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap relative ${
                activeTab === 'team_leader_approvals'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Tab 2: Team Leader Approvals</span>
              {pendingApprovalsCount > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                  {pendingApprovalsCount} PENDING
                </span>
              )}
            </button>

            {/* TAB 3: MANAGER OVERVIEW */}
            <button
              type="button"
              onClick={() => onChangeTab('manager_overview')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'manager_overview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Tab 3: Manager Matrix</span>
            </button>
          </div>

          {/* TAB 4: XAMPP CENTER */}
          <button
            type="button"
            onClick={() => onOpenDatabaseModal()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ml-auto bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30 shadow-2xs"
          >
            <Database className="w-4 h-4" />
            <span>Tab 4: Database Hub</span>
          </button>
        </div>
      </div>
    </header>
  );
};

