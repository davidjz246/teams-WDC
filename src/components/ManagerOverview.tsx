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
  FileSpreadsheet, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Edit3 
} from 'lucide-react';
import { OvertimeSubmission, TeamInfo, UserProfile } from '../types';
import { getSubmissions, getTeamUsers, getTeams, filterSubmissionsForUser } from '../utils/teamDatabase';
import { fmtHours, to12Hour, toHM } from '../utils/parser';
import { useLanguage } from '../i18n/LanguageContext';
import * as XLSX from 'xlsx';

interface ManagerOverviewProps {
  currentUser: UserProfile;
  onNavigateTab?: (tab: 'team_leader_approvals' | 'manager_overview' | 'employee_ledger') => void;
}

export const ManagerOverview: React.FC<ManagerOverviewProps> = ({ currentUser, onNavigateTab }) => {
  const { t, language } = useLanguage();
  const [submissions, setSubmissions] = useState<OvertimeSubmission[]>(() => getSubmissions());
  const [teamUsers, setTeamUsers] = useState<UserProfile[]>(() => getTeamUsers());
  const [teams, setTeams] = useState<TeamInfo[]>(() => getTeams());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<OvertimeSubmission | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  // Sync when storage updates
  React.useEffect(() => {
    const handleUpdate = () => {
      setSubmissions(getSubmissions());
      setTeams(getTeams());
      setTeamUsers(getTeamUsers());
    };
    window.addEventListener('team_submissions_updated', handleUpdate);
    window.addEventListener('teams_updated', handleUpdate);
    window.addEventListener('team_users_updated', handleUpdate);
    return () => {
      window.removeEventListener('team_submissions_updated', handleUpdate);
      window.removeEventListener('teams_updated', handleUpdate);
      window.removeEventListener('team_users_updated', handleUpdate);
    };
  }, []);

  // Filter based on user role and permissions
  const allowedSubmissions = filterSubmissionsForUser(submissions, currentUser);

  // Compute aggregated team statistics
  const totalTeamOvertimeMinutes = allowedSubmissions.reduce((acc, s) => acc + s.totalOvertimeMinutes, 0);
  const approvedOvertimeMinutes = allowedSubmissions.reduce((acc, s) => {
    const appMin = s.items.filter((i) => i.status === 'approved').reduce((sum, item) => sum + item.overtimeMinutes, 0);
    return acc + appMin;
  }, 0);
  const pendingOvertimeMinutes = allowedSubmissions.reduce((acc, s) => {
    const penMin = s.items.filter((i) => i.status === 'pending').reduce((sum, item) => sum + item.overtimeMinutes, 0);
    return acc + penMin;
  }, 0);

  const departments = Array.from(new Set(allowedSubmissions.map((s) => s.department).concat(teamUsers.map((u) => u.department))));

  const filteredSubmissions = allowedSubmissions.filter((sub) => {
    const matchQuery = 
      sub.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.employeeId.includes(searchQuery) ||
      sub.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.teamName && sub.teamName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchDept = departmentFilter === 'all' || sub.department === departmentFilter;
    const matchTeam = teamFilter === 'all' || sub.teamId === teamFilter;
    return matchQuery && matchDept && matchTeam;
  });

  // Export Master Consolidated Company Excel
  const handleExportMasterConsolidatedExcel = () => {
    if (allowedSubmissions.length === 0) {
      alert(t('val.no_ot_export', 'No overtime submissions available to export.'));
      return;
    }

    const headers = [
      'Employee Name',
      'SAP ID',
      'Team Name',
      'Department',
      'Date',
      'Day',
      'Standard Shift End',
      'Check-out Time',
      'Claimed OT Duration',
      'TL Authorized OT',
      'Adjusted by TL?',
      'TL Adjustment Justification',
      'Mandatory Reason / Justification',
      'Approval Status',
      'Reviewed By',
    ];

    const allRows: (string | number)[][] = [];

    allowedSubmissions.forEach((sub) => {
      sub.items.forEach((item) => {
        allRows.push([
          sub.employeeName,
          sub.employeeId,
          sub.teamName || 'N/A',
          sub.department,
          item.date,
          item.dayOfWeek,
          to12Hour(item.shiftEndStandard + ':00'),
          to12Hour(item.endTime),
          toHM(item.originalOvertimeMinutes ?? item.overtimeMinutes),
          toHM(item.overtimeMinutes),
          item.isAdjustedByLeader ? 'YES (Adjusted)' : 'NO',
          item.adjustedReason || item.leaderNotes || 'N/A',
          item.reason,
          item.status.toUpperCase(),
          item.decidedBy || sub.reviewedBy || 'Pending',
        ]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...allRows]);
    ws['!cols'] = [
      { wch: 25 },
      { wch: 12 },
      { wch: 22 },
      { wch: 20 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 35 },
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
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-2xs">
        {onNavigateTab && (
          <div className="mb-4 pb-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
              <span className="text-xs font-mono font-bold text-foreground uppercase tracking-wide">
                {t('mgr.view_active', 'Active View: Manager Overview & Team Matrix (Tab 3)')}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onNavigateTab('employee_ledger')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-muted hover:bg-accent text-foreground border border-border flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>{t('mgr.return_tab1', '👈 Return to Tab 1: Employee Timesheet')}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('team_leader_approvals')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>{t('mgr.goto_tab2', '👉 Go to Tab 2: Team Leader Approvals')}</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {t('mgr.portal_title', 'Executive Manager Portal')}
              </span>
              <span className="text-xs text-muted-foreground font-mono font-bold">
                {t('role.manager', 'Manager')}: {currentUser.name}
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {t('mgr.matrix_title', 'Department Overtime Matrix & Executive Overview')}
            </h2>
          </div>

          {/* Master Export Button */}
          <button
            type="button"
            onClick={handleExportMasterConsolidatedExcel}
            className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 cursor-pointer shadow-2xs shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t('mgr.export_master_btn', 'Export Master Team Excel')}</span>
          </button>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-border">
          <div className="bg-muted/40 border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{t('mgr.kpi_total_claimed', 'Total Overtime Claimed')}</span>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono mt-1">
              {fmtHours(totalTeamOvertimeMinutes)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{t('mgr.kpi_assigned_scope', 'Across assigned scope')}</div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <Award className="w-3.5 h-3.5" />
              <span>{t('mgr.kpi_approved_ot', 'Approved Overtime')}</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              {fmtHours(approvedOvertimeMinutes)}
            </div>
            <div className="text-[11px] text-emerald-500/80 mt-0.5">{t('mgr.kpi_ready_payroll', 'Ready for payroll export')}</div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{t('mgr.kpi_pending_review', 'Pending TL Review')}</span>
            </div>
            <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
              {fmtHours(pendingOvertimeMinutes)}
            </div>
            <div className="text-[11px] text-amber-500/80 mt-0.5">{t('mgr.kpi_awaiting_lead', 'Awaiting team lead signoff')}</div>
          </div>

          <div className="bg-muted/40 border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('mgr.kpi_active_subs', 'Active Submissions')}</span>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono mt-1">
              {allowedSubmissions.length} {t('mgr.staff_files', 'Staff Files')}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{t('mgr.current_cycle', 'Current 16th–15th cycle')}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('mgr.search_placeholder', 'Search employee name, SAP ID, team...')}
            className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-muted-foreground">{t('tl.team_label', 'Team:')}</span>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="text-xs font-mono rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-hidden"
            >
              <option value="all">{t('tl.all_teams', 'All Teams')} ({teams.length})</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-muted-foreground">{t('mgr.dept_label', 'Dept:')}</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="text-xs font-mono rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-hidden"
            >
              <option value="all">{t('mgr.all_depts', 'All Departments')}</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Overtime Matrix Table */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-2xs">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
          <h3 className="text-base font-semibold text-foreground">{t('mgr.no_records', 'No Employee Records Found')}</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {t('mgr.no_records_desc', 'When employees submit their monthly timesheets and overtime claims, their details and justifications will appear here.')}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide font-mono text-muted-foreground">
              {t('mgr.matrix_subhead', 'Team Member Overtime Matrix (Click any employee for detailed report)')}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              {filteredSubmissions.length} {t('mgr.emp_filed', 'Employees Filed')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground uppercase font-mono text-[11px] border-b border-border">
                <tr>
                  <th className="py-3 px-4">{t('mgr.col_emp', 'Employee')}</th>
                  <th className="py-3 px-4">{t('export.sap_id', 'SAP ID')}</th>
                  <th className="py-3 px-4">{t('tl.team_label', 'Team')}</th>
                  <th className="py-3 px-4">{t('export.dept', 'Department')}</th>
                  <th className="py-3 px-4">{t('mgr.col_cycle', 'Cycle Period')}</th>
                  <th className="py-3 px-4">{t('mgr.col_ot_days', 'OT Days')}</th>
                  <th className="py-3 px-4">{t('mgr.col_total_hrs', 'Total Hours')}</th>
                  <th className="py-3 px-4">{t('mgr.col_state', 'Approval State')}</th>
                  <th className="py-3 px-4 text-right">{t('mgr.col_action', 'Action')}</th>
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
                          <div className="w-7 h-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-[11px]">
                            {sub.employeeName.slice(0, 2).toUpperCase()}
                          </div>
                          <span>{sub.employeeName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">
                        #{sub.employeeId}
                      </td>

                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[11px]">
                          {sub.teamName || 'Team'}
                        </span>
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
                        {sub.items.length} {t('mgr.days', 'Days')}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-amber-500 whitespace-nowrap">
                        {fmtHours(sub.totalOvertimeMinutes)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold font-mono uppercase inline-flex items-center gap-1 ${
                            sub.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : sub.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {sub.status === 'approved' && `✓ ${t('tl.status_approved', 'Approved')} (${approvedItems}/${sub.items.length})`}
                          {sub.status === 'pending' && `⏳ ${t('tl.status_pending', 'Pending')} (${approvedItems}/${sub.items.length})`}
                          {sub.status === 'rejected' && `✕ ${t('tl.status_rejected', 'Rejected')}`}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-xl text-xs font-mono font-semibold bg-muted hover:bg-accent text-foreground border border-border cursor-pointer transition-all"
                        >
                          {t('mgr.view_report', 'View Report →')}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                  {selectedSubmission.employeeName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span>{selectedSubmission.employeeName}</span>
                    <span className="text-xs font-mono font-normal text-muted-foreground">
                      (SAP #{selectedSubmission.employeeId})
                    </span>
                    {selectedSubmission.teamName && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {selectedSubmission.teamName}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedSubmission.department} • Cycle: {selectedSubmission.periodLabel}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/40 p-3.5 rounded-2xl border border-border text-center">
                  <div className="text-[11px] text-muted-foreground font-mono uppercase">{t('mgr.kpi_total_claimed', 'Total OT Claimed')}</div>
                  <div className="text-lg font-bold text-foreground font-mono mt-0.5">
                    {fmtHours(selectedSubmission.totalOvertimeMinutes)}
                  </div>
                </div>
                <div className="bg-muted/40 p-3.5 rounded-2xl border border-border text-center">
                  <div className="text-[11px] text-muted-foreground font-mono uppercase">{t('mgr.col_ot_days', 'Days with Overtime')}</div>
                  <div className="text-lg font-bold text-foreground font-mono mt-0.5">
                    {selectedSubmission.items.length} {t('mgr.days', 'Days')}
                  </div>
                </div>
                <div className="bg-muted/40 p-3.5 rounded-2xl border border-border text-center">
                  <div className="text-[11px] text-muted-foreground font-mono uppercase">{t('mgr.col_state', 'Review Status')}</div>
                  <div className="text-lg font-bold text-amber-400 font-mono mt-0.5 capitalize">
                    {selectedSubmission.status}
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground uppercase font-mono text-[11px] border-b border-border">
                    <tr>
                      <th className="py-2.5 px-3">{t('table.col_date', 'Date')}</th>
                      <th className="py-2.5 px-3">{t('rules.shift_end_std', 'Shift Standard')}</th>
                      <th className="py-2.5 px-3">{t('tl.col_punch_shift', 'Actual Out')}</th>
                      <th className="py-2.5 px-3">{t('tl.col_authorized_ot', 'OT Authorized')}</th>
                      <th className="py-2.5 px-3">{t('tl.col_justification', 'Mandatory Employee Justification')}</th>
                      <th className="py-2.5 px-3">{t('tl.portal_title', 'TL Review')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedSubmission.items.map((item) => (
                      <tr key={item.date} className="hover:bg-muted/20">
                        <td className="py-2.5 px-3 font-mono font-medium text-foreground whitespace-nowrap">
                          {item.date} ({item.dayOfWeek.slice(0, 3)})
                        </td>
                        <td className="py-2.5 px-3 font-mono text-muted-foreground whitespace-nowrap">
                          {to12Hour(item.shiftEndStandard + ':00')}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-muted-foreground whitespace-nowrap">
                          {to12Hour(item.endTime)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                          {toHM(item.overtimeMinutes)}
                        </td>
                        <td className="py-2.5 px-3 max-w-xs text-foreground">
                          {item.reason || <span className="text-rose-400 italic">{t('export.err_reasons', 'No reason provided')}</span>}
                        </td>
                        <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                          {item.status === 'approved' && (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> {t('tl.status_approved', 'Approved')}
                            </span>
                          )}
                          {item.status === 'rejected' && (
                            <span className="text-rose-400 font-semibold flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> {t('tl.status_rejected', 'Rejected')}
                            </span>
                          )}
                          {item.status === 'pending' && (
                            <span className="text-amber-400 font-semibold">⏳ {t('tl.status_pending', 'Pending')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-mono text-xs font-semibold rounded-xl border border-border cursor-pointer"
              >
                {t('common.close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
