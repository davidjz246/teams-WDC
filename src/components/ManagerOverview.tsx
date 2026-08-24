import React, { useState } from 'react';
import { 
  Users, 
  Clock, 
  Calendar, 
  Building, 
  Download, 
  Search, 
  X, 
  TrendingUp, 
  Award,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { OvertimeSubmission, UserProfile } from '../types';
import { getSubmissions, getTeamUsers } from '../utils/teamDatabase';
import { fmtHours, to12Hour, toHM } from '../utils/parser';
import * as XLSX from 'xlsx';

interface ManagerOverviewProps {
  currentUser: UserProfile;
  onNavigateTab?: (tab: 'team_leader_approvals' | 'manager_overview' | 'employee_ledger') => void;
}

export const ManagerOverview: React.FC<ManagerOverviewProps> = ({ currentUser, onNavigateTab }) => {
  const [submissions, setSubmissions] = useState<OvertimeSubmission[]>(() => getSubmissions());
  const [teamUsers] = useState<UserProfile[]>(() => getTeamUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<OvertimeSubmission | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Sync when storage updates
  React.useEffect(() => {
    const handleUpdate = () => {
      setSubmissions(getSubmissions());
    };
    window.addEventListener('team_submissions_updated', handleUpdate);
    return () => window.removeEventListener('team_submissions_updated', handleUpdate);
  }, []);

  // Compute aggregated team statistics
  const totalTeamOvertimeMinutes = submissions.reduce((acc, s) => acc + s.totalOvertimeMinutes, 0);
  const approvedOvertimeMinutes = submissions.reduce((acc, s) => {
    const appMin = s.items.filter((i) => i.status === 'approved').reduce((sum, item) => sum + item.overtimeMinutes, 0);
    return acc + appMin;
  }, 0);
  const pendingOvertimeMinutes = submissions.reduce((acc, s) => {
    const penMin = s.items.filter((i) => i.status === 'pending').reduce((sum, item) => sum + item.overtimeMinutes, 0);
    return acc + penMin;
  }, 0);

  const departments = Array.from(new Set(submissions.map((s) => s.department).concat(teamUsers.map((u) => u.department))));

  const filteredSubmissions = submissions.filter((sub) => {
    const matchQuery = 
      sub.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.employeeId.includes(searchQuery) ||
      sub.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = departmentFilter === 'all' || sub.department === departmentFilter;
    return matchQuery && matchDept;
  });

  // Export Master Consolidated Company Excel
  const handleExportMasterConsolidatedExcel = () => {
    if (submissions.length === 0) {
      alert('No overtime submissions available to export.');
      return;
    }

    const headers = [
      'Employee Name',
      'SAP ID',
      'Department',
      'Date',
      'Day',
      'Standard Shift End',
      'Check-out Time',
      'Overtime Duration',
      'Mandatory Reason / Justification',
      'Approval Status',
      'Reviewed By',
    ];

    const allRows: (string | number)[][] = [];

    submissions.forEach((sub) => {
      sub.items.forEach((item) => {
        allRows.push([
          sub.employeeName,
          sub.employeeId,
          sub.department,
          item.date,
          item.dayOfWeek,
          to12Hour(item.shiftEndStandard + ':00'),
          to12Hour(item.endTime),
          toHM(item.overtimeMinutes),
          item.reason,
          item.status.toUpperCase(),
          item.decidedBy || sub.reviewedBy || 'Pending',
        ]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...allRows]);
    ws['!cols'] = [
      { wch: 30 },
      { wch: 12 },
      { wch: 25 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 50 },
      { wch: 16 },
      { wch: 25 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Master_Team_Overtime');
    XLSX.writeFile(wb, `WDC_Master_Department_Overtime_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
        {onNavigateTab && (
          <div className="mb-4 pb-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
              <span className="text-xs font-mono font-bold text-foreground uppercase tracking-wide">
                Active View: Manager Overview &amp; Team Matrix (Tab 3)
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
                onClick={() => onNavigateTab('team_leader_approvals')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>👉 Go to Tab 2: Team Leader Approvals</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold uppercase bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                Executive Manager Portal
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Director: {currentUser.name} ({currentUser.title})
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Department Overtime Matrix & Executive Overview
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Track overall team overtime accumulation, review employee justifications, and export consolidated payroll spreadsheets.
            </p>
          </div>

          {/* Master Export Button */}
          <button
            type="button"
            onClick={handleExportMasterConsolidatedExcel}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Master Team Excel</span>
          </button>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-border">
          <div className="bg-muted/40 border border-border rounded-lg p-3.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Total Overtime Claimed</span>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono mt-1">
              {fmtHours(totalTeamOvertimeMinutes)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Across all departments</div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3.5">
            <div className="flex items-center gap-2 text-xs text-emerald-500 font-mono">
              <Award className="w-3.5 h-3.5" />
              <span>Approved Overtime</span>
            </div>
            <div className="text-2xl font-bold text-emerald-500 font-mono mt-1">
              {fmtHours(approvedOvertimeMinutes)}
            </div>
            <div className="text-[11px] text-emerald-600/80 mt-0.5">Ready for payroll export</div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3.5">
            <div className="flex items-center gap-2 text-xs text-amber-500 font-mono">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Pending TL Review</span>
            </div>
            <div className="text-2xl font-bold text-amber-500 font-mono mt-1">
              {fmtHours(pendingOvertimeMinutes)}
            </div>
            <div className="text-[11px] text-amber-600/80 mt-0.5">Awaiting team lead signoff</div>
          </div>

          <div className="bg-muted/40 border border-border rounded-lg p-3.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Active Submissions</span>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono mt-1">
              {submissions.length} Staff Files
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Current 16th–15th cycle</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee name, SAP ID, dept..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-mono text-muted-foreground">Department:</span>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Overtime Matrix Table */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
          <h3 className="text-base font-semibold text-foreground">No Employee Records Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            When employees submit their monthly timesheets and overtime claims, their details and justifications will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide font-mono text-muted-foreground">
              Team Member Overtime Matrix (Click any employee for detailed report)
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              {filteredSubmissions.length} Employees Filed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground uppercase font-mono text-[11px] border-b border-border">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">SAP ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Cycle Period</th>
                  <th className="py-3 px-4">OT Days</th>
                  <th className="py-3 px-4">Total Hours</th>
                  <th className="py-3 px-4">Approval State</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSubmissions.map((sub) => {
                  const approvedItems = sub.items.filter((i) => i.status === 'approved').length;
                  return (
                    <tr
                      key={sub.id}
                      onClick={() => setSelectedSubmission(sub)}
                      className="hover:bg-primary/5 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-bold text-foreground group-hover:text-primary transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-[11px]">
                            {sub.employeeName.slice(0, 2).toUpperCase()}
                          </div>
                          <span>{sub.employeeName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">
                        #{sub.employeeId}
                      </td>

                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-muted-foreground" />
                          {sub.department}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">
                        {sub.periodLabel}
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-foreground whitespace-nowrap">
                        {sub.items.length} Days
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-amber-500 whitespace-nowrap">
                        {fmtHours(sub.totalOvertimeMinutes)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono uppercase inline-flex items-center gap-1 ${
                            sub.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                              : sub.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                          }`}
                        >
                          {sub.status === 'approved' && `✓ Approved (${approvedItems}/${sub.items.length})`}
                          {sub.status === 'pending' && `⏳ Pending (${approvedItems}/${sub.items.length})`}
                          {sub.status === 'rejected' && `✕ Rejected`}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border cursor-pointer transition-all"
                        >
                          View Report →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drilldown Detailed Employee Overtime Report Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-start justify-between gap-4 bg-muted/20 sticky top-0 bg-card z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                    Employee Report
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    SAP #{selectedSubmission.employeeId}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground mt-1">
                  {selectedSubmission.employeeName}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span>{selectedSubmission.department}</span>
                  <span>•</span>
                  <span>Period: {selectedSubmission.periodLabel}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Highlighted Executive Statement requested by user */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-foreground">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">
                      Overtime Claim & Justification Statement:
                    </h4>
                    <p className="text-xs text-foreground/90 mt-1 leading-relaxed">
                      This user has recorded a total of{' '}
                      <strong className="text-amber-500 font-mono font-bold">
                        {fmtHours(selectedSubmission.totalOvertimeMinutes)}
                      </strong>{' '}
                      overtime across <strong className="font-bold">{selectedSubmission.items.length} days</strong> in this cycle. Details and justifications for each day are documented below.
                    </p>
                  </div>
                </div>
              </div>

              {/* Day by Day Table with Exact Reason */}
              <div>
                <h4 className="text-xs font-bold font-mono uppercase text-muted-foreground mb-3">
                  Itemized Daily Overtime & Justifications
                </h4>
                <div className="space-y-3">
                  {selectedSubmission.items.map((item, idx) => {
                    const isTue = item.dayOfWeek.toLowerCase().includes('tue');
                    return (
                      <div
                        key={item.date}
                        className="p-4 rounded-lg border border-border bg-background hover:border-primary/40 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground font-mono text-sm">
                              {item.date}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({item.dayOfWeek})
                            </span>
                            {isTue && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                4 PM Shift Rule
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-muted-foreground">
                              {to12Hour(item.startTime)} – {to12Hour(item.endTime)}
                            </span>
                            <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                              + {fmtHours(item.overtimeMinutes)}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase ${
                                item.status === 'approved'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : item.status === 'rejected'
                                  ? 'bg-rose-500/10 text-rose-500'
                                  : 'bg-amber-500/10 text-amber-500'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>

                        {/* Stated Reason Box */}
                        <div className="bg-muted/40 p-2.5 rounded-md border border-border/60 text-xs">
                          <span className="font-mono font-bold text-[11px] text-muted-foreground uppercase mr-1">
                            Reason for Overtime:
                          </span>
                          <span className="text-foreground font-medium">
                            {item.reason || <span className="italic text-rose-400">No reason provided</span>}
                          </span>
                        </div>

                        {item.leaderNotes && (
                          <div className="text-[11px] text-muted-foreground font-mono">
                            TL Note: {item.leaderNotes} (by {item.decidedBy || 'Leader'})
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between gap-3 sticky bottom-0 bg-card">
              <div className="text-xs text-muted-foreground font-mono">
                Total Overtime: {fmtHours(selectedSubmission.totalOvertimeMinutes)}
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
