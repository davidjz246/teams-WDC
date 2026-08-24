import { ApprovalStatus, OvertimeSubmission, UserProfile, UserRole } from '../types';

export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'usr_32272',
    sapId: '32272',
    name: 'David Joseph Zakria',
    role: 'employee',
    email: 'david.j@wadidegla.com',
    department: 'IT & Digital Systems',
    title: 'Systems Specialist',
  },
  {
    id: 'usr_18492',
    sapId: '18492',
    name: 'Omar Farouk Mostafa',
    role: 'employee',
    email: 'omar.farouk@wadidegla.com',
    department: 'Operations & Facilities',
    title: 'Operations Coordinator',
  },
  {
    id: 'usr_24110',
    sapId: '24110',
    name: 'Mariam Khaled Abdelrahman',
    role: 'employee',
    email: 'mariam.k@wadidegla.com',
    department: 'Finance & Payroll',
    title: 'Accountant',
  },
  {
    id: 'usr_30198',
    sapId: '30198',
    name: 'Ahmed Hassan El-Shazly',
    role: 'employee',
    email: 'ahmed.hassan@wadidegla.com',
    department: 'IT & Digital Systems',
    title: 'Technical Support Engineer',
  },
  {
    id: 'usr_10405',
    sapId: '10405',
    name: 'Mohamed El-Sayed (Team Leader)',
    role: 'team_leader',
    email: 'mohamed.elsayed@wadidegla.com',
    department: 'Operations & IT',
    title: 'IT & Operations Team Leader',
  },
  {
    id: 'usr_10012',
    sapId: '10012',
    name: 'Tarek Mansour (Manager)',
    role: 'manager',
    email: 'tarek.mansour@wadidegla.com',
    department: 'Executive Management',
    title: 'Director of Operations & HR',
  },
];

const STORAGE_KEY_USERS = 'wdc_team_users_v2';
const STORAGE_KEY_ACTIVE_USER = 'wdc_active_user_id_v2';
const STORAGE_KEY_SUBMISSIONS = 'wdc_team_submissions_v3';

export const INITIAL_SUBMISSIONS: OvertimeSubmission[] = [
  {
    id: 'sub_18492_aug2026',
    employeeId: '18492',
    employeeName: 'Omar Farouk Mostafa',
    department: 'Operations & Facilities',
    periodLabel: '16 Jul 2026 – 15 Aug 2026',
    submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'pending',
    totalOvertimeMinutes: 345, // 5 hrs 45 mins claimed
    originalTotalOvertimeMinutes: 345,
    items: [
      {
        date: '2026.07.21',
        dayOfWeek: 'Tue',
        startTime: '08:45:00',
        endTime: '19:15:00',
        shiftEndStandard: '16:00',
        overtimeMinutes: 195, // 3h 15m claimed (after 4 PM Tuesday)
        originalOvertimeMinutes: 195,
        reason: 'Emergency facility inspection and clubhouse maintenance handover.',
        category: 'overtime_manual',
        status: 'pending',
      },
      {
        date: '2026.07.28',
        dayOfWeek: 'Tue',
        startTime: '08:50:00',
        endTime: '18:30:00',
        shiftEndStandard: '16:00',
        overtimeMinutes: 150, // 2h 30m claimed
        originalOvertimeMinutes: 150,
        reason: 'Late shift sports equipment inventory count and supplier delivery verification.',
        category: 'overtime_manual',
        status: 'pending',
      },
    ],
  },
  {
    id: 'sub_30198_aug2026',
    employeeId: '30198',
    employeeName: 'Ahmed Hassan El-Shazly',
    department: 'IT & Digital Systems',
    periodLabel: '16 Jul 2026 – 15 Aug 2026',
    submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'pending',
    totalOvertimeMinutes: 270, // 4h 30m claimed
    originalTotalOvertimeMinutes: 270,
    items: [
      {
        date: '2026.07.22',
        dayOfWeek: 'Wed',
        startTime: '08:40:00',
        endTime: '20:10:00',
        shiftEndStandard: '17:00',
        overtimeMinutes: 190, // 3h 10m claimed
        originalOvertimeMinutes: 190,
        reason: 'Core network switch upgrade and server room UPS backup battery replacement.',
        category: 'overtime_manual',
        status: 'pending',
      },
      {
        date: '2026.08.03',
        dayOfWeek: 'Mon',
        startTime: '08:55:00',
        endTime: '18:20:00',
        shiftEndStandard: '17:00',
        overtimeMinutes: 80, // 1h 20m claimed
        originalOvertimeMinutes: 80,
        reason: 'Supported finance team with month-end SAP ERP ledger closing queries.',
        category: 'overtime_manual',
        status: 'pending',
      },
    ],
  },
];

