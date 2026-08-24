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
  Check,
  Edit3,
  RotateCcw,
  AlertCircle,
  Save,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import { ApprovalStatus, OvertimeDayItem, OvertimeSubmission, UserProfile } from '../types';
import { 
  getSubmissions, 
  updateEntireSubmissionStatus, 
  updateItemApproval, 
  updateItemOvertimeAdjustment, 
  resetItemOvertimeAdjustment 
} from '../utils/teamDatabase';
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

  // Overtime Editing State
  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);
  const [editHours, setEditHours] = useState<number>(0);
  const [editMinutes, setEditMinutes] = useState<number>(0);
  const [editReason, setEditReason] = useState<string>('');

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

  const handleStartEdit = (submissionId: string, item: OvertimeDayItem) => {
    const key = `${submissionId}_${item.date}`;
    setEditingItemKey(key);
    setEditHours(Math.floor(item.overtimeMinutes / 60));
    setEditMinutes(item.overtimeMinutes % 60);
    setEditReason(item.adjustedReason || item.leaderNotes || '');
  };

  const handleCancelEdit = () => {
    setEditingItemKey(null);
    setEditHours(0);
    setEditMinutes(0);
    setEditReason('');
  };

  const handleSaveOvertimeAdjustment = (
    submissionId: string,
    date: string,
    approveImmediately: boolean = false
  ) => {
    const totalMins = Math.max(0, (editHours || 0) * 60 + (editMinutes || 0));
    updateItemOvertimeAdjustment(
      submissionId,
      date,
      totalMins,
      editReason,
      approveImmediately,
      currentUser.name
    );
    setSubmissions(getSubmissions());
    setEditingItemKey(null);
    showToast(
      approveImmediately
        ? `Saved & Approved actual overtime (${toHM(totalMins)}) for ${date}`
        : `Updated overtime to ${toHM(totalMins)} for ${date}`
    );
  };

  const handleQuickZeroOut = (submissionId: string, item: OvertimeDayItem) => {
    const defaultReason = 'Adjusted to 0 hrs: Employee was not performing authorized work during this period.';
    updateItemOvertimeAdjustment(
      submissionId,
      item.date,
      0,
      defaultReason,
      true,
      currentUser.name
    );
    setSubmissions(getSubmissions());
    showToast(`Overtime zeroed out and verified for ${item.date}`);
  };

  const handleResetAdjustment = (submissionId: string, date: string) => {
    resetItemOvertimeAdjustment(submissionId, date);
    setSubmissions(getSubmissions());
    if (editingItemKey === `${submissionId}_${date}`) {
      setEditingItemKey(null);
    }
    showToast(`Restored original claimed overtime duration for ${date}`);
  };

  const handleApproveItem = (submissionId: string, date: string) => {
    updateItemApproval(
      submissionId,
      date,
      'approved',
      leaderCommentInputs[`${submissionId}_${date}`] || '',
      currentUser.name
    );
    setSubmissions(getSubmissions());
    showToast(`Approved overtime for ${date}`);
  };

  const handleRejectItem = (submissionId: string, date: string) => {
    updateItemApproval(
      submissionId,
      date,
      'rejected',
      leaderCommentInputs[`${submissionId}_${date}`] || 'Declined by Team Leader',
      currentUser.name
    );
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

    const headers = [
      'Employee Name',
      'SAP ID',
      'Department',
      'Date',
      'Day',
      'Standard Shift End',
      'Punch Check-Out',
      'Claimed OT Duration',
      'TL Authorized OT',
      'Hours Adjusted by TL?',
      'Leader Adjustment Justification',
      'Employee Justification',
      'Approval Status',
      'Reviewed & Approved By',
    ];

    const rows = approvedItems.map((item) => [
      submission.employeeName,
      submission.employeeId,
      submission.department,
      item.date,
      item.dayOfWeek,
      to12Hour(item.shiftEndStandard + ':00'),
      to12Hour(item.endTime),
      toHM(item.originalOvertimeMinutes ?? item.overtimeMinutes),
      toHM(item.overtimeMinutes),
      item.isAdjustedByLeader ? 'YES (Hours Corrected)' : 'NO (Accepted as Claimed)',
      item.adjustedReason || item.leaderNotes || 'N/A',
      item.reason,
      item.status.toUpperCase(),
      item.decidedBy || currentUser.name,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TL_Authorized_Overtime');
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
        <div className="fixed top-4 right-4 z-50 bg-amber-500 text-black px-4 py-2.5 rounded-xl shadow-xl text-xs font-mono font-bold flex items-center gap-2 animate-bounce border border-amber-400">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-xs">
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
                Team Leader Review Portal
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Reviewer: {currentUser.name} ({currentUser.title})
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Overtime Approval &amp; Duration Verification Center
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Review staff overtime claims, verify reasons, and <strong className="text-foreground">edit/correct actual overtime hours</strong> directly if an employee was not actually on overtime or added extra unverified time.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-center min-w-[110px]">
              <div className="text-[11px] text-amber-500 font-medium uppercase font-mono">Pending</div>
              <div className="text-lg font-bold text-amber-500 font-mono mt-0.5">{pendingCount} Submissions</div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-center min-w-[110px]">
              <div className="text-[11px] text-emerald-500 font-medium uppercase font-mono">Approved</div>
              <div className="text-lg font-bold text-emerald-500 font-mono mt-0.5">{approvedCount}</div>
            </div>
            <div className="bg-muted/50 border border-border rounded-2xl p-3 text-center min-w-[110px]">
              <div className="text-[11px] text-muted-foreground font-medium uppercase font-mono">Pending Hours</div>
              <div className="text-lg font-bold text-foreground font-mono mt-0.5">{fmtHours(totalHoursPending)}</div>
            </div>
          </div>
        </div>

        {/* Informative Guidance Ribbon */}
        <div className="mt-4 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2.5 text-xs text-muted-foreground font-mono">
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-foreground">Team Leader Overtime Editing Enabled:</strong> Click the <span className="text-amber-500 font-bold underline inline-flex items-center gap-1"><Edit3 className="w-3 h-3 inline" /> Edit OT</span> button on any day row to change the overtime duration to the true hours you authorize, zero out fake extra time (0 hrs), and save or approve with your official audit note.
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-4 mt-5 pt-4 border-t border-border flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase font-mono">Filter Status:</span>
            <div className="flex gap-1 bg-muted/40 p-1 rounded-xl border border-border">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 text-xs rounded-lg font-mono capitalize transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-card text-foreground shadow-2xs font-bold'
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
        <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No overtime submissions found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            {statusFilter === 'all'
              ? 'When team members click "Submit to Team Leader" on their timesheet, their overtime days will appear here for review and hour adjustment.'
              : `There are currently no submissions with "${statusFilter}" status.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((sub) => {
            const isExpanded = expandedId === sub.id || (expandedId === null && filteredSubmissions.length === 1);
            const pendingItemsCount = sub.items.filter((i) => i.status === 'pending').length;
            const approvedItemsCount = sub.items.filter((i) => i.status === 'approved').length;
            const adjustedItemsCount = sub.items.filter((i) => i.isAdjustedByLeader).length;

            const claimedTotalMins = sub.originalTotalOvertimeMinutes ?? sub.totalOvertimeMinutes;
            const currentTotalMins = sub.totalOvertimeMinutes;
            const isTotalAdjusted = claimedTotalMins !== currentTotalMins || adjustedItemsCount > 0;

            return (
              <div
                key={sub.id}
                className={`bg-card border rounded-3xl overflow-hidden transition-all shadow-xs ${
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
                  <div className="flex items-start md:items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground text-base">{sub.employeeName}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-muted text-muted-foreground border border-border">
                          SAP #{sub.employeeId}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-muted/60 text-muted-foreground flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {sub.department}
                        </span>
                        {adjustedItemsCount > 0 && (
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                            <Edit3 className="w-3 h-3" />
                            {adjustedItemsCount} {adjustedItemsCount === 1 ? 'day' : 'days'} hours adjusted by TL
                          </span>
                        )}
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
                      <div className="text-xs text-muted-foreground font-mono">
                        {isTotalAdjusted ? 'Authorized OT' : 'Total Overtime'}
                      </div>
                      <div className="text-base font-bold text-foreground font-mono flex items-center justify-end gap-1.5">
                        {isTotalAdjusted ? (
                          <>
                            <span className="line-through text-muted-foreground text-xs">{toHM(claimedTotalMins)}</span>
                            <span className="text-amber-500">{toHM(currentTotalMins)}</span>
                          </>
                        ) : (
                          <span>{toHM(currentTotalMins)}</span>
                        )}
                      </div>
                    </div>

                    <div className="px-3 py-1 rounded-xl text-xs font-semibold font-mono uppercase flex items-center gap-1.5 border">
                      {sub.status === 'pending' && (
                        <span className="text-amber-500">
                          ⏳ Pending ({pendingItemsCount})
                        </span>
                      )}
                      {sub.status === 'approved' && (
                        <span className="text-emerald-500">
                          ✓ Fully Approved ({approvedItemsCount})
                        </span>
                      )}
                      {sub.status === 'rejected' && (
                        <span className="text-rose-500">
                          ✕ Rejected
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="Expand/collapse submission details"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detailed Breakdown */}
                {isExpanded && (
                  <div className="border-t border-border p-5 bg-muted/10 space-y-4">
                    {/* Batch Actions Toolbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 rounded-2xl border border-border">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-mono font-bold text-foreground">
                          Overtime Days Review ({sub.items.length} days claimed)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleApproveAll(sub)}
                          className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve All Days
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectAll(sub)}
                          className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject All Days
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportApprovedToExcel(sub)}
                          className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-muted hover:bg-accent text-foreground border border-border flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Export Approved Excel
                        </button>
                      </div>
                    </div>

                    {/* Table of Days */}
                    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/60 text-muted-foreground uppercase font-mono text-[11px] border-b border-border">
                          <tr>
                            <th className="py-3 px-3.5">Date &amp; Day</th>
                            <th className="py-3 px-3">Standard Shift</th>
                            <th className="py-3 px-3">Punches (In / Out)</th>
                            <th className="py-3 px-3 min-w-[150px]">Overtime Duration</th>
                            <th className="py-3 px-3 w-1/3">Employee Justification &amp; Notes</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3.5 text-right">Team Leader Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {sub.items.map((item) => {
                            const isTue = item.dayOfWeek.toLowerCase().includes('tue');
                            const itemKey = `${sub.id}_${item.date}`;
                            const isCurrentlyEditing = editingItemKey === itemKey;
                            const claimedMins = item.originalOvertimeMinutes ?? item.overtimeMinutes;
                            const currentMins = item.overtimeMinutes;
                            const isAdjusted = item.isAdjustedByLeader || claimedMins !== currentMins;

                            return (
                              <React.Fragment key={item.date}>
                                <tr className={`hover:bg-muted/20 transition-colors ${isCurrentlyEditing ? 'bg-amber-500/5' : ''}`}>
                                  {/* Date & Day */}
                                  <td className="py-3.5 px-3.5 font-medium text-foreground whitespace-nowrap align-top">
                                    <div className="font-bold font-mono">{item.date}</div>
                                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                      <span>{item.dayOfWeek}</span>
                                      {isTue && (
                                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                          4 PM Tue
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Standard Shift */}
                                  <td className="py-3.5 px-3 text-muted-foreground whitespace-nowrap font-mono align-top">
                                    {isTue ? '04:00 PM' : to12Hour(item.shiftEndStandard + ':00')}
                                  </td>

                                  {/* Punches */}
                                  <td className="py-3.5 px-3 font-mono whitespace-nowrap align-top">
                                    <div className="text-foreground">{to12Hour(item.startTime)} – {to12Hour(item.endTime)}</div>
                                  </td>

                                  {/* Overtime Duration with Edit Controls */}
                                  <td className="py-3.5 px-3 align-top">
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {isAdjusted ? (
                                          <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-bold font-mono text-emerald-400 text-sm">
                                                {toHM(currentMins)}
                                              </span>
                                              <span className="text-[11px] font-mono text-muted-foreground line-through">
                                                {toHM(claimedMins)}
                                              </span>
                                            </div>
                                            <span className="text-[10px] font-mono text-purple-400 font-bold">
                                              ✏️ TL Adjusted ({currentMins > claimedMins ? `+${toHM(currentMins - claimedMins)}` : `-${toHM(claimedMins - currentMins)}`})
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="font-bold font-mono text-amber-500 text-sm">
                                            {toHM(currentMins)}
                                          </span>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => isCurrentlyEditing ? handleCancelEdit() : handleStartEdit(sub.id, item)}
                                          className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                                            isCurrentlyEditing
                                              ? 'bg-amber-500 text-black border-amber-500'
                                              : 'bg-muted/70 hover:bg-muted text-foreground border-border'
                                          }`}
                                          title="Click to edit/correct the actual overtime hours"
                                        >
                                          <Edit3 className="w-3 h-3 text-amber-500" />
                                          <span>{isCurrentlyEditing ? 'Close' : 'Edit OT'}</span>
                                        </button>
                                      </div>

                                      {/* Quick zero-out shortcut if employee didn't do OT */}
                                      {currentMins > 0 && !isCurrentlyEditing && (
                                        <button
                                          type="button"
                                          onClick={() => handleQuickZeroOut(sub.id, item)}
                                          className="text-[10px] font-mono text-muted-foreground hover:text-rose-400 text-left cursor-pointer underline flex items-center gap-1"
                                          title="Set to 0 hrs if employee was not actually on overtime"
                                        >
                                          <span>Set to 0 hrs (Reject extra time)</span>
                                        </button>
                                      )}

                                      {isAdjusted && !isCurrentlyEditing && (
                                        <button
                                          type="button"
                                          onClick={() => handleResetAdjustment(sub.id, item.date)}
                                          className="text-[10px] font-mono text-muted-foreground hover:text-amber-400 text-left cursor-pointer underline flex items-center gap-1"
                                          title="Revert back to original employee claimed time"
                                        >
                                          <RotateCcw className="w-2.5 h-2.5" />
                                          <span>Revert to claimed ({toHM(claimedMins)})</span>
                                        </button>
                                      )}
                                    </div>
                                  </td>

                                  {/* Employee Reason & Justification */}
                                  <td className="py-3.5 px-3 align-top">
                                    <div className="bg-muted/40 border border-border p-2.5 rounded-xl text-foreground text-xs leading-relaxed font-sans">
                                      <div className="flex items-center gap-1 text-[10px] text-amber-500 font-mono font-semibold uppercase mb-0.5">
                                        <MessageSquare className="w-3 h-3" />
                                        Employee Justification:
                                      </div>
                                      <div className="text-foreground">
                                        {item.reason || <span className="italic text-rose-500">No justification provided</span>}
                                      </div>
                                    </div>

                                    {/* Leader Adjustment Reason Note */}
                                    {item.adjustedReason && (
                                      <div className="mt-1.5 p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-[11px] text-purple-300 font-mono">
                                        <div className="font-bold flex items-center gap-1 text-purple-400">
                                          <Edit3 className="w-3 h-3" />
                                          TL Adjustment Justification:
                                        </div>
                                        <div>{item.adjustedReason}</div>
                                      </div>
                                    )}

                                    {item.leaderNotes && !item.adjustedReason && (
                                      <div className="mt-1 text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                                        <span>Leader Note: {item.leaderNotes}</span>
                                      </div>
                                    )}
                                  </td>

                                  {/* Status Badge */}
                                  <td className="py-3.5 px-3 whitespace-nowrap align-top">
                                    <span
                                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold font-mono uppercase inline-flex items-center gap-1 border ${
                                        item.status === 'approved'
                                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                          : item.status === 'rejected'
                                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                      }`}
                                    >
                                      {item.status === 'approved' && '✓ Approved'}
                                      {item.status === 'rejected' && '✕ Rejected'}
                                      {item.status === 'pending' && '⏳ Pending'}
                                    </span>
                                  </td>

                                  {/* Actions */}
                                  <td className="py-3.5 px-3.5 text-right whitespace-nowrap align-top">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleApproveItem(sub.id, item.date)}
                                        disabled={item.status === 'approved'}
                                        className={`p-2 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all flex items-center gap-1 shadow-2xs ${
                                          item.status === 'approved'
                                            ? 'bg-emerald-500/20 text-emerald-400 opacity-60'
                                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                        }`}
                                        title="Approve Day Overtime"
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="hidden lg:inline">Approve</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRejectItem(sub.id, item.date)}
                                        disabled={item.status === 'rejected'}
                                        className={`p-2 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all flex items-center gap-1 shadow-2xs ${
                                          item.status === 'rejected'
                                            ? 'bg-rose-500/20 text-rose-400 opacity-60'
                                            : 'bg-rose-600 hover:bg-rose-500 text-white'
                                        }`}
                                        title="Reject Day Overtime"
                                      >
                                        <XCircle className="w-4 h-4" />
                                        <span className="hidden lg:inline">Reject</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>

                                {/* INLINE EXPANDED OVERTIME EDITOR FOR TEAM LEADER */}
                                {isCurrentlyEditing && (
                                  <tr className="bg-amber-500/10 border-y-2 border-amber-500/40">
                                    <td colSpan={7} className="p-4 sm:p-5">
                                      <div className="bg-card border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-md">
                                        <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-border">
                                          <div className="flex items-center gap-2">
                                            <Edit3 className="w-4 h-4 text-amber-500" />
                                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                                              Team Leader Overtime Adjustment for {item.date} ({item.dayOfWeek})
                                            </span>
                                          </div>
                                          <span className="text-xs font-mono text-muted-foreground">
                                            Original Claimed: <strong className="text-foreground">{toHM(claimedMins)}</strong>
                                          </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {/* Left: Duration inputs & quick presets */}
                                          <div className="space-y-3">
                                            <label className="text-xs font-mono font-bold text-foreground block">
                                              1. Set Authorized Overtime Duration:
                                            </label>

                                            <div className="flex items-center gap-3">
                                              <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-3 py-1.5">
                                                <input
                                                  type="number"
                                                  min="0"
                                                  max="24"
                                                  value={editHours}
                                                  onChange={(e) => setEditHours(Math.max(0, parseInt(e.target.value) || 0))}
                                                  className="w-12 bg-transparent text-sm font-mono font-bold text-foreground focus:outline-hidden text-center"
                                                />
                                                <span className="text-xs font-mono text-muted-foreground">hours</span>
                                              </div>

                                              <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-3 py-1.5">
                                                <input
                                                  type="number"
                                                  min="0"
                                                  max="59"
                                                  step="5"
                                                  value={editMinutes}
                                                  onChange={(e) => setEditMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                                                  className="w-12 bg-transparent text-sm font-mono font-bold text-foreground focus:outline-hidden text-center"
                                                />
                                                <span className="text-xs font-mono text-muted-foreground">minutes</span>
                                              </div>

                                              <div className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
                                                = {toHM((editHours || 0) * 60 + (editMinutes || 0))}
                                              </div>
                                            </div>

                                            {/* Quick Duration Preset Pills */}
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="text-[11px] font-mono text-muted-foreground mr-1">Presets:</span>
                                              <button
                                                type="button"
                                                onClick={() => { setEditHours(0); setEditMinutes(0); }}
                                                className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 cursor-pointer"
                                              >
                                                🚫 0 hrs (No OT)
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => { setEditHours(0); setEditMinutes(30); }}
                                                className="px-2 py-1 rounded-lg text-xs font-mono bg-muted hover:bg-accent text-foreground border border-border cursor-pointer"
                                              >
                                                30 min
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => { setEditHours(1); setEditMinutes(0); }}
                                                className="px-2 py-1 rounded-lg text-xs font-mono bg-muted hover:bg-accent text-foreground border border-border cursor-pointer"
                                              >
                                                1h 00m
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => { setEditHours(1); setEditMinutes(30); }}
                                                className="px-2 py-1 rounded-lg text-xs font-mono bg-muted hover:bg-accent text-foreground border border-border cursor-pointer"
                                              >
                                                1h 30m
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => { setEditHours(2); setEditMinutes(0); }}
                                                className="px-2 py-1 rounded-lg text-xs font-mono bg-muted hover:bg-accent text-foreground border border-border cursor-pointer"
                                              >
                                                2h 00m
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setEditHours(Math.floor(claimedMins / 60));
                                                  setEditMinutes(claimedMins % 60);
                                                }}
                                                className="px-2 py-1 rounded-lg text-xs font-mono bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 cursor-pointer"
                                              >
                                                Reset to Claim
                                              </button>
                                            </div>
                                          </div>

                                          {/* Right: Team Leader adjustment justification note */}
                                          <div className="space-y-2">
                                            <label className="text-xs font-mono font-bold text-foreground block">
                                              2. Audit Note / Justification for Adjustment:
                                            </label>
                                            <textarea
                                              value={editReason}
                                              onChange={(e) => setEditReason(e.target.value)}
                                              placeholder="e.g. Employee left office at 17:00; verified with facility security logs. Adjusted from 3h to 1h."
                                              className="w-full bg-background border border-border focus:border-amber-500 rounded-xl p-2.5 text-xs font-mono text-foreground focus:outline-hidden min-h-[68px] resize-y"
                                            />
                                          </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center justify-end gap-2.5 mt-4 pt-3 border-t border-border flex-wrap">
                                          <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="px-3.5 py-1.5 rounded-xl text-xs font-mono bg-muted hover:bg-accent text-foreground border border-border cursor-pointer transition-colors"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleSaveOvertimeAdjustment(sub.id, item.date, false)}
                                            className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 cursor-pointer transition-colors flex items-center gap-1.5"
                                          >
                                            <Save className="w-3.5 h-3.5" />
                                            <span>Save Adjusted Time</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleSaveOvertimeAdjustment(sub.id, item.date, true)}
                                            className="px-4 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs cursor-pointer transition-all flex items-center gap-1.5"
                                          >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>✓ Save &amp; Approve with Adjusted Time</span>
                                          </button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
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

