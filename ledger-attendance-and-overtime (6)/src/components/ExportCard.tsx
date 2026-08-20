import React, { useState } from 'react';
import { ExportSettings } from '../types';
import {
  FileSpreadsheet,
  User,
  Hash,
  Clock,
  StickyNote,
  Bot,
  AlertCircle,
  CheckCircle,
  Users,
  Sparkles,
  X,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { lookupEmployeeById, saveEmployeeMapping } from '../utils/employeeDirectory';

interface ExportCardProps {
  exportSettings: ExportSettings;
  onChangeSettings: (settings: ExportSettings) => void;
  onExport: () => void;
  overtimeCount: number;
  missingReasonsCount: number;
  unresolvedAbsencesCount?: number;
  onOpenStickyNotes: () => void;
  onOpenPowerAutomate: () => void;
  onOpenDirectory?: () => void;
}

export const ExportCard: React.FC<ExportCardProps> = ({
  exportSettings,
  onChangeSettings,
  onExport,
  overtimeCount,
  missingReasonsCount,
  unresolvedAbsencesCount = 0,
  onOpenStickyNotes,
  onOpenPowerAutomate,
  onOpenDirectory,
}) => {
  const [autoMatchedName, setAutoMatchedName] = useState<string | null>(null);

  const handleIdChange = (newId: string) => {
    if (!newId.trim()) {
      onChangeSettings({
        ...exportSettings,
        employeeId: '',
        name: '',
      });
      setAutoMatchedName(null);
      return;
    }

    const matchedName = lookupEmployeeById(newId);
    if (matchedName) {
      onChangeSettings({
        ...exportSettings,
        employeeId: newId,
        name: matchedName,
      });
      setAutoMatchedName(matchedName);
      setTimeout(() => setAutoMatchedName(null), 4000);
    } else {
      onChangeSettings({
        ...exportSettings,
        employeeId: newId,
      });
      setAutoMatchedName(null);
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

  const handleNameChange = (newName: string) => {
    onChangeSettings({
      ...exportSettings,
      name: newName,
    });
    if (exportSettings.employeeId.trim() && newName.trim()) {
      saveEmployeeMapping(exportSettings.employeeId.trim(), newName.trim());
    }
  };

  const update = <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => {
    onChangeSettings({ ...exportSettings, [key]: value });
  };

  const hasMissingItems =
    missingReasonsCount > 0 ||
    unresolvedAbsencesCount > 0 ||
    !exportSettings.name.trim() ||
    !exportSettings.employeeId.trim();

  return (
    <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col justify-between gap-5">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium bg-muted/60 hover:bg-muted text-foreground border border-border transition-all shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
                title="Lookup staff directory or clear selected employee"
              >
                <Users className="w-3.5 h-3.5 text-teal-400" />
                <span>Staff Directory</span>
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
                <span>Reset Employee</span>
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

            <button
              type="button"
              onClick={onOpenPowerAutomate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium bg-muted/60 hover:bg-muted text-foreground border border-border transition-all shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
              title="Power Automate scheduled export"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>Power Automate</span>
            </button>
          </div>
        </div>

        {/* 3 Dedicated Parameter Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Block 1: Employee ID */}
          <div className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <label className="text-[11px] font-mono uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5 truncate">
                <Hash className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Employee ID</span>
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

            <div className="space-y-2">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={exportSettings.employeeId}
                  onChange={(e) => handleIdChange(e.target.value)}
                  placeholder="e.g. 32272"
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
                    title="Delete / Clear entered number"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {autoMatchedName && (
                <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 animate-in fade-in truncate">
                  <Sparkles className="w-3 h-3 shrink-0" /> Auto-loaded name!
                </span>
              )}
            </div>
          </div>

          {/* Block 2: Employee Name */}
          <div className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <label className="text-[11px] font-mono uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Employee Name</span>
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

        {/* Verification Status Banner (Missing Reasons AND Unexcused Absence Checkpoints) */}
        <div
          className={`mt-4 p-4 rounded-2xl border transition-all text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            missingReasonsCount > 0 || unresolvedAbsencesCount > 0
              ? 'bg-amber-500/10 border-amber-500/30'
              : overtimeCount > 0
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-muted/30 border-border'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {unresolvedAbsencesCount > 0 ? (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="text-rose-300 font-semibold">
                  ⚠️ Checkpoint Required: {unresolvedAbsencesCount} unexcused absence {unresolvedAbsencesCount === 1 ? 'day needs' : 'days need'} an excuse checkpoint verified before Excel export.
                </span>
              </>
            ) : missingReasonsCount > 0 ? (
              <>
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-amber-300 font-semibold">
                  ⚠️ Overtime Reason Required: {missingReasonsCount} {missingReasonsCount === 1 ? 'day is' : 'days are'} missing a reason!
                </span>
              </>
            ) : overtimeCount > 0 ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-emerald-300 font-semibold">
                  ✓ All checkpoints and {overtimeCount} overtime reasons verified and filled. Ready to export!
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">
                No overtime days detected in the current ledger.
              </span>
            )}
          </div>

          {missingReasonsCount > 0 && (
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

      {/* Main Export Action Button (Locked until Checkpoints & Reasons are cleared) */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onExport}
          className={`w-full py-4 px-6 font-mono text-sm font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer ${
            hasMissingItems
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5 shrink-0" />
          <span className="truncate">
            {unresolvedAbsencesCount > 0
              ? `Verify ${unresolvedAbsencesCount} Absence Checkpoint${unresolvedAbsencesCount === 1 ? '' : 's'} & Export Excel`
              : missingReasonsCount > 0
              ? `Fill Reasons (${missingReasonsCount}) & Export Excel Ledger`
              : !exportSettings.name.trim() || !exportSettings.employeeId.trim()
              ? 'Complete Name & Employee ID to Export'
              : `Export Overtime to Excel Ledger (${overtimeCount} ${overtimeCount === 1 ? 'day' : 'days'})`}
          </span>
        </button>
      </div>
    </div>
  );
};
