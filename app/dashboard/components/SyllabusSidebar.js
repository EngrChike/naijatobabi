// app/dashboard/components/SyllabusSidebar.js
import React from 'react';

export default function SyllabusSidebar({ activeDay, completedDays, onSelectDay, currentUnlockLimit, onResetAll }) {
  // Generate days up to the current unlocked limit (up to 30)
  const daysArray = Array.from({ length: currentUnlockLimit }, (_, i) => i + 1);

  const getDayTitle = (day) => {
    if (day % 6 === 0) return `Day ${day}: Weekly Master Evaluation 🏆`;
    return `Day ${day}: Street Fluency Practice ⚡`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm max-h-[70vh] overflow-y-auto flex flex-col justify-between">
      <div>
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-700 text-xs tracking-wide uppercase font-mono">
            🇨🇮 30-Day Progressive Map
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Complete days in sequence to unlock more.</p>
        </div>

        <div className="space-y-2.5 mt-4">
          {daysArray.map((day) => {
            const isCompleted = completedDays.includes(day);
            const isUnlocked = day === 1 || completedDays.includes(day - 1);
            const isCurrent = activeDay === day;
            const isEvaluationDay = day % 6 === 0;

            return (
              <button
                key={day}
                disabled={!isUnlocked}
                onClick={() => isUnlocked && onSelectDay(day)}
                className={`w-full p-3.5 rounded-xl text-left border flex items-start gap-3 transition-all duration-150 ${
                  isCurrent 
                    ? 'border-[#F77F00] bg-orange-50/40 shadow-sm ring-1 ring-[#F77F00]/30' 
                    : isUnlocked 
                    ? isEvaluationDay 
                      ? 'border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50/50 text-slate-700'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700' 
                    : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                }`}
              >
                <div className="mt-0.5 text-xs">
                  {isCompleted ? "✅" : isEvaluationDay ? "🎓" : !isUnlocked ? "🔒" : "👉"}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-mono font-bold uppercase block text-slate-400">
                    {isEvaluationDay ? 'Milestone Exam' : `Level Day ${day}`}
                  </span>
                  <h4 className="font-bold text-xs text-slate-800 truncate">{getDayTitle(day)}</h4>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Danger Zone: Fresh Reset Action */}
      <div className="pt-4 border-t border-slate-100 mt-6">
        <button
          onClick={onResetAll}
          className="w-full py-2.5 px-3 border border-red-200 hover:border-red-400 bg-red-50 hover:bg-red-100 text-[10px] font-black uppercase tracking-wider font-mono text-red-600 rounded-xl transition-all active:scale-95 text-center"
        >
          🚨 Reset and Start From Day 1
        </button>
      </div>
    </div>
  );
}