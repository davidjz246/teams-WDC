import React, { useEffect, useState } from 'react';
import { DayCategory, ExportSettings, PermissionStatus, RuleSettings, ThemeMode } from './types';
import {
  classifyDay,
  exportOvertimeToExcel,
  fmtHours,
  parseRows,
  weekdayOf,
} from './utils/parser';
import {
  lookupEmployeeById,
  saveEmployeeMapping,
  normalizeEmployeeId,
} from './utils/employeeDirectory';
import { Masthead } from './components/Masthead';
import { RawInputCard } from './components/RawInputCard';
import { RulesCard } from './components/RulesCard';
import { LateAlertBanner } from './components/LateAlertBanner';
import { ExportCard } from './components/ExportCard';
import { EmployeeReportHero } from './components/EmployeeReportHero';
import { SummaryCard } from './components/SummaryCard';
import { DayTable } from './components/DayTable';
import { StickyNotesModal } from './components/StickyNotesModal';
import { PowerAutomateModal } from './components/PowerAutomateModal';
import { EmployeeDirectoryModal } from './components/EmployeeDirectoryModal';

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
      // If legacy demo punch was saved, discard it
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
    };
  });

  useEffect(() => {
    localStorage.setItem('ledger_attendance_rules', JSON.stringify(rules));
  }, [rules]);

  const [weekendDays, setWeekendDays] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('ledger_weekend_days');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [5, 6]; // Friday (5) & Saturday (6) default
  });

  useEffect(() => {
    localStorage.setItem('ledger_weekend_days', JSON.stringify(weekendDays));
  }, [weekendDays]);

  const handleToggleWeekendDay = (dayIndex: number) => {
    setWeekendDays((prev) => {
      let next: number[];
      if (prev.includes(dayIndex)) {
        next = prev.filter((d) => d !== dayIndex);
      } else {
        next = [...prev, dayIndex].sort((a, b) => a - b);
      }
      return next;
    });
  };

  const handleSetWeekendDays = (days: number[]) => {
    setWeekendDays(days);
  };

  const [exportSettings, setExportSettings] = useState<ExportSettings>(() => {
    const params = new URLSearchParams(window.location.search);
    const nameParam = params.get('name');
    const idParam = params.get('id') || params.get('sap');
    try {
      const saved = localStorage.getItem('ledger_export_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedId = idParam || normalizeEmployeeId(parsed.employeeId || '');
        let savedName = nameParam ? decodeURIComponent(nameParam) : (parsed.name || '').trim();

        // If ID exists and name is missing, auto-lookup from local laptop database
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

    const initialId = idParam ? normalizeEmployeeId(idParam) : '';
    const initialName = nameParam ? decodeURIComponent(nameParam) : (initialId ? lookupEmployeeById(initialId) || '' : '');

    return {
      name: initialName,
      employeeId: initialId,
      shiftEnd: '17:00',
    };
  });

  useEffect(() => {
    localStorage.setItem('ledger_export_settings', JSON.stringify(exportSettings));
    const cleanId = normalizeEmployeeId(exportSettings.employeeId);
    const cleanName = exportSettings.name.trim();
    if (cleanId && cleanName) {
      saveEmployeeMapping(cleanId, cleanName);
    }
  }, [exportSettings]);

  // Real-time synchronization when local database changes
  useEffect(() => {
    const handleDirectoryChange = () => {
      const cleanId = normalizeEmployeeId(exportSettings.employeeId);
      if (cleanId && !exportSettings.name.trim()) {
        const matched = lookupEmployeeById(cleanId);
        if (matched) {
          setExportSettings((prev) => ({ ...prev, name: matched }));
        }
      }
    };
    window.addEventListener('employee_directory_updated', handleDirectoryChange);
    return () => window.removeEventListener('employee_directory_updated', handleDirectoryChange);
  }, [exportSettings.employeeId, exportSettings.name]);

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

      // Automatically change Category to 'leave' (Leave Permission) when checked, or back to 'absent' when unchecked
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

  // Modals state
  const [isStickyNotesOpen, setIsStickyNotesOpen] = useState(false);
  const [isPowerAutomateOpen, setIsPowerAutomateOpen] = useState(false);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);

  // Reset session to allow user to put their SAP, name, or choose from directory and paste Teams data
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

    // Prompt directory lookup
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

  // Calculate missing reasons for overtime days
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

  // Required Checklist Items: Name, Employee ID, Shift End Time, Ledger Days, Overtime Reasons, AND Absence Checkpoints
  const requiredItems = [
    { key: 'name', label: 'Employee Name', complete: exportSettings.name.trim().length > 0 },
    { key: 'employeeId', label: 'Employee ID', complete: exportSettings.employeeId.trim().length > 0 },
    { key: 'shiftEnd', label: 'Shift End Time', complete: exportSettings.shiftEnd.trim().length > 0 },
    { key: 'ledger', label: 'Ledger Days Loaded', complete: parsedRows.length > 0 },
  ];

  // Add a required check for every overtime day detected
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

  // Add a required checkpoint check for every unexcused absent day detected
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

  // Data validation for user profile & overtime logs
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
    // BLOCK EXCEL EXPORT IF ANY UNEXCUSED ABSENT DAY HAS NOT BEEN CHECKED OFF / EXCUSED
    if (unresolvedAbsentList.length > 0) {
      const dates = unresolvedAbsentList.map((d) => d.row.date).join(', ');
      alert(
        `Cannot export Excel: There ${
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
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Theme Toggle & Session Controls */}
        <Masthead
          theme={theme}
          onToggleTheme={toggleTheme}
          onResetSession={handleResetSession}
        />

        {/* Dedicated Employee Profile & Filed Data Report Hero View */}
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
        />

        {/* Late Arrival Alert Banner (Renders with full visibility if any late arrivals exist) */}
        {lateDays.length > 0 && (
          <div className="mb-6">
            <LateAlertBanner
              lateDays={lateDays}
              lateThresholdVal={rules.lateVal}
              permissionsFiled={permissionsFiled}
              onTogglePermission={handleTogglePermission}
              employeeName={exportSettings.name}
              employeeId={exportSettings.employeeId}
            />
          </div>
        )}

        {/* Overtime & Attendance Rules Section */}
        <div className="mb-6">
          <RulesCard
            rules={rules}
            onChangeRules={setRules}
          />
        </div>

        {/* Export Overtime & Parameters Section */}
        <div className="mb-6">
          <ExportCard
            exportSettings={exportSettings}
            onChangeSettings={setExportSettings}
            onExport={handleExportOvertime}
            overtimeCount={counts.overtime}
            missingReasonsCount={missingReasonsList.length}
            unresolvedAbsencesCount={unresolvedAbsentList.length}
            onOpenStickyNotes={() => setIsStickyNotesOpen(true)}
            onOpenPowerAutomate={() => setIsPowerAutomateOpen(true)}
            onOpenDirectory={() => setIsDirectoryOpen(true)}
          />
        </div>

        {/* Raw Punch Input Textarea with 'Read the ledger' button */}
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

        {/* Summary Statistics & Table Anchor */}
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

        {/* Detailed Day by Day Table & Reason Manager */}
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

      {/* Staff Directory & ID Lookup Modal */}
      <EmployeeDirectoryModal
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        onSelectEmployee={(id, name) => {
          setExportSettings((prev) => ({ ...prev, employeeId: id, name }));
        }}
        currentId={exportSettings.employeeId}
      />

      {/* Sticky Notes Overtime Reason Sync Modal */}
      <StickyNotesModal
        isOpen={isStickyNotesOpen}
        onClose={() => setIsStickyNotesOpen(false)}
        onApplyReasons={handleApplyStickyReasons}
        overtimeDates={overtimeList.map((ot) => ot.row.date)}
        existingReasons={dayReasons}
      />

      {/* Power Automate Setup & 14th of Month Flow Modal */}
      <PowerAutomateModal
        isOpen={isPowerAutomateOpen}
        onClose={() => setIsPowerAutomateOpen(false)}
        employeeId={exportSettings.employeeId}
        employeeName={exportSettings.name}
      />
    </div>
  );
}
