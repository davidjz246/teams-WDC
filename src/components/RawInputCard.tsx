import React, { useState } from 'react';
import { FileText, Play, RefreshCw, Clipboard, Trash2 } from 'lucide-react';

interface RawInputCardProps {
  rawInput: string;
  onChangeInput: (val: string) => void;
  onRun?: () => void;
}

export const RawInputCard: React.FC<RawInputCardProps> = ({ rawInput, onChangeInput, onRun }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const handleRunClick = () => {
    setIsRunning(true);
    if (onRun) onRun();
    setTimeout(() => setIsRunning(false), 700);
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          onChangeInput(text);
          setCopiedToast(true);
          setTimeout(() => setCopiedToast(false), 2500);
        }
      }
    } catch (e) {
      console.warn('Clipboard read permission denied or unavailable:', e);
    }
  };

  const handleClear = () => {
    onChangeInput('');
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 mb-6 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-500" />
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-bold">
            Raw Attendance / Teams Punch Ledger
          </h2>
        </div>

        {/* Action Controls for Pasting / Clearing */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePasteClipboard}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-muted hover:bg-accent text-foreground border border-border transition-all shadow-2xs cursor-pointer"
            title="Paste attendance punch logs directly from your clipboard"
          >
            <Clipboard className="w-3.5 h-3.5 text-amber-500" />
            <span>{copiedToast ? 'Pasted!' : 'Paste from Clipboard'}</span>
          </button>

          {rawInput.trim() && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all shadow-2xs cursor-pointer"
              title="Clear current punch text"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <textarea
        value={rawInput}
        onChange={(e) => onChangeInput(e.target.value)}
        placeholder="Paste your attendance / Teams punch logs here (Date, Check-in, Check-out)..."
        className="w-full min-h-[160px] bg-background border border-border rounded-2xl p-4 font-mono text-xs text-foreground leading-relaxed focus:outline-none focus:border-amber-500 resize-y transition-colors"
      />

      <div className="font-mono text-xs text-muted-foreground mt-3 flex items-center justify-between flex-wrap gap-2">
        <span>Paste rows of three lines each: date (YYYY.MM.DD), check-in time, check-out time.</span>
        <span className="text-amber-500 font-semibold">00:00:00 / 00:00:00 is read as absent</span>
      </div>

      {/* Prominent 'Read the Ledger' Button under Raw Punch Data */}
      <div className="mt-5 pt-4 border-t border-border/80">
        <button
          onClick={handleRunClick}
          className="w-full py-3.5 px-6 bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs sm:text-sm font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-black" />
              <span>Processing Ledger Data...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-black text-black" />
              <span>Read the ledger</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
