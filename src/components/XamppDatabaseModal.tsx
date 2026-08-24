import React, { useState } from 'react';
import { 
  X, 
  Server, 
  Database, 
  Users, 
  Plus, 
  Trash2, 
  Download, 
  Check, 
  Copy, 
  RefreshCw, 
  Code,
  Shield,
  Activity
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { 
  generateXamppPhpApi, 
  generateXamppSqlSchema, 
  getTeamUsers, 
  saveTeamUsers,
  getSubmissions 
} from '../utils/teamDatabase';

interface XamppDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserSelect?: (user: UserProfile) => void;
}

export const XamppDatabaseModal: React.FC<XamppDatabaseModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserSelect,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'sql' | 'php' | 'connection'>('users');
  const [users, setUsers] = useState<UserProfile[]>(() => getTeamUsers());
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // New user form state
  const [newSapId, setNewSapId] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('employee');
  const [newDept, setNewDept] = useState('IT & Digital Systems');
  const [newTitle, setNewTitle] = useState('Systems Specialist');
  const [newEmail, setNewEmail] = useState('');

  // XAMPP Connection tester state
  const [endpointUrl, setEndpointUrl] = useState('http://localhost/attendance/api.php');
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [pingMessage, setPingMessage] = useState('');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const downloadFile = (filename: string, content: string, type: string = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSapId.trim() || !newName.trim()) {
      alert('SAP ID and Employee Name are required');
      return;
    }

    const cleanSap = newSapId.replace(/[^0-9]/g, '');
    const newUser: UserProfile = {
      id: `usr_${cleanSap || Date.now()}`,
      sapId: cleanSap || newSapId.trim(),
      name: newName.trim(),
      role: newRole,
      department: newDept.trim(),
      title: newTitle.trim(),
      email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '.')}@wadidegla.com`,
    };

    const updated = [...users, newUser];
    setUsers(updated);
    saveTeamUsers(updated);

    // Reset form
    setNewSapId('');
    setNewName('');
    setNewTitle('');
    setNewEmail('');
  };

  const handleDeleteUser = (id: string) => {
    if (users.length <= 1) {
      alert('You must keep at least one active user in the directory.');
      return;
    }
    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
    saveTeamUsers(updated);
  };

  const handleTestXamppPing = async () => {
    setPingStatus('testing');
    setPingMessage('Testing connection to local XAMPP Apache / MySQL server...');
    try {
      const res = await fetch(`${endpointUrl}?action=ping`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setPingStatus('success');
        setPingMessage(`Connected successfully! Server: ${data.server || 'XAMPP'}, Database: ${data.database || 'attendance_system_db'}`);
      } else {
        setPingStatus('error');
        setPingMessage(`HTTP error ${res.status}: Ensure Apache & MySQL are running in XAMPP Control Panel and api.php is in htdocs/attendance/`);
      }
    } catch (err: any) {
      setPingStatus('error');
      setPingMessage(`Connection failed. (Note: In browser preview, local CORS might block requests to http://localhost. Run the compiled app locally or download the XAMPP files below).`);
    }
  };

  const sqlSchema = generateXamppSqlSchema();
  const phpApiCode = generateXamppPhpApi();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                XAMPP & MySQL Database & Role Permissions Center
              </h3>
              <p className="text-xs text-muted-foreground">
                Manage employee user credentials, role permissions (Employee, Team Leader, Manager), and download XAMPP MySQL files.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border bg-muted/10 px-5 gap-2 pt-2">
          {[
            { id: 'users', label: '👥 Team Roster & Roles', icon: Users },
            { id: 'sql', label: '🗄️ MySQL Schema (.sql)', icon: Database },
            { id: 'php', label: '⚡ PHP Backend API', icon: Code },
            { id: 'connection', label: '🔌 XAMPP Server Sync', icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-all ${
                  activeTab === tab.id
                    ? 'border-primary text-foreground bg-card rounded-t-lg'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: USERS & ROLES */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Add New User Form */}
              <div className="bg-muted/30 border border-border p-4 rounded-xl space-y-4">
                <h4 className="text-xs font-bold font-mono uppercase text-foreground flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  Add New Employee / Team Leader / Manager
                </h4>

                <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-muted-foreground mb-1 font-mono">SAP ID # *</label>
                    <input
                      type="text"
                      value={newSapId}
                      onChange={(e) => setNewSapId(e.target.value)}
                      placeholder="e.g. 32272"
                      required
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1 font-mono">Full Name *</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. John Doe"
                      required
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1 font-mono">Role Permission *</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as UserRole)}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="employee">Employee (Log Punches & Submit OT)</option>
                      <option value="team_leader">Team Leader (Approve / Deny OT)</option>
                      <option value="manager">Manager (Executive Overview & Matrix)</option>
                      <option value="admin">Administrator (Full Access)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1 font-mono">Department</label>
                    <input
                      type="text"
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      placeholder="e.g. IT & Digital Systems"
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1 font-mono">Job Title</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Specialist"
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-1.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs cursor-pointer shadow-xs"
                    >
                      + Save to Database
                    </button>
                  </div>
                </form>
              </div>

              {/* Users Roster Table */}
              <div className="border border-border rounded-xl overflow-hidden bg-card">
                <div className="p-3 bg-muted/40 border-b border-border flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-foreground">Registered System Accounts ({users.length})</span>
                  <span className="text-muted-foreground">Stored locally & syncable to XAMPP MySQL</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/20 text-muted-foreground uppercase font-mono text-[10px] border-b border-border">
                      <tr>
                        <th className="py-2.5 px-3">SAP ID</th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Role Permission</th>
                        <th className="py-2.5 px-3">Department & Title</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map((u) => {
                        const isCurrent = currentUser.id === u.id || currentUser.sapId === u.sapId;
                        return (
                          <tr key={u.id} className={isCurrent ? 'bg-primary/5' : 'hover:bg-muted/30'}>
                            <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                              #{u.sapId}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-foreground">
                              {u.name}
                              {isCurrent && (
                                <span className="ml-2 px-1.5 py-0.2 rounded text-[10px] bg-primary text-primary-foreground font-mono">
                                  Current
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                                  u.role === 'manager'
                                    ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                                    : u.role === 'team_leader'
                                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                }`}
                              >
                                {u.role.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground">
                              {u.department} • {u.title}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {onUserSelect && (
                                  <button
                                    type="button"
                                    onClick={() => onUserSelect(u)}
                                    className="px-2 py-1 rounded text-[11px] bg-secondary hover:bg-secondary/80 text-foreground border border-border cursor-pointer font-medium"
                                  >
                                    Switch To
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-1 rounded text-muted-foreground hover:text-rose-500 cursor-pointer"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SQL SCHEMA FOR XAMPP */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-foreground text-sm">
                    XAMPP / phpMyAdmin SQL Database Script
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Import this script into phpMyAdmin (or MySQL workbench) to create all database tables and roles.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(sqlSchema, 'sql')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedSection === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'sql' ? 'Copied!' : 'Copy SQL'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadFile('attendance_system_db.sql', sqlSchema, 'text/sql')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .sql File</span>
                  </button>
                </div>
              </div>

              <div className="relative rounded-xl border border-border bg-muted/40 p-4 font-mono text-xs max-h-96 overflow-y-auto">
                <pre className="text-muted-foreground whitespace-pre-wrap">{sqlSchema}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: PHP API CODE */}
          {activeTab === 'php' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-foreground text-sm">
                    XAMPP PHP API Endpoint (`api.php`)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Place this file in <code className="font-mono bg-muted px-1.5 py-0.5 rounded">C:\xampp\htdocs\attendance\api.php</code> to connect this web app with MySQL.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(phpApiCode, 'php')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedSection === 'php' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'php' ? 'Copied!' : 'Copy PHP'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadFile('api.php', phpApiCode, 'text/php')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download api.php</span>
                  </button>
                </div>
              </div>

              <div className="relative rounded-xl border border-border bg-muted/40 p-4 font-mono text-xs max-h-96 overflow-y-auto">
                <pre className="text-muted-foreground whitespace-pre-wrap">{phpApiCode}</pre>
              </div>
            </div>
          )}

          {/* TAB 4: CONNECTION & LIVE SYNC */}
          {activeTab === 'connection' && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm">
                      Live Local XAMPP Server Connection
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      You can connect this app directly to your local Apache MySQL server to sync users, attendance punches, and approvals automatically.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={endpointUrl}
                    onChange={(e) => setEndpointUrl(e.target.value)}
                    placeholder="http://localhost/attendance/api.php"
                    className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-border bg-background text-foreground font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestXamppPing}
                    disabled={pingStatus === 'testing'}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${pingStatus === 'testing' ? 'animate-spin' : ''}`} />
                    <span>Test Ping</span>
                  </button>
                </div>

                {pingMessage && (
                  <div
                    className={`p-3 rounded-lg text-xs font-mono border ${
                      pingStatus === 'success'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : pingStatus === 'error'
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {pingMessage}
                  </div>
                )}
              </div>

              {/* Instructions Steps */}
              <div className="bg-muted/20 border border-border rounded-xl p-5 space-y-3">
                <h4 className="font-bold text-foreground text-xs uppercase font-mono">
                  3-Step XAMPP Setup Guide:
                </h4>
                <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                  <li>
                    Open <strong>XAMPP Control Panel</strong> and start <strong>Apache</strong> and <strong>MySQL</strong>.
                  </li>
                  <li>
                    Open <strong>phpMyAdmin</strong> (<code className="font-mono text-foreground">http://localhost/phpmyadmin</code>) and run the SQL from the <strong>MySQL Schema</strong> tab.
                  </li>
                  <li>
                    Create a folder <code className="font-mono text-foreground">C:\xampp\htdocs\attendance</code> and save the <code className="font-mono text-foreground">api.php</code> file inside it.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">
            Wadi Degla Clubs • Enterprise Attendance System
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border cursor-pointer"
          >
            Close Center
          </button>
        </div>
      </div>
    </div>
  );
};
