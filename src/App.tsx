import React, { useEffect, useState } from 'react';
import { 
  ActiveAppTab, 
  DayCategory, 
  ExportSettings, 
  OvertimeSubmission, 
  PermissionStatus, 
  RuleSettings, 
  ThemeMode, 
  UserProfile 
} from './types';
import {
  classifyDay,
  exportOvertimeToExcel,
  fmtHours,
  parseRows,
  to12Hour,
  toHM,
  weekdayOf,
} from './utils/parser';
import {
  lookupEmployeeById,
  saveEmployeeMapping,
  normalizeEmployeeId,
} from './utils/employeeDirectory';
import { 
  getActiveUser, 
  getSubmissions, 
  saveSubmission, 
  setActiveUser 
} from './utils/teamDatabase';
import { Masthead } from './components/Masthead';
import { RawInputCard } from './components/RawInputCard';
import { RulesCard } from './components/RulesCard';
import { LateAlertBanner } from './components/LateAlertBanner';
import { ExportCard } from './components/ExportCard';
import { EmployeeReportHero } from './components/EmployeeReportHero';
import { SummaryCard } from './components/SummaryCard';
import { DayTable } from './components/DayTable';
import { StickyNotesModal } from './components/StickyNotesModal';
import { EmployeeDirectoryModal } from './components/EmployeeDirectoryModal';
import { TeamLeaderApprovals } from './components/TeamLeaderApprovals';
import { ManagerOverview } from './components/ManagerOverview';
import { XamppDatabaseModal } from './components/XamppDatabaseModal';
import { EmployeeSubmissionStatus } from './components/EmployeeSubmissionStatus';
import { FloatingPortalDock } from './components/FloatingPortalDock';
import { Check, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Theme mode: dark or light
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('ledger_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('ledger_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Active User Profile & Role Permissions
  const [currentUser, setCurrentUserState] = useState<UserProfile>(() => getActiveUser());
  const [activeTab, setActiveTab] = useState<ActiveAppTab>('employee_ledger');
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSwitchUser = (user: UserProfile) => {
    setActiveUser(user);
    setCurrentUserState(user);

    // SECURITY: Clear previous user's punch data and reasons for privacy
    setRawInput('');
    setOverrides({});
    setPermissionsFiled({});
    setAbsenceCheckpoints({});
    setDayReasons({});
    localStorage.removeItem('ledger_raw_input');
    localStorage.removeItem('ledger_category_overrides');
    localStorage.removeItem('ledger_permissions_filed');
    localStorage.removeItem('ledger_absence_checkpoints');
    localStorage.removeItem('ledger_day_reasons');

    // Auto populate export settings for this employee
    setExportSettings({
      name: user.name,
      employeeId: user.sapId,
      shiftEnd: '17:00',
    });
    showToast(`Switched profile to ${user.name}. Timesheet reset for data privacy.`);
  };

  // State for raw input, rules, export settings, and overrides with persistent LocalStorage
  const [rawInput, setRawInput] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const punchParam = params.get('punch') || params.get('data');
    if (punchParam) {
      try {
        return decodeURIComponent(punchParam);
      } catch (e) {
        // Fallback
      }
    }
    const saved = localStorage.getItem('ledger_raw_input');
    if (saved !== null && saved !== undefined) {
      if (saved.includes('2026.07.16') && saved.includes('09:04:00')) {
        return '';
      }
      return saved;
    }
    return '';
  });

  useEffect(() => {
    localStorage.setItem('ledger_raw_input', rawInput);
  }, [rawInput]);

  const [rules, setRules] = useState<RuleSettings>(() => {
    try {
      const saved = localStorage.getItem('ledger_attendance_rules');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      timeOn: true,
      timeVal: '17:45',
      hoursOn: true,
      hoursVal: 8,
      lateOn: true,
      lateVal: '09:15',
      tuesdayEarlyShift: true,
      tuesdayShiftEnd: '16:00',
      weekendDays: [0, 5, 6], // Sunday (0), Friday (5), Saturday (6)
    };
  });

  useEffect(() => {
    localStorage.setItem('ledger_attendance_rules', JSON.stringify(rules));
  }, [rules]);

  const weekendDays = rules.weekendDays || [0, 5, 6];

  const handleToggleWeekendDay = (dayIndex: number) => {
    const current = rules.weekendDays || [0, 5, 6];
    let next: number[];
    if (current.includes(dayIndex)) {
      next = current.filter((d) => d !== dayIndex);
    } else {
      next = [...current, dayIndex].sort((a, b) => a - b);
    }
    setRules((prev) => ({ ...prev, weekendDays: next }));
  };

  const handleSetWeekendDays = (days: number[]) => {
    setRules((prev) => ({ ...prev, weekendDays: days }));
  };

  const [exportSettings, setExportSettings] = useState<ExportSettings>(() => {
    const active = getActiveUser();
    const params = new URLSearchParams(window.location.search);
    const nameParam = params.get('name');
    const idParam = params.get('id') || params.get('sap');
    try {
      const saved = localStorage.getItem('ledger_export_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedId = idParam || normalizeEmployeeId(parsed.employeeId || active.sapId || '');
        let savedName = nameParam ? decodeURIComponent(nameParam) : (parsed.name || active.name || '').trim();

        if (savedId && !savedName) {
          const lookedUp = lookupEmployeeById(savedId);
          if (lookedUp) savedName = lookedUp;
        }

        return {
          name: savedName,
          employeeId: savedId,
          shiftEnd: parsed.shiftEnd || '17:00',
        };
      }
    } catch (e) {
      console.error(e);
    }

    const initialId = idParam ? normalizeEmployeeId(idParam) : active.sapId || '';
    const initialName = nameParam ? decodeURIComponent(nameParam) : (initialId ? lookupEmployeeById(initialId) || active.name : active.name);

    return {
      name: initialName,
      employeeId: initialId,
      shiftEnd: '17:00',
    };
  });

  // SECURITY ISOLATION HANDLER: When SAP ID or Name changes to a different employee,
  // automatically purge previous user's punch records and reasons to avoid data leakage
  const handleChangeExportSettings = (newSettings: ExportSettings) => {
    const oldId = exportSettings.employeeId.trim();
    const oldName = exportSettings.name.trim();
    const newId = newSettings.employeeId.trim();
    const newName = newSettings.name.trim();

    const isDifferentId = oldId !== '' && newId !== '' && oldId !== newId;
    const isDifferentName = oldName !== '' && newName !== '' && oldName.toLowerCase() !== newName.toLowerCase();
    const isProfileCleared = (oldId !== '' && newId === '') || (oldName !== '' && newName === '');

    if (isDifferentId || isDifferentName || isProfileCleared) {
      if (rawInput || Object.keys(dayReasons).length > 0 || Object.keys(overrides).length > 0) {
        setRawInput('');
        setOverrides({});
        setPermissionsFiled({});
        setAbsenceCheckpoints({});
        setDayReasons({});
        localStorage.removeItem('ledger_raw_input');
        localStorage.removeItem('ledger_category_overrides');
        localStorage.removeItem('ledger_permissions_filed');
        localStorage.removeItem('ledger_absence_checkpoints');
        localStorage.removeItem('ledger_day_reasons');
        showToast('🔒 Security: Employee changed. Previous punch data & reasons purged for privacy.');
      }
    }

    setExportSettings(newSettings);
  };

  useEffect(() => {
    localStorage.setItem('ledger_export_settings', JSON.stringify(exportSettings));
    const cleanId = normalizeEmployeeId(exportSettings.employeeId);
    const cleanName = exportSettings.name.trim();
    if (cleanId && cleanName) {
      saveEmployeeMapping(cleanId, cleanName);
    }
  }, [exportSettings]);

  const [overrides, setOverrides] = useState<Record<string, DayCategory>>(() => {
    try {
      const saved = localStorage.getItem('ledger_category_overrides');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('ledger_category_overrides', JSON.stringify(overrides));
  }, [overrides]);

  const [permissionsFiled, setPermissionsFiled] = useState<Record<string, PermissionStatus>>(() => {
    try {
      const saved = localStorage.getItem('ledger_permissions_filed');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('ledger_permissions_filed', JSON.stringify(permissionsFiled));
  }, [permissionsFiled]);

  const [absenceCheckpoints, setAbsenceCheckpoints] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('ledger_absence_checkpoints');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('ledger_absence_checkpoints', JSON.stringify(absenceCheckpoints));
  }, [absenceCheckpoints]);

  const handleToggleAbsenceCheckpoint = (date: string) => {
    setAbsenceCheckpoints((prev) => {
      const isCurrentlyChecked = !!prev[date] || overrides[date] === 'leave' || overrides[date] === 'excused';
      const willBeChecked = !isCurrentlyChecked;
      const next = { ...prev, [date]: willBeChecked };

      if (willBeChecked) {
        setOverrides((currOverrides) => ({ ...currOverrides, [date]: 'leave' }));
      } else {
        setOverrides((currOverrides) => ({ ...currOverrides, [date]: 'absent' }));
      }

      return next;
    });
  };

  const [dayReasons, setDayReasons] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('ledger_day_reasons');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('ledger_day_reasons', JSON.stringify(dayReasons));
  }, [dayReasons]);

  // Seed sample submissions if storage is completely empty so TL and Manager views look alive
  useEffect(() => {
    const existing = getSubmissions();
    if (existing.length === 0) {
      const sample1: OvertimeSubmission = {
        id: 'sub_32272_jul2026',
        employeeId: '32272',
        employeeName: 'David Joseph Zakria',
        department: 'IT & Digital Systems',
        periodLabel: '16 Jul 2026 – 15 Aug 2026',
        totalOvertimeMinutes: 285,
        status: 'pending',
        submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        items: [
          {
            date: '2026.07.21',
            dayOfWeek: 'Tue',
            startTime: '09:00:00',
            endTime: '19:15:00',
            shiftEndStandard: '16:00',
            overtimeMinutes: 195,
            reason: 'Production Database migration & Network Switch firmware deployment',
            category: 'overtime_manual',
            status: 'pending',
          },
          {
            date: '2026.07.28',
            dayOfWeek: 'Tue',
            startTime: '09:02:00',
            endTime: '17:30:00',
            shiftEndStandard: '16:00',
            overtimeMinutes: 90,
            reason: 'Quarterly SAP User security audit & ticket resolution backlog',
            category: 'overtime_manual',
            status: 'pending',
          },
        ],
      };

      const sample2: OvertimeSubmission = {
        id: 'sub_18492_jul2026',
        employeeId: '18492',
        employeeName: 'Omar Farouk Mostafa',
        department: 'Operations & Facilities',
        periodLabel: '16 Jul 2026 – 15 Aug 2026',
        totalOvertimeMinutes: 150,
        status: 'approved',
        submittedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        reviewedBy: 'Mohamed El-Sayed (Team Leader)',
        reviewedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        leaderComments: 'Verified and approved with Operations schedule.',
        items: [
          {
            date: '2026.07.19',
            dayOfWeek: 'Sun',
            startTime: '10:00:00',
            endTime: '14:30:00',
            shiftEndStandard: '10:00',
            overtimeMinutes: 150,
            reason: 'Emergency electrical generator repair & facilities check',
            category: 'overtime_manual',
            status: 'approved',
            leaderNotes: 'Approved for Sunday emergency coverage',
            decidedBy: 'Mohamed El-Sayed',
          },
        ],
      };

      saveSubmission(sample1);
      saveSubmission(sample2);
    }
  }, []);

  // Modals state
  const [isStickyNotesOpen, setIsStickyNotesOpen] = useState(false);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);

  // Submissions count for badges
  const [allSubmissions, setAllSubmissions] = useState<OvertimeSubmission[]>(() => getSubmissions());
  useEffect(() => {
    const handleSubmissionsChange = () => {
      setAllSubmissions(getSubmissions());
    };
    window.addEventListener('team_submissions_updated', handleSubmissionsChange);
    return () => window.removeEventListener('team_submissions_updated', handleSubmissionsChange);
  }, []);

  const pendingApprovalsCount = allSubmissions.filter((s) => s.status === 'pending').length;

  const handleResetSession = () => {
    setExportSettings({
      name: '',
      employeeId: '',
      shiftEnd: '17:00',
    });
    setRawInput('');
    setOverrides({});
    setPermissionsFiled({});
    setAbsenceCheckpoints({});
    setDayReasons({});
    localStorage.removeItem('ledger_raw_input');
    localStorage.removeItem('ledger_category_overrides');
    localStorage.removeItem('ledger_permissions_filed');
    localStorage.removeItem('ledger_absence_checkpoints');
    localStorage.removeItem('ledger_day_reasons');
    localStorage.removeItem('ledger_export_settings');

    setIsDirectoryOpen(true);
  };

  const handleUpdateOverride = (date: string, category: DayCategory) => {
    setOverrides((prev) => ({ ...prev, [date]: category }));
  };

  const handleTogglePermission = (date: string) => {
    setPermissionsFiled((prev) => ({
      ...prev,
      [date]: prev[date] === 'filed' ? 'not_filed' : 'filed',
    }));
  };

  const handleUpdateReason = (date: string, reason: string) => {
    setDayReasons((prev) => ({ ...prev, [date]: reason }));
  };

  const handleApplyStickyReasons = (newReasons: Record<string, string>) => {
    setDayReasons((prev) => ({ ...prev, ...newReasons }));
  };

  // Process rows
  const parsedRows = parseRows(rawInput);
  const classifiedList = parsedRows.map((r) => classifyDay(r, rules));

  // Late days and stats calculation
  const counts = { present: 0, absent: 0, overtime: 0, missing: 0, late: 0, excused: 0, wfh: 0 };
  let totalWorkedMin = 0;
  let totalOvertimeMins = 0;
  const breakdown = {
    absent: 0,
    weekend: 0,
    holiday: 0,
    leave: 0,
    excused: 0,
    overtime_manual: 0,
    wfh: 0,
  };

  const lateDaysList: typeof classifiedList = [];

  for (const c of classifiedList) {
    const isWeekendRow = weekdayOf(c.row.date, weekendDays).isWeekend;
    const isAbsent = c.status === 'absent';
    const hasOverride = overrides[c.row.date] !== undefined;
    const effectiveCat: DayCategory = hasOverride
      ? overrides[c.row.date]
      : isWeekendRow
      ? 'weekend'
      : isAbsent
      ? 'absent'
      : c.status === 'overtime'
      ? 'overtime_manual'
      : 'present';

    if (effectiveCat === 'wfh') {
      counts.wfh++;
      breakdown.wfh++;
      totalWorkedMin += c.workedMin > 0 ? c.workedMin : 8 * 60;
    } else if (effectiveCat === 'excused') {
      counts.excused++;
      breakdown.excused++;
      totalWorkedMin += c.workedMin > 0 ? c.workedMin : 8 * 60;
    } else if (effectiveCat === 'overtime_manual') {
      counts.overtime++;
      breakdown.overtime_manual++;
      const otMins = c.overtimeMin > 0 ? c.overtimeMin : 60;
      totalOvertimeMins += otMins;
      totalWorkedMin += c.workedMin > 0 ? c.workedMin : 8 * 60 + otMins;
    } else if (effectiveCat === 'leave') {
      breakdown.leave++;
    } else if (effectiveCat === 'holiday') {
      breakdown.holiday++;
    } else if (effectiveCat === 'weekend') {
      breakdown.weekend++;
    } else if (effectiveCat === 'absent') {
      counts.absent++;
      breakdown.absent++;
    } else if (effectiveCat === 'present') {
      counts.present++;
      totalWorkedMin += c.workedMin;
    }

    const isLateEligible =
      c.isLate && !['weekend', 'holiday', 'leave', 'absent', 'wfh'].includes(effectiveCat);

    if (isLateEligible) {
      counts.late++;
      lateDaysList.push(c);
    }
  }

  const lateDays = lateDaysList;
  const workedDays = counts.present + counts.overtime + counts.excused + counts.wfh;
  const punctualityScore = workedDays > 0 ? Math.round(((workedDays - counts.late) / workedDays) * 100) : 100;

  // Overtime rows
  const overtimeList = classifiedList.filter((c) => {
    const isWeekendRow = weekdayOf(c.row.date, weekendDays).isWeekend;
    const isAbsent = c.status === 'absent';
    const effectiveCat = overrides[c.row.date] !== undefined
      ? overrides[c.row.date]
      : isWeekendRow
      ? 'weekend'
      : isAbsent
      ? 'absent'
      : c.status === 'overtime'
      ? 'overtime_manual'
      : 'present';
    return effectiveCat === 'overtime_manual';
  });

  const missingReasonsList = overtimeList.filter((c) => {
    const r = (dayReasons[c.row.date] || '').trim();
    return !r;
  });

  // Calculate unexcused absence days that require checkpoints/excuses
  const unexcusedAbsentList = classifiedList.filter((c) => {
    const isWeekendRow = weekdayOf(c.row.date, weekendDays).isWeekend;
    const isAbsent = c.status === 'absent';
    const effectiveCat = overrides[c.row.date] !== undefined
      ? overrides[c.row.date]
      : isWeekendRow
      ? 'weekend'
      : isAbsent
      ? 'absent'
      : c.status === 'overtime'
      ? 'overtime_manual'
      : 'present';
    return effectiveCat === 'absent';
  });

  const unresolvedAbsentList = unexcusedAbsentList.filter((c) => {
    const isChecked = absenceCheckpoints[c.row.date] === true || (dayReasons[c.row.date] || '').trim().length > 0;
    return !isChecked;
  });

  // Required Checklist Items
  const requiredItems = [
    { key: 'name', label: 'Employee Name', complete: exportSettings.name.trim().length > 0 },
    { key: 'employeeId', label: 'Employee ID', complete: exportSettings.employeeId.trim().length > 0 },
    { key: 'shiftEnd', label: 'Shift End Time', complete: exportSettings.shiftEnd.trim().length > 0 },
    { key: 'ledger', label: 'Ledger Days Loaded', complete: parsedRows.length > 0 },
  ];

  if (overtimeList.length > 0) {
    overtimeList.forEach((ot) => {
      const hasReason = (dayReasons[ot.row.date] || ot.userReason || '').trim().length > 0;
      requiredItems.push({
        key: `reason-${ot.row.date}`,
        label: `Reason for ${ot.row.date}`,
        complete: hasReason,
      });
    });
  }

  if (unexcusedAbsentList.length > 0) {
    unexcusedAbsentList.forEach((ab) => {
      const isChecked = absenceCheckpoints[ab.row.date] === true || (dayReasons[ab.row.date] || '').trim().length > 0;
      requiredItems.push({
        key: `absent-${ab.row.date}`,
        label: `Absence Checkpoint for ${ab.row.date}`,
        complete: isChecked,
      });
    });
  }

  const totalRequiredCount = requiredItems.length;
  const completedRequiredCount = requiredItems.filter((i) => i.complete).length;
  const completionPercentage = totalRequiredCount > 0
    ? Math.round((completedRequiredCount / totalRequiredCount) * 100)
    : 100;

  const missingDataErrors: { id: string; label: string; action?: () => void; actionLabel?: string }[] = [];
  if (!exportSettings.name.trim()) {
    missingDataErrors.push({ id: 'name', label: 'Employee Name is required — please enter your full name.' });
  }
  if (!exportSettings.employeeId.trim()) {
    missingDataErrors.push({ id: 'employeeId', label: 'Employee ID is required — please enter your Staff ID.' });
  }
  if (missingReasonsList.length > 0) {
    missingDataErrors.push({
      id: 'reasons',
      label: `${missingReasonsList.length} overtime ${
        missingReasonsList.length === 1 ? 'day is missing a mandatory reason' : 'days are missing mandatory reasons'
      }.`,
      action: () => {
        const tableEl = document.getElementById('ledger-breakdown-section');
        if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      actionLabel: 'Enter Overtime Reasons',
    });
  }
  if (unresolvedAbsentList.length > 0) {
    missingDataErrors.push({
      id: 'absent-checkpoints',
      label: `${unresolvedAbsentList.length} unexcused absence ${
        unresolvedAbsentList.length === 1 ? 'day requires a checkpoint or excuse' : 'days require checkpoints or excuses'
      }.`,
      action: () => {
        const tableEl = document.getElementById('ledger-breakdown-section');
        if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      actionLabel: 'Review Absent Checkpoints',
    });
  }

  const isUserDataComplete = missingDataErrors.length === 0;

  const handleExportOvertime = () => {
    const cleanId = exportSettings.employeeId.trim();
    const cleanName = exportSettings.name.trim();

    if (!cleanId || cleanId.toLowerCase() === 'employee id' || cleanId.toLowerCase() === 'sap id') {
      alert('⛔ CANNOT EXPORT EXCEL: SAP / Employee ID is strictly mandatory. Please fill in your valid SAP ID first.');
      const sapInput = document.querySelector('input[placeholder*="SAP"]') as HTMLInputElement;
      if (sapInput) {
        sapInput.focus();
        sapInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!cleanName || cleanName.toLowerCase() === 'employee name' || cleanName.toLowerCase() === 'no employee name set') {
      alert('⛔ CANNOT EXPORT EXCEL: Full Employee Name is strictly mandatory. Please fill in your real name first.');
      const nameInput = document.querySelector('input[placeholder*="Full name"]') as HTMLInputElement;
      if (nameInput) {
        nameInput.focus();
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (overtimeList.length === 0) {
      alert('No overtime days found in the current timesheet to export.');
      return;
    }

    if (missingReasonsList.length > 0) {
      alert(
        `⚠️ CANNOT EXPORT EXCEL: Mandatory Reason Missing: ${missingReasonsList.length} overtime ${
          missingReasonsList.length === 1 ? 'day is' : 'days are'
        } missing a justification reason. Please complete all reasons first.`
      );
      setIsStickyNotesOpen(true);
      return;
    }

    if (unresolvedAbsentList.length > 0) {
      const dates = unresolvedAbsentList.map((d) => d.row.date).join(', ');
      alert(
        `⚠️ Cannot export Excel: There ${
          unresolvedAbsentList.length === 1 ? 'is 1 unexcused absence day' : `are ${unresolvedAbsentList.length} unexcused absence days`
        } (${dates}) that require a checkpoint or excuse to be checked first. Please check the absence checkpoint in the ledger table below.`
      );
      const tableEl = document.getElementById('ledger-breakdown-section');
      if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const result = exportOvertimeToExcel(classifiedList, exportSettings, dayReasons, overrides, weekendDays);
    if (!result.success) {
      if (result.missingDates && result.missingDates.length > 0) {
        setIsStickyNotesOpen(true);
      }
      alert(result.error || 'Failed to export overtime log.');
    } else {
      showToast(`✓ Excel ledger successfully exported for ${exportSettings.name} (SAP #${exportSettings.employeeId})`);
    }
  };

  // Submit to Team Leader workflow
  const handleSubmitToTeamLeader = () => {
    if (overtimeList.length === 0) {
      alert('No overtime days detected in this timesheet to submit.');
      return;
    }

    if (missingReasonsList.length > 0) {
      alert(`Cannot submit to Team Leader: Please enter mandatory reasons for all ${missingReasonsList.length} overtime day(s).`);
      const tableEl = document.getElementById('ledger-breakdown-section');
      if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (!exportSettings.name.trim() || !exportSettings.employeeId.trim()) {
      alert('Please fill your Employee Name and SAP ID before submitting.');
      return;
    }

    const submissionItems = overtimeList.map((ot) => {
      const isTue = weekdayOf(ot.row.date, weekendDays).label.toLowerCase() === 'tue';
      const shiftEndStd = (rules.tuesdayEarlyShift && isTue) ? (rules.tuesdayShiftEnd || '16:00') : (exportSettings.shiftEnd || '17:00');
      return {
        date: ot.row.date,
        dayOfWeek: weekdayOf(ot.row.date, weekendDays).label,
        startTime: ot.row.start,
        endTime: ot.row.end,
        shiftEndStandard: shiftEndStd,
        overtimeMinutes: ot.overtimeMin > 0 ? ot.overtimeMin : 60,
        reason: dayReasons[ot.row.date] || ot.userReason || 'Project overtime',
        category: overrides[ot.row.date] || 'overtime_manual',
        status: 'pending' as const,
      };
    });

    const submissionId = `sub_${exportSettings.employeeId}_${Date.now()}`;
    const newSubmission: OvertimeSubmission = {
      id: submissionId,
      employeeId: exportSettings.employeeId,
      employeeName: exportSettings.name,
      department: currentUser.department || 'General Staff',
      periodLabel: '16th – 15th Monthly Cycle',
      totalOvertimeMinutes: totalOvertimeMins,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      items: submissionItems,
    };

    saveSubmission(newSubmission);
    showToast(`✓ Submitted ${submissionItems.length} overtime days to Team Leader for approval!`);
    setActiveTab('team_leader_approvals');
  };

  const activeUserSubmission = allSubmissions.find(
    (s) =>
      (exportSettings.employeeId && s.employeeId === exportSettings.employeeId) ||
      (exportSettings.name && s.employeeName.toLowerCase() === exportSettings.name.trim().toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Masthead Header with Tabs & Multi-Role Navigation */}
        <Masthead
          theme={theme}
          onToggleTheme={toggleTheme}
          onResetSession={handleResetSession}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          currentUser={currentUser}
          onSwitchUser={handleSwitchUser}
          onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
          pendingApprovalsCount={pendingApprovalsCount}
        />

        {/* TAB 1: EMPLOYEE LEDGER & INPUT */}
        {activeTab === 'employee_ledger' && (
          <div className="space-y-6">
            {/* Real-time Submission Status for Employee */}
            <EmployeeSubmissionStatus
              submission={activeUserSubmission}
              employeeName={exportSettings.name}
              employeeId={exportSettings.employeeId}
              onNavigateToApprovals={() => setActiveTab('team_leader_approvals')}
              onSubmitNew={handleSubmitToTeamLeader}
              overtimeCount={counts.overtime}
            />

            {/* Employee Hero */}
            <EmployeeReportHero
              employeeName={exportSettings.name}
              employeeId={exportSettings.employeeId}
              totalDays={parsedRows.length}
              punctualityScore={punctualityScore}
              totalOvertimeMins={totalOvertimeMins}
              overtimeCount={counts.overtime}
              lateCount={counts.late}
              presentCount={counts.present}
              excusedCount={counts.excused}
              isUserDataComplete={isUserDataComplete}
              missingDataErrors={missingDataErrors}
              shiftEndTime={exportSettings.shiftEnd}
              lateThresholdVal={rules.lateVal}
              completionPercentage={completionPercentage}
              completedRequiredCount={completedRequiredCount}
              totalRequiredCount={totalRequiredCount}
              onOpenDirectory={() => setIsDirectoryOpen(true)}
              onOpenStickyNotes={() => setIsStickyNotesOpen(true)}
              onNavigateTab={setActiveTab}
            />

            {/* Late Arrival Alert Banner */}
            {lateDays.length > 0 && (
              <LateAlertBanner
                lateDays={lateDays}
                lateThresholdVal={rules.lateVal}
                permissionsFiled={permissionsFiled}
                onTogglePermission={handleTogglePermission}
                employeeName={exportSettings.name}
                employeeId={exportSettings.employeeId}
              />
            )}

            {/* Overtime & Attendance Rules Section */}
            <RulesCard
              rules={rules}
              onChangeRules={setRules}
            />

            {/* Export & Submit to Team Leader Card */}
            <ExportCard
              exportSettings={exportSettings}
              onChangeSettings={handleChangeExportSettings}
              onExport={handleExportOvertime}
              onSubmitToTeamLeader={handleSubmitToTeamLeader}
              onNavigateTab={setActiveTab}
              overtimeCount={counts.overtime}
              missingReasonsCount={missingReasonsList.length}
              unresolvedAbsencesCount={unresolvedAbsentList.length}
              onOpenStickyNotes={() => setIsStickyNotesOpen(true)}
              onOpenDirectory={() => setIsDirectoryOpen(true)}
            />

            {/* Raw Punch Input Textarea */}
            <RawInputCard
              rawInput={rawInput}
              onChangeInput={setRawInput}
              onRun={() => {
                const tableEl = document.getElementById('ledger-breakdown-section');
                if (tableEl) {
                  tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            />

            {/* Summary Statistics Card */}
            <div id="ledger-breakdown-section">
              <SummaryCard
                totalDays={parsedRows.length}
                counts={counts}
                totalOvertimeMins={totalOvertimeMins}
                breakdown={breakdown}
                weekendDays={weekendDays}
                onToggleWeekendDay={handleToggleWeekendDay}
                onSetWeekendDays={handleSetWeekendDays}
              />
            </div>

            {/* Detailed Day by Day Table */}
            <DayTable
              classifiedList={classifiedList}
              overrides={overrides}
              onUpdateOverride={handleUpdateOverride}
              rules={rules}
              permissionsFiled={permissionsFiled}
              onTogglePermission={handleTogglePermission}
              dayReasons={dayReasons}
              onUpdateReason={handleUpdateReason}
              weekendDays={weekendDays}
              absenceCheckpoints={absenceCheckpoints}
              onToggleAbsenceCheckpoint={handleToggleAbsenceCheckpoint}
            />
          </div>
        )}

        {/* TAB 2: TEAM LEADER APPROVALS */}
        {activeTab === 'team_leader_approvals' && (
          <TeamLeaderApprovals currentUser={currentUser} onNavigateTab={setActiveTab} />
        )}

        {/* TAB 3: MANAGER OVERVIEW & MATRIX */}
        {activeTab === 'manager_overview' && (
          <ManagerOverview currentUser={currentUser} onNavigateTab={setActiveTab} />
        )}

        {/* Footer Branding & Watermark */}
        <footer className="mt-12 mb-20 text-center text-[11px] font-mono text-muted-foreground/70 flex items-center justify-center gap-2 flex-wrap">
          <span>Wadi Degla Clubs Attendance &amp; Overtime System</span>
          <span className="text-border">•</span>
          <span className="text-amber-400 font-bold uppercase tracking-wider">Made by David Kalad</span>
        </footer>
      </div>

      {/* Floating Bottom Navigation Dock - Pinned and Always Accessible */}
      <FloatingPortalDock
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenDatabase={() => setIsDatabaseModalOpen(true)}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Staff Directory Modal */}
      <EmployeeDirectoryModal
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        onSelectEmployee={(id, name) => {
          setExportSettings((prev) => ({ ...prev, employeeId: id, name }));
        }}
        currentId={exportSettings.employeeId}
      />

      {/* Sticky Notes Modal */}
      <StickyNotesModal
        isOpen={isStickyNotesOpen}
        onClose={() => setIsStickyNotesOpen(false)}
        onApplyReasons={handleApplyStickyReasons}
        overtimeDates={overtimeList.map((ot) => ot.row.date)}
        existingReasons={dayReasons}
      />

      {/* XAMPP / MySQL Database & User Management Modal */}
      <XamppDatabaseModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        currentUser={currentUser}
        onUserSelect={handleSwitchUser}
      />
    </div>
  );
}