export function getTeamUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load team users from storage', e);
  }
  return DEFAULT_USERS;
}

export function saveTeamUsers(users: UserProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    window.dispatchEvent(new CustomEvent('team_users_updated', { detail: users }));
  } catch (e) {
    console.error('Failed to save team users', e);
  }
}

export function getActiveUser(): UserProfile {
  const users = getTeamUsers();
  try {
    const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
    if (activeId) {
      const found = users.find((u) => u.id === activeId || u.sapId === activeId);
      if (found) return found;
    }
  } catch (e) {
    console.error(e);
  }
  // Default to first user or a clean employee profile
  return users[0] || DEFAULT_USERS[0];
}

export function setActiveUser(user: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_USER, user.id);
    window.dispatchEvent(new CustomEvent('active_user_changed', { detail: user }));
  } catch (e) {
    console.error(e);
  }
}

export function getSubmissions(): OvertimeSubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // If not in storage, initialize with sample submissions
    localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS));
    return INITIAL_SUBMISSIONS;
  } catch (e) {
    console.error('Failed to load submissions from storage', e);
  }
  return INITIAL_SUBMISSIONS;
}

export function saveSubmission(submission: OvertimeSubmission): void {
  try {
    // Ensure totals are accurate
    submission.totalOvertimeMinutes = submission.items.reduce((sum, i) => sum + (i.overtimeMinutes || 0), 0);
    submission.originalTotalOvertimeMinutes = submission.items.reduce(
      (sum, i) => sum + (i.originalOvertimeMinutes ?? i.overtimeMinutes ?? 0),
      0
    );

    const existing = getSubmissions();
    const idx = existing.findIndex((s) => s.id === submission.id);
    let updated: OvertimeSubmission[];
    if (idx >= 0) {
      updated = [...existing];
      updated[idx] = submission;
    } else {
      updated = [submission, ...existing];
    }
    localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('team_submissions_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to save submission', e);
  }
}

/**
 * Allows Team Leader to edit/correct the overtime minutes for an individual day
 * (e.g. employee was not actually on overtime or added unverified hours).
 */
export function updateItemOvertimeAdjustment(
  submissionId: string,
  date: string,
  newOvertimeMinutes: number,
  adjustedReason: string = '',
  approveAfterAdjust: boolean = false,
  leaderName: string = 'Team Leader'
): void {
  const submissions = getSubmissions();
  const sub = submissions.find((s) => s.id === submissionId);
  if (!sub) return;

  const item = sub.items.find((i) => i.date === date);
  if (!item) return;

  // Preserve original claim if this is the first adjustment
  if (item.originalOvertimeMinutes === undefined) {
    item.originalOvertimeMinutes = item.overtimeMinutes;
  }

  const validMinutes = Math.max(0, Math.round(newOvertimeMinutes));
  item.overtimeMinutes = validMinutes;
  item.isAdjustedByLeader = true;
  item.adjustedReason = adjustedReason.trim();

  if (approveAfterAdjust) {
    item.status = 'approved';
    item.decidedAt = new Date().toISOString();
    item.decidedBy = leaderName;
    item.leaderNotes = adjustedReason.trim()
      ? `Adjusted to ${Math.floor(validMinutes / 60)}h ${validMinutes % 60}m: ${adjustedReason.trim()}`
      : `Approved with adjusted duration (${Math.floor(validMinutes / 60)}h ${validMinutes % 60}m)`;
  }

  // Recalculate submission totals
  sub.totalOvertimeMinutes = sub.items.reduce((acc, i) => acc + (i.overtimeMinutes || 0), 0);
  sub.originalTotalOvertimeMinutes = sub.items.reduce(
    (acc, i) => acc + (i.originalOvertimeMinutes ?? i.overtimeMinutes ?? 0),
    0
  );

  // Update submission overall review metadata if approved
  if (approveAfterAdjust) {
    const allApproved = sub.items.every((i) => i.status === 'approved');
    const allRejected = sub.items.every((i) => i.status === 'rejected');
    const anyPending = sub.items.some((i) => i.status === 'pending');

    if (allApproved) {
      sub.status = 'approved';
    } else if (allRejected) {
      sub.status = 'rejected';
    } else if (anyPending) {
      sub.status = 'pending';
    } else {
      sub.status = 'approved';
    }

    sub.reviewedBy = leaderName;
    sub.reviewedAt = new Date().toISOString();
  }

  saveSubmission(sub);
}

