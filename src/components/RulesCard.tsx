import React from 'react';
import { RuleSettings } from '../types';
import { Clock, ShieldAlert, Award, Sliders, CalendarDays, Timer } from 'lucide-react';
import { DAY_NAMES, formatWeekendNames } from '../utils/parser';

interface RulesCardProps {
  rules: RuleSettings;
  onChangeRules: (rules: RuleSettings) => void;
}

export const RulesCard: React.FC<RulesCardProps> = ({ rules, onChangeRules }) => {
  const updateRule = <K extends keyof RuleSettings>(key: K, value: RuleSettings[K]) => {
    onChangeRules({
      ...rules,
      [key]: value,
    });
  };

  const toggleWeekendDay = (dayIndex: number) => {
    const current = rules.weekendDays || [0, 5, 6];
    let updated: number[];
    if (current.includes(dayIndex)) {
      updated = current.filter((d) => d !== dayIndex);
    } else {
      updated = [...current, dayIndex];
    }
    updateRule('weekendDays', updated);
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500" />
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-bold">
              Overtime &amp; Attendance Rules (Sunday Weekend &amp; Tuesday 4:00 PM)
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Rule 1: Checkout Time */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              rules.timeOn ? 'bg-muted/30 border-border' : 'bg-muted/10 border-border/40 opacity-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold font-mono text-foreground flex items-center gap-1.5 cursor-pointer">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Shift End (Mon-Thu)</span>
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
              <span>Standard cutoff:</span>
              <input
                type="time"
                value={rules.timeVal}
                disabled={!rules.timeOn}
                onChange={(e) => updateRule('timeVal', e.target.value)}
                className="bg-background border border-border rounded-lg px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:border-amber-500 disabled:opacity-50 font-bold"
              />
            </div>
          </div>

          {/* Rule 2: Tuesday Early Departure (4:00 PM) */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              rules.tuesdayEarlyShift ? 'bg-blue-500/10 border-blue-500/30' : 'bg-muted/10 border-border/40 opacity-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold font-mono text-blue-500 flex items-center gap-1.5 cursor-pointer">
                <Timer className="w-3.5 h-3.5 text-blue-500" />
                <span>Tuesday 4 PM Cutoff</span>
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.tuesdayEarlyShift}
                  onChange={(e) => updateRule('tuesdayEarlyShift', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            <div className="font-mono text-xs text-muted-foreground flex items-center gap-2">
              <span>Tuesday checkout:</span>
              <input
                type="time"
                value={rules.tuesdayShiftEnd || '16:00'}
                disabled={!rules.tuesdayEarlyShift}
                onChange={(e) => updateRule('tuesdayShiftEnd', e.target.value)}
                className="bg-background border border-border rounded-lg px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:border-blue-500 disabled:opacity-50 font-bold text-blue-600 dark:text-blue-400"
              />
            </div>
          </div>

          {/* Rule 3: Hours Worked */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
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
              <span>Flag overtime &gt;</span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={rules.hoursVal}
                disabled={!rules.hoursOn}
                onChange={(e) => updateRule('hoursVal', parseFloat(e.target.value) || 0)}
                className="w-14 bg-background border border-border rounded-lg px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:border-amber-500 disabled:opacity-50 font-bold"
              />
              <span>hrs/day</span>
            </div>
          </div>

          {/* Rule 4: Late Arrival Threshold */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              rules.lateOn ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30' : 'bg-muted/10 border-border/40 opacity-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold font-mono text-rose-700 dark:text-rose-400 flex items-center gap-1.5 cursor-pointer">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Late Arrival</span>
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
                className="bg-background border border-border rounded-lg px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:border-rose-500 disabled:opacity-50 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Weekend Days Selector: Sunday, Friday, Saturday */}
        <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-mono font-bold text-foreground">Official Weekend Days:</span>
            <span className="text-xs font-mono text-muted-foreground">
              ({formatWeekendNames(rules.weekendDays || [0, 5, 6])})
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {DAY_NAMES.map((day) => {
              const isSelected = (rules.weekendDays || [0, 5, 6]).includes(day.index);
              return (
                <button
                  key={day.index}
                  type="button"
                  onClick={() => toggleWeekendDay(day.index)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-bold border-primary shadow-xs'
                      : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground'
                  }`}
                >
                  {day.short}
                </button>
              );
            })}
          </div>
        </div>

        <p className="font-mono text-xs text-muted-foreground mt-3 leading-relaxed">
          • <strong className="text-foreground">Tuesday Rule:</strong> Standard shift ends at <strong>4:00 PM (16:00)</strong>. Overtime calculates after 16:00 with grace period.
          <br />
          • <strong className="text-foreground">Sunday Weekend:</strong> Sunday is recognized as a weekend day like Friday and Saturday.
        </p>
      </div>
    </div>
  );
};
