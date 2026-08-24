import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Calendar, 
  Building, 
  Filter, 
  Download, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Check
} from 'lucide-react';
import { ApprovalStatus, OvertimeSubmission, UserProfile } from '../types';
import { getSubmissions, updateEntireSubmissionStatus, updateItemApproval } from '../utils/teamDatabase';
import { fmtHours, to12Hour, toHM } from '../utils/parser';
import * as XLSX from 'xlsx';

interface TeamLeaderApprovalsProps {
  currentUser: UserProfile;
  onNavigateTab?: (tab: 'team_leader_approvals' | 'manager_overview' | 'employee_ledger') => void;
}

export const TeamLeaderApprovals: React.FC<TeamLeaderApprovalsProps> = ({ currentUser, onNavigateTab }) => {
  const [submissions, setSubmissions] = useState<OvertimeSubmission[]>(() => getSubmissions());
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [leaderCommentInputs, setLeaderCommentInputs] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reload submissions when database updates
  React.useEffect(() => {
    const handleUpdate = () => {
      setSubmissions(getSubmissions());
    };
    window.addEventListener('team_submissions_updated', handleUpdate);
    return () => window.removeEventListener('team_submissions_updated', handleUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApproveItem = (submissionId: string, date: string) => {
    updateItemApproval(submissionId, date, 'approved', leaderCommentInputs[`${submissionId}_${date}`] || '', currentUser.name);
    setSubmissions(getSubmissions());
    showToast(`Approved overtime for ${date}`);
  };

  const handleRejectItem = (submissionId: string, date: string) => {
    updateItemApproval(submissionId, date, 'rejected', leaderCommentInputs[`${submissionId}_${date}`] || 'Declined by Team Leader', currentUser.name);
    setSubmissions(getSubmissions());
    showToast(`Rejected overtime for ${date}`);
  };

  const handleApproveAll = (submission: OvertimeSubmission) => {
    updateEntireSubmissionStatus(submission.id, 'approved', 'Approved by ' + currentUser.name, currentUser.name);
    setSubmissions(getSubmissions());
    showToast(`All overtime claims approved for ${submission.employeeName}`);
  };

  const handleRejectAll = (submission: OvertimeSubmission) => {
    updateEntireSubmissionStatus(submission.id, 'rejected', 'Declined by ' + currentUser.name, currentUser.name);
    setSubmissions(getSubmissions());
    showToast(`Submission rejected for ${submission.employeeName}`);
  };

  const handleExportApprovedToExcel = (submission: OvertimeSubmission) => {
    const approvedItems = submission.items.filter((i) => i.status === 'approved');
    if (approvedItems.length === 0) {
      alert('No approved overtime items found to export in this submission.');
      return;
    }

    const headers = ['Employee Name', 'SAP ID', 'Department', 'Date', 'Day', 'From', 'To', 'Overtime', 'Reason', 'Approval Status', 'Approved By'];
    const rows = approvedItems.map((item) => [
      submission.employeeName,
      submission.employeeId,
      submission.department,
      item.date,
      item.dayOfWeek,
      to12Hour(item.shiftEndStandard + ':00'),
      to12Hour(item.endTime),
      toHM(item.overtimeMinutes),
      item.reason,
      item.status.toUpperCase(),
      item.decidedBy || currentUser.name,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TL_Approved_Overtime');
    XLSX.writeFile(wb, `TL_Approved_${submission.employeeId}_${submission.employeeName.replace(/\s+/g, '_')}.xlsx`);
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (statusFilter === 'all') return true;
    return sub.status === statusFilter;
  });

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;
  const totalHoursPending = submissions
    .filter((s) => s.status === 'pending')
    .reduce((acc, curr) => acc + curr.totalOvertimeMinutes, 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
        {onNavigateTab && (
          <div className="mb-4 pb-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              <span className="text-xs font-mono font-bold text-foreground uppercase tracking-wide">
                Active View: Team Leader Approvals (Tab 2)
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onNavigateTab('employee_ledger')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-muted hover:bg-accent text-foreground border border-border flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>👈 Return to Tab 1: Employee Timesheet</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('manager_overview')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>👉 Go to Tab 3: Manager Matrix</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Team Leader Portal
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Reviewer: {currentUser.name} ({currentUser.title})
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Overtime Approval & Verification Center
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Review and authorize staff overtime claims, verify mandatory justifications, and stamp monthly payroll logs.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center min-w-[110px]">
              <div className="text-xs text-amber-500 font-medium uppercase font-mono">Pending</div>
              <div className="text-xl font-bold text-amber-500 font-mono mt-0.5">{pendingCount} Submissions</div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center min-w-[110px]">
              <div className="text-xs text-emerald-500 font-medium uppercase font-mono">Approved</div>
              <div className="text-xl font-bold text-emerald-500 font-mono mt-0.5">{approvedCount}</div>
            </div>
            <div className="bg-muted/50 border border-border rounded-lg p-3 text-center min-w-[110px]">
              <div className="text-xs text-muted-foreground font-medium uppercase font-mono">Pending Hours</div>
              <div className="text-xl font-bold text-foreground font-mono mt-0.5">{fmtHours(totalHoursPending)}</div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase font-mono">Filter Status:</span>
            <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border border-border">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 text-xs rounded-md font-medium capitalize transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-card text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            Showing {filteredSubmissions.length} of {submissions.length} submission packets
          </div>
        </div>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No overtime submissions found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            {statusFilter === 'all'
              ? 'When team members click "Submit to Team Leader" on their ledger, their overtime days and justifications will appear here for your review.'
              : `There are currently no submissions with "${statusFilter}" status.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((sub) => {
            const isExpanded = expandedId === sub.id || filteredSubmissions.length === 1;
            const pendingItemsCount = sub.items.filter((i) => i.status === 'pending').length;
            const approvedItemsCount = sub.items.filter((i) => i.status === 'approved').length;

            return (
              <div
                key={sub.id}
                className={`bg-card border rounded-xl overflow-hidden transition-all shadow-xs ${
                  sub.status === 'pending'
                    ? 'border-amber-500/40 hover:border-amber-500/60'
                    : sub.status === 'approved'
                    ? 'border-emerald-500/40'
                    : 'border-rose-500/30'
                }`}
              >
                {/* Card Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start md:items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground text-base">{sub.employeeName}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                          SAP #{sub.employeeId}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-muted/60 text-muted-foreground flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {sub.department}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {sub.periodLabel}
                        </span>
                        <span>•</span>
                        <span>Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges and Actions */}
                  <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground font-mono">Total Overtime</div>
                      <div className="text-base font-bold text-foreground font-mono">
                        {fmtHours(sub.totalOvertimeMinutes)}
                      </div>
                    </div>

                    <div className="px-3 py-1 rounded-full text-xs font-semibold font-mono uppercase flex items-center gap-1.5 border">
                      {sub.status === 'pending' && (
                        <span className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                          ⏳ Pending Review ({pendingItemsCount})
                        </span>
                      )}
                      {sub.status === 'approved' && (
                        <span className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                          ✓ Fully Approved ({approvedItemsCount})
                        </span>
                      )}
                      {sub.status === 'rejected' && (
                        <span className="bg-rose-500/10 text-rose-500 border-rose-500/30">
                          ✕ Rejected
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detailed Breakdown */}
                {isExpanded && (
                  <div className="border-t border-border p-5 bg-muted/10 space-y-4">
                    {/* Batch Actions Toolbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border">
                      <span className="text-xs font-medium text-muted-foreground">
                        Detailed Overtime Days & Mandatory Justifications ({sub.items.length} days)
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleApproveAll(sub)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve All Days
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectAll(sub)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject All Days
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportApprovedToExcel(sub)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Export Approved Excel
                        </button>
                      </div>
                    </div>

                    {/* Table of Days */}
                    <div className="overflow-x-auto rounded-lg border border-border bg-card">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/60 text-muted-foreground uppercase font-mono text-[11px] border-b border-border">
                          <tr>
                            <th className="py-2.5 px-3">Date & Day</th>
                            <th className="py-2.5 px-3">Standard Shift</th>
                            <th className="py-2.5 px-3">Punches (In / Out)</th>
                            <th className="py-2.5 px-3">OT Duration</th>
                            <th className="py-2.5 px-3 w-1/3">Mandatory Employee Reason</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">TL Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {sub.items.map((item) => {
                            const isTue = item.dayOfWeek.toLowerCase().includes('tue');
                            return (
                              <tr key={item.date} className="hover:bg-muted/30">
                                <td className="py-3 px-3 font-medium text-foreground whitespace-nowrap">
                                  <div className="font-bold">{item.date}</div>
                                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    {item.dayOfWeek}
                                    {isTue && (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                        4 PM Shift
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="py-3 px-3 text-muted-foreground whitespace-nowrap font-mono">
                                  {isTue ? '04:00 PM' : to12Hour(item.shiftEndStandard + ':00')}
                                </td>

                                <td className="py-3 px-3 font-mono whitespace-nowrap">
                                  <div className="text-foreground">{to12Hour(item.startTime)} – {to12Hour(item.endTime)}</div>
                                </td>

                                <td className="py-3 px-3 font-bold font-mono text-amber-500 whitespace-nowrap">
                                  {fmtHours(item.overtimeMinutes)}
                                </td>

                                <td className="py-3 px-3">
                                  <div className="bg-amber-500/5 border border-amber-500/20 p-2 rounded text-foreground text-xs leading-relaxed font-sans">
                                    <div className="flex items-center gap-1 text-[10px] text-amber-500 font-mono font-semibold uppercase mb-0.5">
                                      <MessageSquare className="w-3 h-3" />
                                      Employee Justification:
                                    </div>
                                    {item.reason || <span className="italic text-rose-500">No reason provided</span>}
                                  </div>

                                  {item.leaderNotes && (
                                    <div className="mt-1 text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                                      <span>Leader Note: {item.leaderNotes}</span>
                                    </div>
                                  )}
                                </td>

                                <td className="py-3 px-3 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] font-semibold font-mono uppercase inline-flex items-center gap-1 ${
                                      item.status === 'approved'
                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                                        : item.status === 'rejected'
                                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                                    }`}
                                  >
                                    {item.status === 'approved' && '✓ Approved'}
                                    {item.status === 'rejected' && '✕ Rejected'}
                                    {item.status === 'pending' && '⏳ Pending'}
                                  </span>
                                </td>

                                <td className="py-3 px-3 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleApproveItem(sub.id, item.date)}
                                      disabled={item.status === 'approved'}
                                      className={`p-1.5 rounded-md text-xs font-medium cursor-pointer transition-all ${
                                        item.status === 'approved'
                                          ? 'bg-emerald-500/20 text-emerald-500 opacity-60'
                                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                      }`}
                                      title="Approve Day Overtime"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRejectItem(sub.id, item.date)}
                                      disabled={item.status === 'rejected'}
                                      className={`p-1.5 rounded-md text-xs font-medium cursor-pointer transition-all ${
                                        item.status === 'rejected'
                                          ? 'bg-rose-500/20 text-rose-500 opacity-60'
                                          : 'bg-rose-600 hover:bg-rose-700 text-white'
                                      }`}
                                      title="Reject Day Overtime"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
