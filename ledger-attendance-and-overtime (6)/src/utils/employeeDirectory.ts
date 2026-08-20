// Employee ID Directory and Auto-Lookup Service

const STORAGE_KEY = 'ledger_employee_directory_v2';
const LEGACY_STORAGE_KEY = 'ledger_employee_directory';

// Only keep David Joseph (or empty if deleted) — No mock/testing dummy names
export const DEFAULT_EMPLOYEE_DIRECTORY: Record<string, string> = {
  '32272': 'David Joseph Zakria Ibrahim Kalad',
};

/**
 * Retrieves the full employee directory from localStorage
 */
export function getEmployeeDirectory(): Record<string, string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return JSON.parse(stored);
    }

    // First time initialization: remove any legacy mock test data
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EMPLOYEE_DIRECTORY));
    return { ...DEFAULT_EMPLOYEE_DIRECTORY };
  } catch (e) {
    console.error('Failed to load employee directory:', e);
    return { ...DEFAULT_EMPLOYEE_DIRECTORY };
  }
}

/**
 * Look up an employee name by Employee ID (case-insensitive & trimmed)
 */
export function lookupEmployeeById(empId: string): string | null {
  const trimmed = empId.trim();
  if (!trimmed) return null;
  const directory = getEmployeeDirectory();
  return directory[trimmed] || null;
}

/**
 * Saves or updates an Employee ID to Name mapping in localStorage
 */
export function saveEmployeeMapping(empId: string, name: string): void {
  const trimmedId = empId.trim();
  const trimmedName = name.trim();
  if (!trimmedId || !trimmedName) return;

  try {
    const current = getEmployeeDirectory();
    current[trimmedId] = trimmedName;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save employee mapping:', e);
  }
}

/**
 * Permanently removes an employee mapping by Employee ID
 */
export function deleteEmployeeMapping(empId: string): void {
  const trimmedId = empId.trim();
  if (!trimmedId) return;

  try {
    const current = getEmployeeDirectory();
    delete current[trimmedId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to delete employee mapping:', e);
  }
}

/**
 * Clears all employee records from the directory
 */
export function clearAllEmployeeDirectory(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
  } catch (e) {
    console.error('Failed to clear employee directory:', e);
  }
}

/**
 * Returns all directory entries as a sorted array
 */
export function getAllEmployees(): { id: string; name: string }[] {
  const directory = getEmployeeDirectory();
  return Object.entries(directory)
    .map(([id, name]) => ({
      id,
      name,
    }))
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}
