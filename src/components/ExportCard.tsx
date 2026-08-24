import React, { useState, useEffect, useRef } from 'react';
import { ExportSettings } from '../types';
import {
  FileSpreadsheet,
  User,
  Hash,
  Clock,
  StickyNote,
  AlertCircle,
  CheckCircle,
  Users,
  Sparkles,
  X,
  RotateCcw,
  AlertTriangle,
  Database,
  Check,
  CheckSquare,
  BarChart3,
  Lock,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  lookupEmployeeById,
  saveEmployeeMapping,
  getAllEmployees,
  normalizeEmployeeId,
} from '../utils/employeeDirectory';

interface ExportCardProps {
  exportSettings: ExportSettings;
  onChangeSettings: (settings: ExportSettings) => void;
  onExport: () => void;
  onSubmitToTeamLeader?: () => void;
  onNavigateTab?: (tab: 'team_leader_approvals' | 'manager_overview' | 'employee_ledger') => void;
  overtimeCount: number;
  missingReasonsCount: number;
  unresolvedAbsencesCount?: number;
  onOpenStickyNotes: () => void;
  onOpenDirectory?: () => void;
}

export const ExportCard: React.FC<ExportCardProps> = ({
  exportSettings,
  onChangeSettings,
  onExport,
  onSubmitToTeamLeader,
  onNavigateTab,
  overtimeCount,
  missingReasonsCount,
  unresolvedAbsencesCount = 0,
  onOpenStickyNotes,
  onOpenDirectory,
}) => {
  const [autoMatchedName, setAutoMatchedName] = useState<string | null>(null);
  const [directoryList, setDirectoryList] = useState<{ id: string; name: string }[]>([]);
  const [showIdDropdown, setShowIdDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load directory list for quick suggestions
  const refreshDirectory = () => {
    setDirectoryList(getAllEmployees());
  };

  useEffect(() => {
    refreshDirectory();
    const handleUpdate = () => {
      refreshDirectory();
    };
    window.addEventListener('employee_directory_updated', handleUpdate);
    return () => window.removeEventListener('employee_directory_updated', handleUpdate);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowIdDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle SAP / Employee ID Input with Real-time Auto Lookup
  const handleIdChange = (rawId: string) => {
    const cleanId = normalizeEmployeeId(rawId);

    if (!cleanId) {
      onChangeSettings({
        ...exportSettings,
        employeeId: rawId,
        name: '',
      });
      setAutoMatchedName(null);
      return;
    }

    // Check local database for this ID
    const matchedName = lookupEmployeeById(cleanId);
    if (matchedName) {
      onChangeSettings({
        ...exportSettings,
        employeeId: cleanId,
        name: matchedName,
      });
      setAutoMatchedName(matchedName);
      setTimeout(() => setAutoMatchedName(null), 5000);
    } else {
      onChangeSettings({
        ...exportSettings,
        employeeId: cleanId,
      });
      setAutoMatchedName(null);
    }
  };

  // Handle Selection from Suggestion Dropdown
  const handleSelectSuggestion = (id: string, name: string) => {
    onChangeSettings({
      ...exportSettings,
      employeeId: id,
      name: name,
    });
    setAutoMatchedName(name);
    setShowIdDropdown(false);
    setTimeout(() => setAutoMatchedName(null), 5000);
  };

  // Handle Employee Name change & continuous learning to local DB
  const handleNameChange = (newName: string) => {
    onChangeSettings({
      ...exportSettings,
      name: newName,
    });
    const cleanId = normalizeEmployeeId(exportSettings.employeeId);
    if (cleanId && newName.trim()) {
      saveEmployeeMapping(cleanId, newName.trim());
    }
  };

  const handleBlurSave = () => {
    const cleanId = normalizeEmployeeId(exportSettings.employeeId);
    const cleanName = exportSettings.name.trim();
    if (cleanId && cleanName) {
      saveEmployeeMapping(cleanId, cleanName);
    }
  };

  const handleClearId = () => {
    onChangeSettings({
      ...exportSettings,
      employeeId: '',
      name: '',
    });
    setAutoMatchedName(null);
  };

  const handleClearName = () => {
    onChangeSettings({
      ...exportSettings,
      name: '',
    });
  };

  const update = <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => {
    onChangeSettings({ ...exportSettings, [key]: value });
  };

  const isSapValid = Boolean(
    exportSettings.employeeId?.trim() &&
    exportSettings.employeeId.trim().toLowerCase() !== 'employee id' &&
    exportSettings.employeeId.trim().toLowerCase() !== 'sap id'
  );

  const isNameValid = Boolean(
    exportSettings.name?.trim() &&
    exportSettings.name.trim().toLowerCase() !== 'employee name' &&
    exportSettings.name.trim().toLowerCase() !== 'no employee name set'
  );

  const hasMissingItems =
    missingReasonsCount > 0 ||
    unresolvedAbsencesCount > 0 ||
    !isSapValid ||
    !isNameValid;

  // Filter suggestions based on typed ID
  const suggestions = directoryList.filter((emp) => {
    if (!exportSettings.employeeId) return true;
    const cleanCurrent = normalizeEmployeeId(exportSettings.employeeId).toLowerCase();
    return (
      emp.id.toLowerCase().includes(cleanCurrent) ||
      emp.name.toLowerCase().includes(cleanCurrent)
    );
  });

  return (
    <div className="bg-card border-2 border-primary/40 rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col justify-between gap-5">
      {/* DIRECT ACCESS PORTAL BUTTONS (TEAM LEADER & MANAGER) */}
      {onNavigateTab && (
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-teal-500/15 border-2 border-amber-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <div>
              <span className="text-xs font-mono font-extrabold uppercase tracking-wide text-foreground">
                PORTAL SELECTOR (CLICK TO VIEW):
              </span>
              <p className="text-[11px] font-mono text-muted-foreground">
                Jump directly into Team Leader Review or Manager Matrix
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onNavigateTab('team_leader_approvals')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-mono font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ring-2 ring-amber-500/50"
            >
              <CheckSquare className="w-4 h-4 text-black" />
              <span>👉 OPEN TAB 2: TEAM LEADER VIEW</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('manager_overview')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-mono font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ring-2 ring-indigo-500/50"
            >
              <BarChart3 className="w-4 h-4 text-white" />
              <span>👉 OPEN TAB 3: MANAGER VIEW</span>
            </button>
          </div>
        </div>
      )}

      {/* Card Header & Quick Tools */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-border/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-mono text-xs uppercase tracking-widest text-foreground font-bold">
                Export Overtime Log
              </h2>
              <span className="text-[11px] text-muted-foreground">
                Employee metadata &amp; dispatch parameters
              </span>
            </div>
          </div>

          {/* Quick Helper Tools */}
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenDirectory && (
              <button
                type="button"
                onClick={onOpenDirectory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 transition-all shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
                title="Manage local employee database"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Local DB ({directoryList.length})</span>
              </button>
            )}

            {(exportSettings.employeeId || exportSettings.name) && (
              <button
                type="button"
                onClick={handleClearId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
                title="Clear entered ID & Name"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Profile</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenStickyNotes}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium bg-muted/60 hover:bg-muted text-foreground border border-border transition-all shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
              title="Import overtime reasons from Sticky Notes"
            >
              <StickyNote className="w-3.5 h-3.5 text-amber-400" />
              <span>Sticky Notes</span>
            </button>
          </div>
        </div>

        {/* Security & Data Ownership Notice */}
        <div className="mb-4 p-3 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between gap-2.5 text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong className="text-foreground">Security &amp; Privacy Lock:</strong> Timesheet punch records are bound strictly to this employee. Changing the SAP ID or Name wipes previous ledger data.
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[10px] uppercase font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20 shrink-0">
            <ShieldCheck className="w-3 h-3" />
            <span>Encrypted Session</span>
          </div>
        </div>

        {/* 3 Dedicated Parameter Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Block 1: Employee ID with Auto-Lookup Dropdown */}
          <div
            ref={dropdownRef}
            className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-col justify-between min-w-0 relative"
          >
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <label className="text-[11px] font-mono uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5 truncate">
                <Hash className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>SAP / Employee ID</span>
              </label>
              {exportSettings.employeeId.trim() ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 shrink-0 whitespace-nowrap">
                    ✓ Complete
                  </span>
                  <button
                    type="button"
                    onClick={handleClearId}
                    className="p-0.5 rounded-md hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete / Clear Employee ID"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30 shrink-0 whitespace-nowrap">
                  ⚠️ Required
                </span>
              )}
            </div>

            <div className="space-y-2 relative">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={exportSettings.employeeId}
                  onChange={(e) => handleIdChange(e.target.value)}
                  onFocus={() => {
                    if (directoryList.length > 0) setShowIdDropdown(true);
                  }}
                  onBlur={handleBlurSave}
                  placeholder="Enter SAP / ID # (e.g. 10452)"
                  className={`w-full min-w-0 bg-background rounded-xl pl-3 pr-8 py-2 text-xs font-mono text-foreground focus:outline-hidden transition-all ${
                    exportSettings.employeeId.trim()
                      ? 'border border-emerald-500/40 focus:border-emerald-500'
                      : 'border-2 border-amber-500/60 focus:border-amber-400 placeholder:text-amber-400/60'
                  }`}
                />
                {exportSettings.employeeId && (
                  <button
                    type="button"
                    onClick={handleClearId}
                    className="absolute right-2.5 p-1 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-muted transition-colors cursor-pointer"
                    title="Clear entered number"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown from Local Laptop Database */}
              {showIdDropdown && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-card border border-teal-500/40 rounded-2xl shadow-xl max-h-48 overflow-y-auto p-1 space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-teal-400 font-bold flex items-center justify-between border-b border-border/50">
                    <span>Local Database Matches</span>
                    <button
                      type="button"
                      onClick={() => setShowIdDropdown(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(item.id, item.name);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-teal-500/15 text-xs font-mono flex items-center justify-between gap-2 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-foreground">#{item.id}</span>
                        <span className="text-muted-foreground text-[11px] ml-2 truncate">{item.name}</span>
                      </div>
                      <span className="text-[10px] text-teal-400 font-bold shrink-0">Auto-fill</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Auto-filled Name Notification */}
              {autoMatchedName && (
                <span className="text-[11px] text-emerald-400 font-mono font-bold flex items-center gap-1.5 animate-in fade-in bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 truncate">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Auto-loaded: {autoMatchedName}</span>
                </span>
              )}
            </div>
          </div>

          {/* Block 2: Employee Name */}
          <div className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <label className="text-[11px] font-mono uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Full Employee Name</span>
              </label>
              {exportSettings.name.trim() ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 shrink-0 whitespace-nowrap">
                    ✓ Complete
                  </span>
                  <button
                    type="button"
                    onClick={handleClearName}
                    className="p-0.5 rounded-md hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete / Clear Employee Name"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30 shrink-0 whitespace-nowrap">
                  ⚠️ Required
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                value={exportSettings.name}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={handleBlurSave}
                placeholder="Full Employee Name"
                className={`w-full min-w-0 bg-background rounded-xl pl-3 pr-8 py-2 text-xs font-mono text-foreground focus:outline-hidden transition-all ${
                  exportSettings.name.trim()
                    ? 'border border-emerald-500/40 focus:border-emerald-500'
                    : 'border-2 border-amber-500/60 focus:border-amber-400 placeholder:text-amber-400/60'
                }`}
              />
              {exportSettings.name && (
                <button
                  type="button"
                  onClick={handleClearName}
                  className="absolute right-2.5 p-1 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-muted transition-colors cursor-pointer"
                  title="Delete / Clear name"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Block 3: Shift End ("From" Time) */}
          <div className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <label className="text-[11px] font-mono uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5 truncate">
                <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Shift End Time</span>
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 shrink-0 whitespace-nowrap">
                ✓ Set
              </span>
            </div>

            <div>
              <input
                type="time"
                value={exportSettings.shiftEnd}
                onChange={(e) => update('shiftEnd', e.target.value)}
                className="w-full min-w-0 bg-background border border-emerald-500/40 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div
          className={`mt-4 p-4 rounded-2xl border transition-all text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            !exportSettings.employeeId.trim() || !exportSettings.name.trim()
              ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
              : unresolvedAbsencesCount > 0
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : missingReasonsCount > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : overtimeCount > 0
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-muted/30 border-border text-muted-foreground'
          }`}
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            {!exportSettings.employeeId.trim() ? (
              <>
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-bold text-rose-300">
                  ⛔ SAP / Employee ID is strictly mandatory: Please enter your SAP ID to enable Excel export.
                </span>
              </>
            ) : !exportSettings.name.trim() ? (
              <>
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-bold text-rose-300">
                  ⛔ Employee Name is strictly mandatory: Please enter your full name to enable Excel export.
                </span>
              </>
            ) : unresolvedAbsencesCount > 0 ? (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-semibold text-rose-300">
                  ⚠️ Checkpoint Required: {unresolvedAbsencesCount} unexcused absence {unresolvedAbsencesCount === 1 ? 'day needs' : 'days need'} an excuse checkpoint verified before Excel export.
                </span>
              </>
            ) : missingReasonsCount > 0 ? (
              <>
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold text-amber-300">
                  ⚠️ Overtime Reason Required: {missingReasonsCount} {missingReasonsCount === 1 ? 'day is' : 'days are'} missing a reason!
                </span>
              </>
            ) : overtimeCount > 0 ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-emerald-300">
                  ✓ SAP #{exportSettings.employeeId}, {exportSettings.name} &amp; {overtimeCount} overtime reasons verified. Ready to export!
                </span>
              </>
            ) : (
              <span>
                No overtime days detected in the current ledger.
              </span>
            )}
          </div>

          {missingReasonsCount > 0 && exportSettings.employeeId.trim() && exportSettings.name.trim() && (
            <button
              type="button"
              onClick={onOpenStickyNotes}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 shrink-0 shadow-xs cursor-pointer whitespace-nowrap"
            >
              Fill with Sticky Notes
            </button>
          )}
        </div>
      </div>

      {/* Main Action Buttons Grid */}
      <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {onSubmitToTeamLeader && (
          <button
            type="button"
            disabled={!isSapValid || !isNameValid || hasMissingItems}
            onClick={onSubmitToTeamLeader}
            className={`w-full py-4 px-5 font-mono text-sm font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2.5 ${
              !isSapValid || !isNameValid
                ? 'bg-muted/70 text-muted-foreground border-2 border-dashed border-border cursor-not-allowed opacity-60'
                : hasMissingItems
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20 active:scale-[0.99] cursor-pointer'
                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20 active:scale-[0.99] cursor-pointer'
            }`}
          >
            {!isSapValid || !isNameValid ? (
              <Lock className="w-5 h-5 shrink-0 text-muted-foreground" />
            ) : (
              <CheckCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="truncate">
              {!isSapValid
                ? '🔒 SAP ID Required to Submit'
                : !isNameValid
                ? '🔒 Name Required to Submit'
                : hasMissingItems
                ? `Complete Missing Items (${missingReasonsCount + unresolvedAbsencesCount})`
                : `Submit to Team Leader (${overtimeCount} ${overtimeCount === 1 ? 'day' : 'days'})`}
            </span>
          </button>
        )}

        <button
          type="button"
          disabled={!isSapValid || !isNameValid || hasMissingItems || overtimeCount === 0}
          onClick={() => {
            if (!isSapValid) {
              alert('⛔ EXPORT CANCELLED: SAP / Employee ID is strictly mandatory. Please enter your SAP ID first.');
              return;
            }
            if (!isNameValid) {
              alert('⛔ EXPORT CANCELLED: Full Employee Name is strictly mandatory. Please enter your name first.');
              return;
            }
            if (hasMissingItems) {
              alert('⛔ EXPORT CANCELLED: All overtime reasons and absence checkpoints must be completed before exporting to Excel.');
              return;
            }
            if (overtimeCount === 0) {
              alert('⛔ EXPORT CANCELLED: No overtime records found in the current punch ledger.');
              return;
            }
            onExport();
          }}
          className={`w-full py-4 px-5 font-mono text-sm font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2.5 ${
            !isSapValid || !isNameValid
              ? 'bg-rose-500/10 text-rose-300 border-2 border-dashed border-rose-500/40 cursor-not-allowed opacity-75'
              : hasMissingItems
              ? 'bg-muted/80 text-muted-foreground border-2 border-dashed border-amber-500/40 cursor-not-allowed opacity-75'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-[0.99] cursor-pointer'
          } ${!onSubmitToTeamLeader ? 'sm:col-span-2' : ''}`}
        >
          {!isSapValid || !isNameValid ? (
            <Lock className="w-5 h-5 shrink-0 text-rose-400" />
          ) : hasMissingItems ? (
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
          ) : (
            <FileSpreadsheet className="w-5 h-5 shrink-0" />
          )}
          <span className="truncate">
            {!isSapValid
              ? '🔒 SAP ID Mandatory for Excel'
              : !isNameValid
              ? '🔒 Name Mandatory for Excel'
              : missingReasonsCount > 0
              ? `⚠️ Fill ${missingReasonsCount} Reason(s) for Excel`
              : unresolvedAbsencesCount > 0
              ? '⚠️ Resolve Absence Checkpoint'
              : `Export Excel Ledger (${overtimeCount} ${overtimeCount === 1 ? 'day' : 'days'})`}
          </span>
        </button>
      </div>
    </div>
  );
};
