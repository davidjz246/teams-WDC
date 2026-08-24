export type DayCategory = 'absent' | 'weekend' | 'holiday' | 'leave' | 'excused' | 'overtime_manual' | 'wfh' | 'present';

export type PermissionStatus = 'not_filed' | 'filed';

export type UserRole = 'employee' | 'team_leader' | 'manager' | 'admin';

export interface UserProfile {
  id: string;
  sapId: string;
  name: string;
  role: UserRole;
  email: string;
  department: string;
  avatar?: string;
  title: string;
}

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
  tuesdayEarlyShift: boolean; // Tuesday shift ends at 16:00 (4:00 PM)
  tuesdayShiftEnd: string; // e.g. "16:00"
  weekendDays: number[]; // e.g. [0, 5] (Sunday & Friday) or [0, 5, 6]
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
  category?: DayCategory;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface OvertimeDayItem {
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  shiftEndStandard: string;
  overtimeMinutes: number;
  reason: string;
  category: DayCategory;
  status: ApprovalStatus;
  leaderNotes?: string;
  decidedAt?: string;
  decidedBy?: string;
}

export interface OvertimeSubmission {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  periodLabel: string; // e.g. "16 Jul 2026 – 15 Aug 2026"
  submittedAt: string;
  status: ApprovalStatus;
  totalOvertimeMinutes: number;
  items: OvertimeDayItem[];
  leaderComments?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type ActiveAppTab = 'employee_ledger' | 'team_leader_approvals' | 'manager_overview' | 'database_config';

export type ThemeMode = 'dark' | 'light';
