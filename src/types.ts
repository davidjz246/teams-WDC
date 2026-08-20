export type DayCategory = 'absent' | 'weekend' | 'holiday' | 'leave' | 'excused' | 'overtime_manual' | 'wfh' | 'present';

export type PermissionStatus = 'not_filed' | 'filed';

export interface PunchRow {
  date: string; // YYYY.MM.DD
  start: string; // HH:MM:SS
  end: string; // HH:MM:SS
}

export interface RuleSettings {
  timeOn: boolean;
  timeVal: string; // e.g. "17:15"
  hoursOn: boolean;
  hoursVal: number; // e.g. 8
  lateOn: boolean;
  lateVal: string; // e.g. "09:15"
}

export interface ExportSettings {
  name: string;
  employeeId: string;
  shiftEnd: string;
}

export type DayStatus = 'present' | 'overtime' | 'absent' | 'missing' | 'excused';

export interface DayClassification {
  row: PunchRow;
  status: DayStatus;
  workedMin: number;
  startMin: number | null;
  endMin: number | null;
  reasons: string[];
  overtimeMin: number;
  isLate: boolean;
  lateMin: number;
  userReason?: string;
}

export type ThemeMode = 'dark' | 'light';

