import * as XLSX from 'xlsx';
import { DayCategory, DayClassification, ExportSettings, PunchRow, RuleSettings } from '../types';

export function parseRows(rawText: string): PunchRow[] {
  const tokens = rawText
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const rows: PunchRow[] = [];
  for (let i = 0; i < tokens.length; i += 3) {
    const date = tokens[i];
    const start = tokens[i + 1];
    const end = tokens[i + 2];
    if (date && start && end) {
      rows.push({ date, start, end });
    }
  }
  return rows;
}

export function toMinutes(hhmmss: string): number {
  const parts = hhmmss.split(':').map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  return h * 60 + m;
}

export function fmtHours(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h + 'h' + (m ? ' ' + m + 'm' : '');
}

export const DAY_NAMES: { index: number; short: string; long: string }[] = [
  { index: 0, short: 'Sun', long: 'Sunday' },
  { index: 1, short: 'Mon', long: 'Monday' },
  { index: 2, short: 'Tue', long: 'Tuesday' },
  { index: 3, short: 'Wed', long: 'Wednesday' },
  { index: 4, short: 'Thu', long: 'Thursday' },
  { index: 5, short: 'Fri', long: 'Friday' },
  { index: 6, short: 'Sat', long: 'Saturday' },
];

export function formatWeekendNames(weekendDays: number[]): string {
  if (!weekendDays || weekendDays.length === 0) return 'No Weekend Days (All Workdays)';
  const sorted = [...weekendDays].sort((a, b) => a - b);
  const names = sorted.map((d) => DAY_NAMES.find((item) => item.index === d)?.long || `Day ${d}`);
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1];
}

export function weekdayOf(
  dateStr: string,
  customWeekendDays: number[] = [5, 6]
): { label: string; isWeekend: boolean } {
  const [y, m, d] = dateStr.split('.').map(Number);
  if (!y || !m || !d) return { label: '', isWeekend: false };
  const dt = new Date(y, m - 1, d);
  const dow = dt.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const label = dt.toLocaleDateString('en-US', { weekday: 'short' });

  const isWeekend = customWeekendDays.includes(dow);

  return { label, isWeekend };
}

export function weekdayFullOf(dateStr: string): string {
  const [y, m, d] = dateStr.split('.').map(Number);
  if (!y || !m || !d) return '';
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', { weekday: 'long' });
}

export function toUSDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('.').map(Number);
  if (!y || !m || !d) return dateStr;
  return `${m}/${d}/${y}`;
}

export function to12Hour(hhmmss: string): string {
  if (!hhmmss || hhmmss === '—') return '—';
  const parts = hhmmss.split(':').map(Number);
  let h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function toHM(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

export function classifyDay(row: PunchRow, rules: RuleSettings): DayClassification {
  const isZero = (t: string) => t === '00:00:00';
  const startMin = isZero(row.start) ? null : toMinutes(row.start);

  let isLate = false;
  let lateMin = 0;

  if (rules.lateOn && startMin !== null) {
    const lateThresholdMin = toMinutes(rules.lateVal + ':00');
    if (startMin > lateThresholdMin) {
      isLate = true;
      lateMin = startMin - lateThresholdMin;
    }
  }

  if (isZero(row.start) && isZero(row.end)) {
    return {
      row,
      status: 'absent',
      workedMin: 0,
      startMin: null,
      endMin: null,
      reasons: [],
      overtimeMin: 0,
      isLate: false,
      lateMin: 0,
    };
  }

  if (!isZero(row.start) && isZero(row.end)) {
    return {
      row,
      status: 'missing',
      workedMin: 0,
      startMin,
      endMin: null,
      reasons: ['no checkout recorded'],
      overtimeMin: 0,
      isLate,
      lateMin,
    };
  }

  const endMin = toMinutes(row.end);
  const workedMin = Math.max(0, endMin - (startMin ?? 0));
  const reasons: string[] = [];
  let overtimeMin = 0;

  if (rules.timeOn) {
    const thresholdMin = toMinutes(rules.timeVal + ':00');
    if (endMin > thresholdMin) {
      const over = endMin - thresholdMin;
      reasons.push(`checked out ${fmtHours(over)} after ${rules.timeVal}`);
      overtimeMin = Math.max(overtimeMin, over);
    }
  }

  if (rules.hoursOn) {
    const thresholdMin = rules.hoursVal * 60;
    if (workedMin > thresholdMin) {
      const over = workedMin - thresholdMin;
      reasons.push(`${fmtHours(over)} past the ${rules.hoursVal}h day`);
      overtimeMin = Math.max(overtimeMin, over);
    }
  }

  const GRACE_MIN = 50;
  const status = overtimeMin > GRACE_MIN ? 'overtime' : 'present';
  if (status === 'present') {
    overtimeMin = 0;
  }

  return {
    row,
    status,
    workedMin,
    startMin,
    endMin,
    reasons,
    overtimeMin,
    isLate,
    lateMin,
  };
}

export function parseStickyNotes(notesText: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!notesText || !notesText.trim()) return result;

  const lines = notesText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Check for YYYY.MM.DD or YYYY-MM-DD or MM/DD/YYYY or M/D patterns
    const matchFull = line.match(/^(\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2})\s*[:\-—]\s*(.+)$/i);
    if (matchFull) {
      let dateKey = matchFull[1].replace(/[\-/]/g, '.');
      // Normalize to YYYY.MM.DD
      const parts = dateKey.split('.');
      if (parts.length === 3) {
        const y = parts[0].length === 4 ? parts[0] : parts[2];
        const m = parts[0].length === 4 ? parts[1].padStart(2, '0') : parts[0].padStart(2, '0');
        const d = parts[0].length === 4 ? parts[2].padStart(2, '0') : parts[1].padStart(2, '0');
        dateKey = `${y}.${m}.${d}`;
      }
      result[dateKey] = matchFull[2].trim();
      continue;
    }

    // Check for "Date: Reason" or "July 27: Reason" or "27 July: Reason"
    const matchWordMonth = line.match(/^([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s*\d{4})?|\d{1,2}\s+[A-Za-z]+(?:,\s*\d{4})?)\s*[:\-—]\s*(.+)$/i);
    if (matchWordMonth) {
      const datePart = matchWordMonth[1];
      const reasonPart = matchWordMonth[2];
      const parsedDate = new Date(datePart.includes('20') ? datePart : `${datePart} 2026`);
      if (!isNaN(parsedDate.getTime())) {
        const y = parsedDate.getFullYear();
        const m = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const d = String(parsedDate.getDate()).padStart(2, '0');
        result[`${y}.${m}.${d}`] = reasonPart.trim();
      }
    }
  }

  return result;
}

