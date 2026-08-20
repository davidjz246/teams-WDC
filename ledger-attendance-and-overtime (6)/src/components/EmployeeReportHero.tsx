import React from 'react';
import {
  User,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Users,
  FileSpreadsheet,
  Calendar,
  Sparkles,
  Award,
  Check,
} from 'lucide-react';
import { fmtHours } from '../utils/parser';

interface EmployeeReportHeroProps {
  employeeName: string;
  employeeId: string;
  totalDays: number;
  punctualityScore: number;
  totalOvertimeMins: number;
  overtimeCount: number;
  lateCount: number;
  presentCount: number;
  excusedCount: number;
  isUserDataComplete: boolean;
  missingDataErrors: Array<{ id: string; label: string; actionLabel?: string; action?: () => void }>;
  shiftEndTime: string;
  lateThresholdVal: string;
  completionPercentage: number;
  completedRequiredCount: number;
  totalRequiredCount: number;
  onOpenDirectory: () => void;
  onOpenStickyNotes?: () => void;
}

export const EmployeeReportHero: React.FC<EmployeeReportHeroProps> = ({
  employeeName,
  employeeId,
  totalDays,
  punctualityScore,
  totalOvertimeMins,
  overtimeCount,
  lateCount,
  presentCount,
  excusedCount,
  isUserDataComplete,
  missingDataErrors,
  shiftEndTime,
  lateThresholdVal,
  completionPercentage,
  completedRequiredCount,
  totalRequiredCount,
  onOpenDirectory,
}) => {
  const cleanName = employeeName.trim();
  const cleanId = employeeId.trim();

  // Extract initials (e.g. David Joseph -> DJ)
  const initials = cleanName
    ? cleanName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : 'EMP';

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 mb-6 transition-all duration-300 shadow-xl border overflow-hidden ${
        completionPercentage === 100
          ? 'bg-emerald-500/10 border-emerald-500/30 text-foreground shadow-emerald-500/5'
          : completionPercentage >= 60
          ? 'bg-amber-500/10 border-amber-500/30 text-foreground shadow-amber-500/5'
          : 'bg-rose-500/10 border-rose-500/30 text-foreground shadow-rose-500/5'
      }`}
    >
      {/* Top Action & Verification Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-5 border-b border-border/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-2xs transition-all duration-300 ${
              completionPercentage === 100
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                : completionPercentage >= 60
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 animate-pulse'
                : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40 animate-pulse'
            }`}
          >
            {completionPercentage === 100 ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% All Data Verified &amp; Complete</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{completionPercentage}% Data In — Required Data Missing</span>
              </>
            )}
          </span>

          <span className="font-mono text-xs font-semibold px-3 py-1.5 rounded-full bg-card border border-border text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>Shift End: {shiftEndTime || '17:00'}</span>
          </span>
        </div>

        <button
          onClick={onOpenDirectory}
          className="px-3.5 py-1.5 rounded-full font-mono text-xs font-bold border transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 bg-card hover:bg-accent text-foreground border-border shadow-xs cursor-pointer"
          title="Open Employee Staff Directory"
        >
          <Users className="w-3.5 h-3.5 text-teal-400" />
          <span>{cleanId ? `Staff ID #${cleanId}` : '⚠️ ID Missing'}</span>
        </button>
      </div>

      {/* CENTERED EMPLOYEE IDENTITY HEADER WITH LIVE DATA COMPLETION COUNTER */}
      <div className="text-center max-w-3xl mx-auto space-y-3 py-2">
        {/* Avatar Circle */}
        <div className="relative inline-block mx-auto">
          <div className="w-16 h-16 rounded-full bg-gradient-to-b from-amber-500 to-amber-600 text-black font-mono font-extrabold text-2xl mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20 ring-4 ring-background">
            {initials}
          </div>
          {completionPercentage === 100 ? (
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-md border-2 border-background">
              <Check className="w-3.5 h-3.5" />
            </span>
          ) : (
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px] font-mono font-extrabold shadow-md border-2 border-background animate-pulse">
              !
            </span>
          )}
        </div>

        {/* Employee Name + DYNAMIC COMPLETION COUNTER BESIDE THE NAME */}
        <div className="flex items-center justify-center gap-3 flex-wrap px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            {cleanName || <span className="italic opacity-70 font-normal">No Employee Name Set</span>}
          </h1>

          {/* DYNAMIC LIVE COUNTER BADGE BESIDE THE NAME */}
          <div
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-bold border transition-all duration-300 shadow-sm ${
              completionPercentage === 100
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-emerald-500/10'
                : completionPercentage >= 60
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40'
                : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40'
            }`}
            title={`Required Data Completion Status: ${completedRequiredCount}/${totalRequiredCount} items verified (${completionPercentage}%)`}
          >
            {completionPercentage === 100 ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-extrabold text-sm tracking-tight">{completionPercentage}%</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Complete</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 animate-bounce" />
                <span className="font-extrabold text-sm tracking-tight">{completionPercentage}%</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Required Data</span>
              </>
            )}
          </div>
        </div>

        {/* Subtitle Details */}
        <div className="flex items-center justify-center gap-2 flex-wrap text-xs font-mono font-medium text-muted-foreground">
          <span className="px-2.5 py-0.5 rounded-md bg-muted/60 text-foreground font-bold border border-border">
            Employee ID: {cleanId || 'Not Assigned'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <span>{totalDays} Days Processed in Ledger</span>
          </span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
            {punctualityScore}% On-Time Rating
          </span>
          <span>•</span>
          <span className={`font-bold ${completionPercentage === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
            {completedRequiredCount}/{totalRequiredCount} Required Items Filed
          </span>
        </div>

        {/* Visual Progress Bar (Decreases / Increases dynamically) */}
        <div className="max-w-md mx-auto pt-1">
          <div className="w-full bg-muted/70 h-2 rounded-full overflow-hidden border border-border/80">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                completionPercentage === 100
                  ? 'bg-emerald-500'
                  : completionPercentage >= 60
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* STRUCTURED FILED DATA REPORT (Positioned Directly Underneath) */}
      <div className="mt-8">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-teal-400" />
            <span>Filed Data &amp; Verification Report</span>
          </h3>
          <span className="text-[11px] font-mono text-muted-foreground">
            Audit verification status for Excel ledger export ({completionPercentage}% Complete)
          </span>
        </div>

        {/* 4 Dedicated Structured Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Tile 1: Employee Record */}
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-400" />
                <span>Employee Record</span>
              </span>
              {cleanName && cleanId ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              )}
            </div>
            <div>
              <div className="text-sm font-bold text-foreground font-mono">
                {cleanId ? `ID #${cleanId}` : 'Missing Employee ID'}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {cleanName ? 'Identity verified & mapped' : 'Please provide full name'}
              </p>
            </div>
          </div>

          {/* Tile 2: Overtime Justifications */}
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Overtime Reasons</span>
              </span>
              {missingDataErrors.some((e) => e.id.includes('reason')) ? (
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </div>
            <div>
              <div className="text-sm font-bold text-foreground font-mono">
                {overtimeCount > 0
                  ? `${overtimeCount} ${overtimeCount === 1 ? 'Day' : 'Days'} (${fmtHours(totalOvertimeMins)})`
                  : '0 Overtime Days'}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {missingDataErrors.some((e) => e.id.includes('reason'))
                  ? '⚠️ Reasons required before export'
                  : 'All justifications documented'}
              </p>
            </div>
          </div>

          {/* Tile 3: Punctuality Status */}
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Punctuality Status</span>
              </span>
              <span className={`w-2 h-2 rounded-full ${lateCount === 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </div>
            <div>
              <div className="text-sm font-bold text-foreground font-mono flex items-center gap-2">
                <span>{punctualityScore}% On-Time</span>
                {lateCount === 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 font-bold">
                    0 Late
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {lateCount === 0
                  ? `All check-ins before ${lateThresholdVal || '09:15'}`
                  : `${lateCount} check-in(s) past threshold`}
              </p>
            </div>
          </div>

          {/* Tile 4: Export Readiness (Shows live completion counter) */}
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export Readiness</span>
              </span>
              <span className={`w-2 h-2 rounded-full ${completionPercentage === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </div>
            <div>
              <div className="text-sm font-bold text-foreground font-mono">
                {completionPercentage === 100 ? '100% Ready' : `${completionPercentage}% Complete`}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {completionPercentage === 100
                  ? 'Excel export ready'
                  : `${completedRequiredCount}/${totalRequiredCount} requirements met`}
              </p>
            </div>
          </div>
        </div>

        {/* Action Required Alert Box (if incomplete) */}
        {completionPercentage < 100 && (
          <div className="mt-3.5 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs font-mono space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-500">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Required items missing ({completedRequiredCount}/{totalRequiredCount} completed — {completionPercentage}%):
              </span>
            </div>
            <ul className="space-y-1.5 pl-1">
              {missingDataErrors.map((err) => (
                <li key={err.id} className="flex items-center justify-between text-[11px] text-foreground gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                    {err.label}
                  </span>
                  {err.action && (
                    <button
                      onClick={err.action}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-bold hover:bg-amber-400 shrink-0 text-[10px] cursor-pointer shadow-xs"
                    >
                      {err.actionLabel}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* BOTTOM KEY METRICS SUMMARY RIBBON */}
      <div className="mt-6 pt-5 border-t border-border/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center font-mono">
        <div className="bg-card/70 border border-border/60 rounded-2xl p-3">
          <div className="text-2xl font-extrabold text-foreground">{punctualityScore}%</div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">Punctuality</div>
        </div>

        <div className="bg-card/70 border border-border/60 rounded-2xl p-3">
          <div className="text-2xl font-extrabold text-amber-500">{fmtHours(totalOvertimeMins)}</div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">Total Overtime</div>
        </div>

        <div className="bg-card/70 border border-border/60 rounded-2xl p-3">
          <div className="text-2xl font-extrabold text-emerald-500">{presentCount}</div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">On Time</div>
        </div>

        <div className="bg-card/70 border border-border/60 rounded-2xl p-3">
          <div className="text-2xl font-extrabold text-amber-500">{overtimeCount}</div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">Overtime Days</div>
        </div>

        <div className="bg-card/70 border border-border/60 rounded-2xl p-3">
          <div className="text-2xl font-extrabold text-teal-400">{excusedCount}</div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">Excused</div>
        </div>

        <div className="bg-card/70 border border-border/60 rounded-2xl p-3">
          <div className={`text-2xl font-extrabold ${lateCount === 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {lateCount}
          </div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">Late Days</div>
        </div>
      </div>
    </div>
  );
};
