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
    <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-border/80">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500" />
            <h2 className="font-mono text-xs uppercase tracking-widest text-foreground font-bold">
              Attendance &amp; Overtime Rules Engine
            </h2>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
            Sunday Weekend &amp; Tuesday 4:00 PM
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Rule 1: Checkout Time */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              rules.timeOn ? 'bg-muted/25 border-border shadow-2xs' : 'bg-muted/10 border-border/40 opacity-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold font-mono text-foreground flex items-center gap-1.5 cursor-pointer">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Shift End (Standard)</span>
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.timeOn}
                  onChange={(e) => updateRule('timeOn', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
            <div className="font-mono text-xs text-muted-foreground flex items-center justify-between gap-2">
              <span>Cutoff time:</span>
              <input
                type="time"
                value={rules.timeVal}
                disabled={!rules.timeOn}
                onChange={(e) => updateRule('timeVal', e.target.value)}
                className="bg-background border border-border rounded-xl px-2.5 py-1 font-mono text-xs text-foreground focus:outline-hidden focus:border-amber-500 disabled:opacity-50 font-bold"
              />
            </div>
          </div>

          {/* Rule 2: Tuesday Early Departure (4:00 PM) */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              rules.tuesdayEarlyShift ? 'bg-amber-500/10 border-amber-500/30 shadow-2xs' : 'bg-muted/10 border-border/40 opacity-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold font-mono text-amber-400 flex items-center gap-1.5 cursor-pointer">
                <Timer className="w-3.5 h-3.5 text-amber-500" />
                <span>Tuesday 4 PM Cutoff</span>
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.tuesdayEarlyShift}
                  onChange={(e) => updateRule('tuesdayEarlyShift', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
            <div className="font-mono text-xs text-muted-foreground flex items-center justify-between gap-2">
              <span>Tue checkout:</span>
              <input
                type="time"
                value={rules.tuesdayShiftEnd || '16:00'}
                disabled={!rules.tuesdayEarlyShift}
                onChange={(e) => updateRule('tuesdayShiftEnd', e.target.value)}
                className="bg-background border border-border rounded-xl px-2.5 py-1 font-mono text-xs text-foreground focus:outline-hidden focus:border-amber-500 disabled:opacity-50 font-bold text-amber-400"
              />
            </div>
          </div>

          {/* Rule 3: Hours Worked */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              rules.hoursOn ? 'bg-muted/25 border-border shadow-2xs' : 'bg-muted/10 border-border/40 opacity-50'
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
                <div className="w-9 h-5 bg-muted peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
            <div className="font-mono text-xs text-muted-foreground flex items-center justify-between gap-2">
              <span>Overtime &gt;</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={rules.hoursVal}
                  disabled={!rules.hoursOn}
                  onChange={(e) => updateRule('hoursVal', parseFloat(e.target.value) || 0)}
                  className="w-14 bg-background border border-border rounded-xl px-2 py-1 font-mono text-xs text-foreground focus:outline-hidden focus:border-amber-500 disabled:opacity-50 font-bold text-center"
                />
                <span>hrs</span>
              </div>
            </div>
          </div>

          {/* Rule 4: Late Arrival Threshold */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              rules.lateOn ? 'bg-rose-500/10 border-rose-500/30 shadow-2xs' : 'bg-muted/10 border-border/40 opacity-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold font-mono text-rose-400 flex items-center gap-1.5 cursor-pointer">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Late Arrival</span>
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.lateOn}
                  onChange={(e) => updateRule('lateOn', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
              </label>
            </div>
            <div className="font-mono text-xs text-muted-foreground flex items-center justify-between gap-2">
              <span>Late after:</span>
              <input
                type="time"
                value={rules.lateVal}
                disabled={!rules.lateOn}
                onChange={(e) => updateRule('lateVal', e.target.value)}
                className="bg-background border border-border rounded-xl px-2.5 py-1 font-mono text-xs text-foreground focus:outline-hidden focus:border-rose-500 disabled:opacity-50 font-bold text-rose-400"
              />
            </div>
          </div>
        </div>

        {/* Weekend Days Selector: Sunday, Friday, Saturday */}
        <div className="mt-4 pt-4 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-amber-500 shrink-0" />
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
                  className={`px-3 py-1.5 text-xs font-mono rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-black font-bold border-amber-500 shadow-2xs'
                      : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {day.short}
                </button>
              );
            })}
          </div>
        </div>

        <p className="font-mono text-[11px] text-muted-foreground mt-3 leading-relaxed">
          • <strong className="text-foreground">Tuesday Rule:</strong> Standard shift ends at <strong>4:00 PM (16:00)</strong>. Overtime calculates after 16:00 with grace period.
          <br />
          • <strong className="text-foreground">Sunday Weekend:</strong> Sunday is recognized as a weekend day along with Friday and Saturday.
        </p>
      </div>
    </div>
  );
};