export function exportOvertimeToExcel(
  classifiedList: DayClassification[],
  exportSettings: ExportSettings,
  dayReasons: Record<string, string> = {},
  overrides: Record<string, DayCategory> = {},
  weekendDays: number[] = [5, 6]
): { success: boolean; missingDates: string[]; error?: string } {
  const name = exportSettings.name.trim() || 'Employee Name';
  const employeeId = exportSettings.employeeId?.trim() || '';
  const shiftEnd = exportSettings.shiftEnd || '17:00';

  const overtimeDays = classifiedList.filter((c) => {
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

  if (overtimeDays.length === 0) {
    return { success: false, missingDates: [], error: 'No overtime days found in the current ledger.' };
  }

  // MANDATORY REASON CHECK: verify every overtime day has a reason
  const missingDates: string[] = [];
  for (const c of overtimeDays) {
    const reason = (dayReasons[c.row.date] || c.userReason || '').trim();
    if (!reason) {
      missingDates.push(c.row.date);
    }
  }

  if (missingDates.length > 0) {
    return {
      success: false,
      missingDates,
      error: `Mandatory Reason Missing: ${missingDates.length} overtime ${
        missingDates.length === 1 ? 'day has' : 'days have'
      } no reason specified. Every overtime entry must include a valid reason before exporting to Excel.`,
    };
  }

  const headers = ['Name', 'Employee ID', 'Date', 'Day', 'From', 'To', 'Total', 'Reason'];
  const dataRows = overtimeDays.map((c) => {
    const reason = (dayReasons[c.row.date] || c.userReason || '').trim();
    const isManualOT = overrides[c.row.date] === 'overtime_manual' && c.overtimeMin === 0;
    const otMins = isManualOT ? 60 : c.overtimeMin; // default 1 hr for manual overtime if 0
    const toTime = c.row.end && c.row.end !== '00:00:00' ? to12Hour(c.row.end) : '06:00 PM';

    return [
      name,
      employeeId,
      toUSDate(c.row.date),
      weekdayFullOf(c.row.date),
      to12Hour(shiftEnd + ':00'),
      toTime,
      toHM(otMins),
      reason,
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  ws['!cols'] = [
    { wch: 32 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 45 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Overtime');
  XLSX.writeFile(wb, `overtime_log_${employeeId || 'employee'}.xlsx`);
  return { success: true, missingDates: [] };
}

export const DEFAULT_RAW_PUNCH = `2026.07.16
09:04:00
17:28:00
2026.07.17
00:00:00
00:00:00
2026.07.18
00:00:00
00:00:00
2026.07.19
00:00:00
00:00:00
2026.07.20
00:00:00
00:00:00
2026.07.21
00:00:00
00:00:00
2026.07.22
00:00:00
00:00:00
2026.07.23
00:00:00
00:00:00
2026.07.24
00:00:00
00:00:00
2026.07.25
00:00:00
00:00:00
2026.07.26
00:00:00
00:00:00
2026.07.27
08:27:00
17:14:00
2026.07.28
08:41:00
17:25:00
2026.07.29
08:57:00
17:03:00
2026.07.30
08:48:00
17:07:00
2026.07.31
00:00:00
00:00:00
2026.08.01
00:00:00
00:00:00
2026.08.02
00:00:00
00:00:00
2026.08.03
08:43:00
18:07:00
2026.08.04
09:05:00
17:25:00
2026.08.05
08:47:00
21:04:00
2026.08.06
09:09:00
16:27:00
2026.08.07
00:00:00
00:00:00
2026.08.08
00:00:00
00:00:00
2026.08.09
00:00:00
00:00:00
2026.08.10
08:51:00
17:10:00
2026.08.11
08:21:00
17:00:00
2026.08.12
08:55:00
17:01:00
2026.08.13
09:02:00
00:00:00`;
