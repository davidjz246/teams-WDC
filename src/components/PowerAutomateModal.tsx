import React from 'react';
import { Bot, Calendar, Sparkles, Copy, X, Check } from 'lucide-react';

interface PowerAutomateModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
}

export const PowerAutomateModal: React.FC<PowerAutomateModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
}) => {
  const [copiedSection, setCopiedSection] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const alertFlowSteps = `1. Trigger: Recurrence (Runs on day 14 of every month at 09:00 AM)
2. Condition: formatDateTime(utcNow(), 'dd') equals '14'
3. Action 1: Get user profile / Staff Directory (User: ${employeeName || 'david.j.z2002@gmail.com'})
4. Action 2: Send monthly reminder notification:
   "⏰ Reminder: Today is the 14th! Time to review and export your Overtime & Attendance Ledger."`;

  const stickyNoteGraphQuery = `GET https://graph.microsoft.com/v1.0/me/onenote/pages?$filter=contains(title,'Overtime') or contains(title,'Notes')`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Power Automate Scheduled Flow Guide</h3>
            <p className="text-xs font-mono text-muted-foreground">
              Automated 14th of month alert + Sticky Notes import
            </p>
          </div>
        </div>

        {/* Step Flow Walkthrough */}
        <div className="space-y-4">
          {/* Step 1: Day 14 Alert */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-mono text-amber-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                STEP 1: 14th of the Month Recurrence Alert Flow
              </span>
              <button
                onClick={() => handleCopy(alertFlowSteps, 'step1')}
                className="text-[11px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 bg-background px-2 py-0.5 rounded-lg border border-border cursor-pointer"
              >
                {copiedSection === 'step1' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>Copy Step</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Create a <strong>Scheduled Cloud Flow</strong> in Power Automate:
            </p>
            <pre className="p-3 bg-background rounded-xl border border-border text-[11px] font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
              {alertFlowSteps}
            </pre>
          </div>

          {/* Step 2: Sticky Notes Reason Sync */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-mono text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                STEP 2: Sticky Notes Automatic Reason Reader
              </span>
              <button
                onClick={() => handleCopy(stickyNoteGraphQuery, 'step2')}
                className="text-[11px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 bg-background px-2 py-0.5 rounded-lg border border-border cursor-pointer"
              >
                {copiedSection === 'step2' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>Copy Graph Query</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              In Power Automate Desktop or Cloud Flow, read your Sticky Notes via Microsoft Graph or local SQLite DB (<code className="text-xs">plum.sqlite</code>) and paste them directly into the <strong>Sticky Notes</strong> tool in this app.
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Got it, Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
