import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Trash2,
  Check,
  X,
  Hash,
  UserCheck,
  UserX,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import {
  getAllEmployees,
  saveEmployeeMapping,
  deleteEmployeeMapping,
  clearAllEmployeeDirectory,
} from '../utils/employeeDirectory';

interface EmployeeDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmployee: (id: string, name: string) => void;
  currentId: string;
}

export const EmployeeDirectoryModal: React.FC<EmployeeDirectoryModalProps> = ({
  isOpen,
  onClose,
  onSelectEmployee,
  currentId,
}) => {
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);

  const reloadEmployees = () => {
    setEmployees(getAllEmployees());
  };

  useEffect(() => {
    if (isOpen) {
      reloadEmployees();
      setSearchQuery('');
      setSuccessMessage(null);
      setDeletingId(null);
      setIsConfirmingClearAll(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || !newName.trim()) return;

    saveEmployeeMapping(newId.trim(), newName.trim());
    reloadEmployees();
    setSuccessMessage(`Saved ID #${newId.trim()} — ${newName.trim()}`);
    setNewId('');
    setNewName('');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteEmployeeMapping(id);
    if (currentId === id) {
      onSelectEmployee('', '');
    }
    reloadEmployees();
    setDeletingId(null);
    setSuccessMessage(`Permanently deleted ID #${id}`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleClearAllDirectory = () => {
    clearAllEmployeeDirectory();
    onSelectEmployee('', '');
    reloadEmployees();
    setIsConfirmingClearAll(false);
    setSuccessMessage('Cleared all employee directory entries');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleClearSelection = () => {
    onSelectEmployee('', '');
    setSuccessMessage('Cleared selected employee');
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-500">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <span>Employee Staff Directory</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-teal-500/15 text-teal-400 font-bold border border-teal-500/20">
                  {employees.length} Records
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add, search, select, or delete employee records.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Currently Selected Employee Bar (with 1-click Clear option) */}
          {currentId && (
            <div className="p-3 rounded-2xl border border-teal-500/30 bg-teal-500/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <div className="text-xs font-mono">
                  <span className="text-muted-foreground">Currently Selected: </span>
                  <span className="font-bold text-foreground">ID #{currentId}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearSelection}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 transition-all cursor-pointer shadow-xs"
                title="Clear selected employee from ledger"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Clear / Unselect</span>
              </button>
            </div>
          )}

          {/* Add / Update Employee Record Form */}
          <form
            onSubmit={handleAddEmployee}
            className="p-4 rounded-2xl border border-border bg-muted/20 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-teal-500" />
                <span>Add / Update Employee Record</span>
              </span>
              {successMessage && (
                <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
                  <Check className="w-3.5 h-3.5" /> {successMessage}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-4 relative flex items-center">
                <input
                  type="text"
                  placeholder="ID # (e.g. 32272)"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="w-full pl-3 pr-7 py-2 bg-background border border-border rounded-xl font-mono text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
                {newId && (
                  <button
                    type="button"
                    onClick={() => setNewId('')}
                    className="absolute right-2 p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="sm:col-span-6 relative flex items-center">
                <input
                  type="text"
                  placeholder="Full Employee Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full pl-3 pr-7 py-2 bg-background border border-border rounded-xl font-mono text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
                {newName && (
                  <button
                    type="button"
                    onClick={() => setNewName('')}
                    className="absolute right-2 p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={!newId.trim() || !newName.trim()}
                  className="w-full h-full py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </form>

          {/* Search Box & Controls */}
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Employee ID or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-background border border-border rounded-xl font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {employees.length > 0 && !isConfirmingClearAll && (
              <button
                type="button"
                onClick={() => setIsConfirmingClearAll(true)}
                className="px-3 py-2 rounded-xl text-xs font-mono text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
                title="Remove all records from directory"
              >
                Clear Directory
              </button>
            )}

            {isConfirmingClearAll && (
              <div className="flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/30 px-2.5 py-1.5 rounded-xl animate-in fade-in shrink-0">
                <span className="text-[11px] font-mono text-rose-500 font-bold">Wipe all {employees.length} records?</span>
                <button
                  type="button"
                  onClick={handleClearAllDirectory}
                  className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-mono font-bold cursor-pointer"
                >
                  Yes, Wipe
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingClearAll(false)}
                  className="px-2 py-1 bg-muted hover:bg-accent text-foreground rounded-lg text-[10px] font-mono cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Employee Records List */}
          <div className="space-y-2">
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground font-mono text-xs border border-dashed border-border rounded-2xl p-6">
                No employee records found. Add an Employee ID above to start your directory.
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const isSelected = emp.id === currentId;
                const isConfirmingDelete = deletingId === emp.id;

                return (
                  <div
                    key={emp.id}
                    onClick={() => {
                      if (!isConfirmingDelete) {
                        onSelectEmployee(emp.id, emp.name);
                        onClose();
                      }
                    }}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                      isSelected
                        ? 'bg-teal-500/10 border-teal-500/40 text-foreground ring-1 ring-teal-500/30'
                        : 'bg-card border-border hover:border-teal-500/40 hover:bg-accent/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-teal-500 text-black'
                            : 'bg-muted text-foreground group-hover:bg-teal-500/20'
                        }`}
                      >
                        <Hash className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-foreground">
                            ID #{emp.id}
                          </span>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-500/20 text-teal-400 font-bold flex items-center gap-1">
                              <UserCheck className="w-3 h-3" /> Selected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium truncate">{emp.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isConfirmingDelete ? (
                        <div
                          className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 p-1 rounded-xl animate-in fade-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[10px] font-mono text-rose-500 font-bold px-1">Delete ID #{emp.id}?</span>
                          <button
                            type="button"
                            onClick={(e) => confirmDelete(emp.id, e)}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-mono font-bold cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(null);
                            }}
                            className="px-2 py-1 bg-muted hover:bg-accent text-foreground rounded-lg text-[10px] font-mono cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(emp.id);
                          }}
                          className="p-2 rounded-xl text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                          title={`Delete ID #${emp.id} from directory`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
          {currentId ? (
            <button
              type="button"
              onClick={handleClearSelection}
              className="px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Clear Selected Employee</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-border bg-background hover:bg-accent text-xs font-mono font-medium text-foreground transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
