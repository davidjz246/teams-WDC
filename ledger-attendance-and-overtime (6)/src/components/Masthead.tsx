import React from 'react';
import { Sun, Moon, RotateCcw, Sparkles } from 'lucide-react';
import { ThemeMode } from '../types';
import { WadiDeglaLogo } from './WadiDeglaLogo';

interface MastheadProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onResetSession: () => void;
  onLoadSampleDemo: () => void;
}

export const Masthead: React.FC<MastheadProps> = ({
  theme,
  onToggleTheme,
  onResetSession,
  onLoadSampleDemo,
}) => {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 gap-4 border-b border-border/80">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-14 flex items-center justify-center shrink-0">
          <WadiDeglaLogo className="w-full h-full" variant="image" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-1">
            AttendanceTracker<span className="text-amber-500">.</span>
          </h1>
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest font-medium">
            Wadi Degla Clubs Attendance &amp; Overtime System
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
        {/* LocalStorage Sync Indicator */}
        <div
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono rounded-full border border-border/80 bg-muted/40 text-muted-foreground"
          title="All input punches, reasons, checkpoints, and employee settings are continuously auto-saved to your browser's local storage."
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Auto-Saved</span>
        </div>

        {/* Reset Session for New Employee */}
        <button
          onClick={onResetSession}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-medium rounded-full border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-all shadow-xs cursor-pointer"
          title="Clear employee details and punch ledger to start a new employee entry"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset (New Employee)</span>
        </button>

        {/* Load Demo Sample */}
        <button
          onClick={onLoadSampleDemo}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-medium rounded-full border border-border bg-card hover:bg-accent text-foreground transition-all shadow-xs cursor-pointer"
          title="Load demonstration sample punch data and metadata"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Load Demo Sample</span>
        </button>

        {/* Bento-style theme pill */}
        <div className="flex items-center bg-card border border-border p-1 rounded-full shadow-xs">
          <button
            onClick={() => theme !== 'dark' && onToggleTheme()}
            className={`px-3 py-1 rounded-full text-xs font-medium font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              theme === 'dark'
                ? 'bg-muted text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-amber-400" />
            <span>Dark</span>
          </button>
          <button
            onClick={() => theme !== 'light' && onToggleTheme()}
            className={`px-3 py-1 rounded-full text-xs font-medium font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              theme === 'light'
                ? 'bg-muted text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Light</span>
          </button>
        </div>
      </div>
    </header>
  );
};
