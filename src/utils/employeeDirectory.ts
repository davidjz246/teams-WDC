// Employee ID Directory and Auto-Lookup Service (Local Laptop Database)

const STORAGE_KEY = 'ledger_employee_directory_v3';
const LEGACY_STORAGE_KEYS = ['ledger_employee_directory', 'ledger_employee_directory_v2'];

export const DEFAULT_EMPLOYEE_DIRECTORY: Record<string, string> = {};

/**
 * Normalizes an employee ID by stripping hashes, leading/trailing whitespace, etc.
 */
export function normalizeEmployeeId(id: string): string {
  if (!id) return '';
  return id.replace(/^#+/, '').trim();
}

/**
 * Retrieves the full employee directory from localStorage (clean local database for the user's laptop)
 */
export function getEmployeeDirectory(): Record<string, string> {
  try {
    // Clear old legacy versions with demo records
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(legacyKey);
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed: Record<string, string> = JSON.parse(stored);
      // Clean and normalize keys
      const normalized: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        const cleanK = normalizeEmployeeId(k);
        const cleanV = (v || '').trim();
        if (cleanK && cleanV) {
          // Extra safety: sanitize legacy demo data if encountered
          if (cleanK === '32272' && cleanV.includes('David Joseph')) continue;
          normalized[cleanK] = cleanV;
        }
      }
      return normalized;
    }

    // First time initialization (starts empty for user to build their personal database)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EMPLOYEE_DIRECTORY));
    return { ...DEFAULT_EMPLOYEE_DIRECTORY };
  } catch (e) {
    console.error('Failed to load employee directory:', e);
    return { ...DEFAULT_EMPLOYEE_DIRECTORY };
  }
}

/**
 * Look up an employee name by Employee ID (handles spaces, '#', leading zeros, case)
 */
export function lookupEmployeeById(empId: string): string | null {
  if (!empId) return null;
  const rawTrimmed = empId.trim();
  const cleanId = normalizeEmployeeId(empId);
  if (!cleanId) return null;

  const directory = getEmployeeDirectory();

  // 1. Direct match
  if (directory[cleanId]) return directory[cleanId];
  if (directory[rawTrimmed]) return directory[rawTrimmed];

  // 2. Case-insensitive key match
  const lowerCleanId = cleanId.toLowerCase();
  for (const [key, name] of Object.entries(directory)) {
    if (key.toLowerCase() === lowerCleanId) {
      return name;
    }
  }

  // 3. Numeric match without leading zeros (e.g. '00123' -> '123')
  const numId = parseInt(cleanId, 10);
  if (!isNaN(numId)) {
    for (const [key, name] of Object.entries(directory)) {
      const parsedKeyNum = parseInt(key, 10);
      if (!isNaN(parsedKeyNum) && parsedKeyNum === numId) {
        return name;
      }
    }
  }

  return null;
}

/**
 * Look up employee ID by name
 */
export function lookupEmployeeByName(name: string): string | null {
  if (!name || !name.trim()) return null;
  const cleanName = name.trim().toLowerCase();
  const directory = getEmployeeDirectory();

  for (const [id, empName] of Object.entries(directory)) {
    if (empName.toLowerCase() === cleanName) {
      return id;
    }
  }
  return null;
}

/**
 * Saves or updates an Employee ID to Name mapping in localStorage
 */
export function saveEmployeeMapping(empId: string, name: string): void {
  const cleanId = normalizeEmployeeId(empId);
  const cleanName = name.trim();
  if (!cleanId || !cleanName) return;

  try {
    const current = getEmployeeDirectory();
    current[cleanId] = cleanName;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    // Dispatch custom event so all listeners update in real time
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('employee_directory_updated', {
        detail: { id: cleanId, name: cleanName, directory: current },
      }));
    }
  } catch (e) {
    console.error('Failed to save employee mapping:', e);
  }
}

/**
 * Permanently removes an employee mapping by Employee ID
 */
export function deleteEmployeeMapping(empId: string): void {
  const cleanId = normalizeEmployeeId(empId);
  if (!cleanId) return;

  try {
    const current = getEmployeeDirectory();
    delete current[cleanId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('employee_directory_updated', {
        detail: { id: cleanId, deleted: true, directory: current },
      }));
    }
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('employee_directory_updated', {
        detail: { cleared: true, directory: {} },
      }));
    }
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
    .sort((a, b) => {
      const numA = parseInt(a.id, 10);
      const numB = parseInt(b.id, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });
}
