import React from 'react';
import { RuleSettings } from '../types';
import { Clock, ShieldAlert, Award, Sliders } from 'lucide-react';

interface RulesCardProps {
  rules: RuleSettings;
  onChangeRules: (rules: RuleSettings) => void;
  onRun?: () => void;
}

export const RulesCard: React.FC<RulesCardProps> = ({ rules, onChangeRules }) => {
  const updateRule = <K extends keyof RuleSettings>(key: K, value: RuleSettings[K]) => {
    onChangeRules({
      ...rules,
      [key]: value,
    });
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500" />
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-bold">
              Overtime &amp; Attendance Rules
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rule 1: Checkout Time */}
          <div
            className={`p-4.5 rounded-2xl border transition-all ${
              rules.timeOn ? 'bg-muted/30 border-border' : 'bg-muted/10 border-border/40 opacity-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold font-mono text-foreground flex items-center gap-1.5 cursor-pointer">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Checkout Time</span>
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.timeOn}
                  onChange={(e) => updateRule('timeOn', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
            <div className="font-mono text-xs text-muted-foreground flex items-center gap-2">
              <span>Flag overtime after</span>
              <input
                type="time"
                value={rules.timeVal}
                disabled={!rules.timeOn}
                onChange={(e) => updateRule('timeVal', e.target.value)}
                className="bg-background border border-border rounded-lg px-2.5 py-1 font-mono text-xs text-foreground focus:outline-none focus:border-amber-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Rule 2: Hours Worked */}
          <div
            className={`p-4.5 rounded-2xl border transition-all ${
              rules.hoursOn ? 'bg-muted/30 border-border' : 'bg-muted/10 border-border/40 opacity-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold font-mono text-foreground flex items-center gap-1.5 cursor-pointer">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Worked Hours</span>
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.hoursOn}
                  onChange={(e) => updateRule('hoursOn', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
            <div className="font-mono text-xs text-muted-foreground flex items-center gap-2">
              <span>Flag overtime if &gt;</span>
              <input
                type="number"
                min="0"
                step="0.25"
                value={rules.hoursVal}
                disabled={!rules.hoursOn}
                onChange={(e) => updateRule('hoursVal', parseFloat(e.target.value) || 0)}
                className="w-16 bg-background border border-border rounded-lg px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:border-amber-500 disabled:opacity-50"
              />
              <span>hrs</span>
            </div>
          </div>

          {/* Rule 3: Late Arrival (09:15 AM default) */}
          <div
            className={`p-4.5 rounded-2xl border transition-all ${
              rules.lateOn ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30' : 'bg-muted/10 border-border/40 opacity-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold font-mono text-rose-700 dark:text-rose-400 flex items-center gap-1.5 cursor-pointer">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Late Threshold</span>
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.lateOn}
                  onChange={(e) => updateRule('lateOn', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
              </label>
            </div>
            <div className="font-mono text-xs text-muted-foreground flex items-center gap-2">
              <span>Flag late after</span>
              <input
                type="time"
                value={rules.lateVal}
                disabled={!rules.lateOn}
                onChange={(e) => updateRule('lateVal', e.target.value)}
                className="bg-background border border-border rounded-lg px-2.5 py-1 font-mono text-xs text-foreground focus:outline-none focus:border-rose-500 disabled:opacity-50 font-bold"
              />
            </div>
          </div>
        </div>

        <p className="font-mono text-xs text-muted-foreground mt-4 leading-relaxed">
          Overtime starts calculating after {rules.timeVal || '17:45'}.{' '}
          <span className="text-rose-700 dark:text-rose-400 font-medium">
            Late arrival has no grace window: check-in past {rules.lateVal || '09:15'} triggers warning alert.
          </span>
        </p>
      </div>
    </div>
  );
};

