import React from 'react';
import { Clock, CheckCircle, AlertTriangle, ArrowRight, UserCheck, ShieldCheck, RefreshCw } from 'lucide-react';
import { OvertimeSubmission } from '../types';
import { toHM } from '../utils/parser';

interface EmployeeSubmissionStatusProps {
  submission: OvertimeSubmission | undefined;
  employeeName: string;
  employeeId: string;
  onNavigateToApprovals: () => void;
  onSubmitNew: () => void;
  overtimeCount: number;
}

export const EmployeeSubmissionStatus: React.FC<EmployeeSubmissionStatusProps> = ({
  submission,
  employeeName,
  employeeId,
  onNavigateToApprovals,
  onSubmitNew,
  overtimeCount,
}) => {
  if (!submission) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted/60 border border-border flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Timesheet Submission Status
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-muted text-muted-foreground border border-border">
                  Draft (Not Submitted)
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {overtimeCount > 0
                  ? `You have ${overtimeCount} overtime ${overtimeCount === 1 ? 'day' : 'days'} ready to submit to your Team Leader.`
                  : 'Punches loaded in draft mode. Fill details and submit to Team Leader for approval.'}
              </p>
            </div>
          </div>

          {overtimeCount > 0 && (
            <button
              type="button"
              onClick={onSubmitNew}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-sm flex items-center gap-2 cursor-pointer transition-all shrink-0 whitespace-nowrap"
            >
              <span>Submit to Team Leader</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  const isPending = submission.status === 'pending';
  const isApproved = submission.status === 'approved';
  const isRejected = submission.status === 'rejected';

  return (
    <div
      className={`border-2 rounded-2xl p-4 sm:p-6 shadow-md mb-6 transition-all ${
        isPending
          ? 'bg-amber-500/10 border-amber-500/50 shadow-amber-500/5'
          : isApproved
          ? 'bg-emerald-500/10 border-emerald-500/50 shadow-emerald-500/5'
          : 'bg-rose-500/10 border-rose-500/50 shadow-rose-500/5'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              isPending
                ? 'bg-amber-500 text-black'
                : isApproved
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {isPending ? (
              <Clock className="w-6 h-6 animate-spin" />
            ) : isApproved ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Official Submission Request
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold tracking-wide uppercase ${
                  isPending
                    ? 'bg-amber-500 text-black animate-pulse'
                    : isApproved
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {isPending
                  ? '⏳ WAITING FOR TEAM LEADER APPROVAL'
                  : isApproved
                  ? '✓ APPROVED BY TEAM LEADER'
                  : '❌ CHANGES REQUESTED BY TEAM LEADER'}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-foreground mt-1">
              {isPending && (
                <span>
                  Your overtime request for <span className="underline decoration-amber-500">{submission.employeeName}</span> has been sent to the Team Leader.
                </span>
              )}
              {isApproved && (
                <span className="text-emerald-600 dark:text-emerald-400">
                  Overtime claim approved for payroll processing ({toHM(submission.totalOvertimeMinutes)})
                </span>
              )}
              {isRejected && (
                <span className="text-rose-600 dark:text-rose-400">
                  Review comments: {submission.leaderComments || 'Please adjust hours or justifications'}
                </span>
              )}
            </h3>

            <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground mt-1 flex-wrap">
              <span>Period: <strong>{submission.periodLabel}</strong></span>
              <span>•</span>
              <span>Total Overtime: <strong className="text-foreground">{toHM(submission.totalOvertimeMinutes)}</strong> ({submission.items.length} days)</span>
              <span>•</span>
              <span>Submitted: {new Date(submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(submission.submittedAt).toLocaleDateString()}</span>
              {submission.reviewedBy && (
                <>
                  <span>•</span>
                  <span>Reviewed by: <strong className="text-foreground">{submission.reviewedBy}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Navigate Button to Tab 2 */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            type="button"
            onClick={onNavigateToApprovals}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 whitespace-nowrap ${
              isPending
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20 ring-2 ring-amber-500/40'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            <span>👉 Open in Tab 2 (Team Leader View)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
