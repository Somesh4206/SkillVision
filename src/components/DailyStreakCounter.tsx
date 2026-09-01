import React, { useState } from 'react';
import {
  Flame,
  Zap,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  Sparkles,
  Info,
  ChevronRight,
  BookOpen,
  HelpCircle,
  Activity
} from 'lucide-react';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  activityDates: string[];
  todayActive: boolean;
  recentActivities?: Array<{
    type: 'task' | 'quiz' | 'interview' | 'resume';
    title: string;
    timestamp: string;
  }>;
}

interface DailyStreakCounterProps {
  streak?: StreakData;
  onNavigateToRoadmap?: () => void;
  onNavigateToAssessment?: () => void;
  onNavigateToInterview?: () => void;
}

export const DailyStreakCounter: React.FC<DailyStreakCounterProps> = ({
  streak,
  onNavigateToRoadmap,
  onNavigateToAssessment,
  onNavigateToInterview
}) => {
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  const currentStreak = streak?.currentStreak || 0;
  const longestStreak = streak?.longestStreak || currentStreak;
  const todayActive = streak?.todayActive || false;
  const activityDates = streak?.activityDates || [];
  const recentActivities = streak?.recentActivities || [];

  // Generate the last 7 days for the streak week visualizer
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = d.getDate();
    const isToday = i === 6;
    const hasActivity = activityDates.includes(dateStr);

    return {
      dateStr,
      dayName,
      dayNumber,
      isToday,
      hasActivity
    };
  });

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-indigo-500/10 border border-amber-200/80 rounded-2xl p-5 shadow-sm relative overflow-hidden transition-all duration-300">
      {/* Background soft glow decoration */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
        
        {/* Left: Streak Icon + Counter + Status */}
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md relative transition-transform duration-300 shrink-0 ${
              todayActive
                ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 shadow-orange-500/20 scale-105'
                : 'bg-gradient-to-tr from-slate-400 to-amber-600'
            }`}
          >
            <Flame
              className={`w-8 h-8 ${
                todayActive ? 'fill-amber-100 text-amber-100 animate-bounce' : 'text-white'
              }`}
            />
            {todayActive && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full ring-2 ring-emerald-400/40"></span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                <span>{currentStreak} Day{currentStreak === 1 ? '' : 's'}</span>
                <span className="text-amber-500 font-extrabold">Streak</span>
              </h3>
              
              {todayActive ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold uppercase rounded-full tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                  Active Today
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-extrabold uppercase rounded-full tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  Pending Today
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
              <span>
                Personal Best:{' '}
                <strong className="text-slate-700 font-bold">{longestStreak} days</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span>
                {todayActive
                  ? 'Great job! You logged progress today.'
                  : 'Complete a task or quiz today to keep your streak!'}
              </span>
            </p>
          </div>
        </div>

        {/* Middle / Right: 7-Day Visual Activity Dots */}
        <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
          <div className="bg-white/80 backdrop-blur-sm border border-amber-200/60 rounded-xl p-2.5 shadow-sm flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-1 hidden sm:inline">
              Past 7 Days:
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {last7Days.map((day, idx) => (
                <div
                  key={`day-dot-${day.dateStr}-${idx}`}
                  className="flex flex-col items-center gap-1 group relative cursor-pointer"
                  title={`${day.dayName}, ${day.dateStr}: ${day.hasActivity ? 'Activity completed' : 'No activity'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${
                      day.hasActivity
                        ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-sm ring-2 ring-amber-400/30'
                        : day.isToday
                        ? 'bg-amber-100/70 border border-dashed border-amber-400 text-amber-800'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {day.hasActivity ? (
                      <Flame className="w-3.5 h-3.5 fill-white text-white" />
                    ) : day.isToday ? (
                      '?'
                    ) : (
                      day.dayNumber
                    )}
                  </div>
                  <span
                    className={`text-[9px] font-semibold ${
                      day.isToday ? 'text-amber-700 font-extrabold' : 'text-slate-400'
                    }`}
                  >
                    {day.dayName}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Info Modal Trigger */}
          <button
            onClick={() => setShowInfoModal(!showInfoModal)}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-amber-600 transition-colors shadow-sm shrink-0"
            title="How streak works"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info / Recent Activities Drawer (Expandable) */}
      {showInfoModal && (
        <div className="mt-4 pt-4 border-t border-amber-200/60 bg-white/90 backdrop-blur rounded-xl p-4 space-y-3 animate-fade-in text-xs">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              How Daily Streaks Work
            </h4>
            <button
              onClick={() => setShowInfoModal(false)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          </div>

          <p className="text-slate-600 leading-relaxed">
            Streaks measure your daily consistency in advancing your career preparation. Any of the following actions automatically record activity and maintain your streak:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <div
              onClick={onNavigateToRoadmap}
              className="bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-1.5 font-bold text-indigo-700 text-xs">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Roadmap Task</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Check off learning tasks or target goals.</p>
            </div>

            <div
              onClick={onNavigateToAssessment}
              className="bg-purple-50/60 hover:bg-purple-50 border border-purple-100 rounded-lg p-2.5 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-1.5 font-bold text-purple-700 text-xs">
                <Activity className="w-3.5 h-3.5" />
                <span>Skill Assessment Quiz</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Complete a 5-question AI skill quiz.</p>
            </div>

            <div
              onClick={onNavigateToInterview}
              className="bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-1.5 font-bold text-emerald-700 text-xs">
                <Zap className="w-3.5 h-3.5" />
                <span>Mock / Tech Interview</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Answer interview questions with STAR feedback.</p>
            </div>
          </div>

          {recentActivities.length > 0 && (
            <div className="pt-2">
              <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">
                Recent Streak Activities
              </p>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {recentActivities.slice(0, 3).map((act, i) => (
                  <div
                    key={`act-${act.timestamp || i}-${i}`}
                    className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-100"
                  >
                    <span className="font-medium truncate max-w-[240px]">
                      {act.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