/**
 * Reverts an item's overtime back to the original employee claimed duration
 */
export function resetItemOvertimeAdjustment(submissionId: string, date: string): void {
  const submissions = getSubmissions();
  const sub = submissions.find((s) => s.id === submissionId);
  if (!sub) return;

  const item = sub.items.find((i) => i.date === date);
  if (!item) return;

  if (item.originalOvertimeMinutes !== undefined) {
    item.overtimeMinutes = item.originalOvertimeMinutes;
  }
  item.isAdjustedByLeader = false;
  item.adjustedReason = undefined;

  // Recalculate submission totals
  sub.totalOvertimeMinutes = sub.items.reduce((acc, i) => acc + (i.overtimeMinutes || 0), 0);
  sub.originalTotalOvertimeMinutes = sub.items.reduce(
    (acc, i) => acc + (i.originalOvertimeMinutes ?? i.overtimeMinutes ?? 0),
    0
  );

  saveSubmission(sub);
}

export function updateItemApproval(
  submissionId: string,
  date: string,
  status: ApprovalStatus,
  leaderNotes: string = '',
  leaderName: string = 'Team Leader'
): void {
  const submissions = getSubmissions();
  const sub = submissions.find((s) => s.id === submissionId);
  if (!sub) return;

  const item = sub.items.find((i) => i.date === date);
  if (item) {
    item.status = status;
    item.leaderNotes = leaderNotes;
    item.decidedAt = new Date().toISOString();
    item.decidedBy = leaderName;
  }

  // Update overall submission status
  const allApproved = sub.items.every((i) => i.status === 'approved');
  const allRejected = sub.items.every((i) => i.status === 'rejected');
  const anyPending = sub.items.some((i) => i.status === 'pending');

  if (allApproved) {
    sub.status = 'approved';
  } else if (allRejected) {
    sub.status = 'rejected';
  } else if (anyPending) {
    sub.status = 'pending';
  } else {
    sub.status = 'approved'; // Partially approved
  }

  sub.reviewedBy = leaderName;
  sub.reviewedAt = new Date().toISOString();

  saveSubmission(sub);
}

export function updateEntireSubmissionStatus(
  submissionId: string,
  status: ApprovalStatus,
  comments: string = '',
  leaderName: string = 'Team Leader'
): void {
  const submissions = getSubmissions();
  const sub = submissions.find((s) => s.id === submissionId);
  if (!sub) return;

  sub.status = status;
  sub.leaderComments = comments;
  sub.reviewedBy = leaderName;
  sub.reviewedAt = new Date().toISOString();

  // Apply to all items inside this submission
  sub.items.forEach((item) => {
    item.status = status;
    item.leaderNotes = comments;
    item.decidedAt = new Date().toISOString();
    item.decidedBy = leaderName;
  });

  saveSubmission(sub);
}

/**
 * Generates ready-to-run MySQL / phpMyAdmin SQL script for XAMPP
 */
export function generateXamppSqlSchema(): string {
  return `-- ==========================================================
-- WADI DEGLA CLUBS - ATTENDANCE & OVERTIME DATABASE SCHEMA
-- Compatible with XAMPP MySQL / MariaDB / phpMyAdmin
-- Database: attendance_system_db
-- ==========================================================

CREATE DATABASE IF NOT EXISTS \`attendance_system_db\` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE \`attendance_system_db\`;

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS \`departments\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`code\` VARCHAR(20) NOT NULL UNIQUE,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Users Table with Role Permissions (Employee, Team Leader, Manager, Admin)
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`sap_id\` VARCHAR(20) NOT NULL UNIQUE,
  \`name\` VARCHAR(150) NOT NULL,
  \`email\` VARCHAR(150) NOT NULL UNIQUE,
  \`role\` ENUM('employee', 'team_leader', 'manager', 'admin') NOT NULL DEFAULT 'employee',
  \`department_id\` INT NULL,
  \`title\` VARCHAR(100) NULL,
  \`password_hash\` VARCHAR(255) NULL,
  \`status\` ENUM('active', 'inactive') DEFAULT 'active',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`department_id\`) REFERENCES \`departments\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Overtime Submissions Table (16th to 15th monthly cycle)
CREATE TABLE IF NOT EXISTS \`overtime_submissions\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`user_sap_id\` VARCHAR(20) NOT NULL,
  \`user_name\` VARCHAR(150) NOT NULL,
  \`department\` VARCHAR(100) NOT NULL,
  \`period_label\` VARCHAR(100) NOT NULL,
  \`total_overtime_minutes\` INT NOT NULL DEFAULT 0,
  \`status\` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  \`submitted_at\` DATETIME NOT NULL,
  \`reviewed_by\` VARCHAR(150) NULL,
  \`reviewed_at\` DATETIME NULL,
  \`leader_comments\` TEXT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_sap\` (\`user_sap_id\`),
  INDEX \`idx_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Overtime Daily Items & Mandatory Reasons
CREATE TABLE IF NOT EXISTS \`overtime_day_items\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`submission_id\` VARCHAR(64) NOT NULL,
  \`date\` VARCHAR(20) NOT NULL,
  \`day_of_week\` VARCHAR(20) NOT NULL,
  \`start_time\` VARCHAR(10) NOT NULL,
  \`end_time\` VARCHAR(10) NOT NULL,
  \`shift_end_standard\` VARCHAR(10) NOT NULL,
  \`overtime_minutes\` INT NOT NULL DEFAULT 0,
  \`mandatory_reason\` TEXT NOT NULL,
  \`category\` VARCHAR(30) NOT NULL DEFAULT 'overtime_manual',
  \`status\` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  \`leader_notes\` TEXT NULL,
  \`decided_by\` VARCHAR(150) NULL,
  \`decided_at\` DATETIME NULL,
  FOREIGN KEY (\`submission_id\`) REFERENCES \`overtime_submissions\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Insert Initial Default Roles & Users
INSERT INTO \`departments\` (\`id\`, \`name\`, \`code\`) VALUES
(1, 'IT & Digital Systems', 'IT_DEPT'),
(2, 'Operations & Facilities', 'OPS_DEPT'),
(3, 'Finance & Payroll', 'FIN_DEPT'),
(4, 'Executive Management', 'EXEC_DEPT')
ON DUPLICATE KEY UPDATE \`name\`=\`name\`;

INSERT INTO \`users\` (\`sap_id\`, \`name\`, \`email\`, \`role\`, \`department_id\`, \`title\`) VALUES
('32272', 'David Joseph Zakria', 'david.j@wadidegla.com', 'employee', 1, 'Systems Specialist'),
('18492', 'Omar Farouk Mostafa', 'omar.farouk@wadidegla.com', 'employee', 2, 'Operations Coordinator'),
('24110', 'Mariam Khaled Abdelrahman', 'mariam.k@wadidegla.com', 'employee', 3, 'Accountant'),
('30198', 'Ahmed Hassan El-Shazly', 'ahmed.hassan@wadidegla.com', 'employee', 1, 'Technical Support Engineer'),
('10405', 'Mohamed El-Sayed', 'mohamed.elsayed@wadidegla.com', 'team_leader', 1, 'IT & Operations Team Leader'),
('10012', 'Tarek Mansour', 'tarek.mansour@wadidegla.com', 'manager', 4, 'Director of Operations & HR')
ON DUPLICATE KEY UPDATE \`name\`=\`name\`;
`;
}

/**
 * Generates PHP Backend Connector for XAMPP `htdocs/attendance/api.php`
 */
export function generateXamppPhpApi(): string {
  return `<?php
/**
 * WADI DEGLA CLUBS - ATTENDANCE & OVERTIME BACKEND API FOR XAMPP
 * Place this file inside: C:\\xampp\\htdocs\\attendance\\api.php
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$host = '127.0.0.1';
$db   = 'attendance_system_db';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed. Ensure MySQL is running in XAMPP Control Panel.',
        'details' => $e->getMessage()
    ]);
    exit;
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'ping':
        echo json_encode([
            'status' => 'success',
            'server' => 'XAMPP Apache / MySQL',
            'database' => $db,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        break;

    case 'get_users':
        $stmt = $pdo->query("SELECT u.id, u.sap_id as sapId, u.name, u.role, u.email, u.title, d.name as department FROM users u LEFT JOIN departments d ON u.department_id = d.id ORDER BY u.role DESC, u.name ASC");
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
        break;

    case 'get_submissions':
        $stmt = $pdo->query("SELECT * FROM overtime_submissions ORDER BY submitted_at DESC");
        $submissions = $stmt->fetchAll();
        foreach ($submissions as &$sub) {
            $itemStmt = $pdo->prepare("SELECT * FROM overtime_day_items WHERE submission_id = ? ORDER BY date ASC");
            $itemStmt->execute([$sub['id']]);
            $sub['items'] = $itemStmt->fetchAll();
        }
        echo json_encode(['status' => 'success', 'data' => $submissions]);
        break;

    case 'save_submission':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid submission payload']);
            exit;
        }

        $stmt = $pdo->prepare("REPLACE INTO overtime_submissions (id, user_sap_id, user_name, department, period_label, total_overtime_minutes, status, submitted_at, reviewed_by, reviewed_at, leader_comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['id'],
            $data['employeeId'],
            $data['employeeName'],
            $data['department'] ?? 'General Staff',
            $data['periodLabel'] ?? '16th - 15th Cycle',
            $data['totalOvertimeMinutes'] ?? 0,
            $data['status'] ?? 'pending',
            $data['submittedAt'] ?? date('Y-m-d H:i:s'),
            $data['reviewedBy'] ?? null,
            $data['reviewedAt'] ?? null,
            $data['leaderComments'] ?? null,
        ]);

        if (!empty($data['items'])) {
            $del = $pdo->prepare("DELETE FROM overtime_day_items WHERE submission_id = ?");
            $del->execute([$data['id']]);

            $ins = $pdo->prepare("INSERT INTO overtime_day_items (submission_id, date, day_of_week, start_time, end_time, shift_end_standard, overtime_minutes, mandatory_reason, category, status, leader_notes, decided_by, decided_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($data['items'] as $item) {
                $ins->execute([
                    $data['id'],
                    $item['date'],
                    $item['dayOfWeek'] ?? '',
                    $item['startTime'] ?? '',
                    $item['endTime'] ?? '',
                    $item['shiftEndStandard'] ?? '17:00',
                    $item['overtimeMinutes'] ?? 0,
                    $item['reason'] ?? 'Work assignment',
                    $item['category'] ?? 'overtime_manual',
                    $item['status'] ?? 'pending',
                    $item['leaderNotes'] ?? null,
                    $item['decidedBy'] ?? null,
                    $item['decidedAt'] ?? null,
                ]);
            }
        }

        echo json_encode(['status' => 'success', 'message' => 'Submission saved to XAMPP database successfully']);
        break;

    default:
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Unknown API action. Use action=ping, get_users, get_submissions, save_submission']);
        break;
}
`;
}
