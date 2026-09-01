import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  Copy,
  Check,
  TrendingUp,
  ShieldCheck,
  Zap,
  Target,
  Award,
  ChevronRight,
  Flame
} from 'lucide-react';

export interface InterviewTip {
  id: string;
  category: string;
  title: string;
  snippet: string;
  actionTakeaway: string;
  impactScore: number;
  tags: string[];
}

interface QuickInterviewTipsProps {
  targetCareer?: string;
  token?: string | null;
}

export const QuickInterviewTips: React.FC<QuickInterviewTipsProps> = ({
  targetCareer = 'Software Engineer',
  token
}) => {
  const [tips, setTips] = useState<InterviewTip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTipIndex, setActiveTipIndex] = useState<number>(0);

  const fetchTips = async (isManualRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/interview/tips', {
        method: 'POST',
        headers,
        body: JSON.stringify({ careerType: targetCareer })
      });

      if (!res.ok) {
        throw new Error('Failed to fetch interview advice tips');
      }

      const data = await res.json();
      if (data.tips && Array.isArray(data.tips)) {
        setTips(data.tips);
        setActiveTipIndex(0);
      }
    } catch (err: any) {
      console.error('Error loading interview tips:', err);
      setError(err.message || 'Could not load tips');
      // Fallback tips in case of network issue
      setTips([
        {
          id: 'tip_fallback_1',
          category: 'STAR Framework',
          title: 'Quantify Every Impact Metric',
          snippet: 'Anchor every story with a concrete metric: "Reduced latency by 35%" resonates 10x deeper than "made system faster".',
          actionTakeaway: 'Structure: Situation (15s) -> Task (15s) -> Action (45s) -> Result with % or $ metrics (30s).',
          impactScore: 98,
          tags: ['STAR', 'Storytelling', 'Metrics']
        },
        {
          id: 'tip_fallback_2',
          category: 'Confidence & Mindset',
          title: 'Embrace the Strategic 5-Second Pause',
          snippet: 'Top candidates do not rush. Taking 4-5 seconds to organize your thoughts conveys poise and senior architectural thinking.',
          actionTakeaway: 'Say: "That\'s a great design trade-off question. Let me take 5 seconds to map out the failure modes."',
          impactScore: 95,
          tags: ['Poise', 'Executive Presence', 'Pacing']
        },
        {
          id: 'tip_fallback_3',
          category: 'System Thinking',
          title: 'Clarify Constraints Before Answering',
          snippet: 'Interviewers intentionally give vague requirements to see if you ask clarifying questions before jumping into code.',
          actionTakeaway: 'Always ask: scale, throughput, latency targets, and edge cases before writing or diagramming.',
          impactScore: 96,
          tags: ['Architecture', 'Communication', 'Seniority']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTips();
  }, [targetCareer, token]);

  const handleCopy = (tip: InterviewTip) => {
    const textToCopy = `💡 ${tip.title}\n${tip.snippet}\n\n🎯 Actionable Takeaway:\n${tip.actionTakeaway}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(tip.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryBadgeColor = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('star') || lower.includes('story')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (lower.includes('confidence') || lower.includes('mindset') || lower.includes('presence')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (lower.includes('system') || lower.includes('tech') || lower.includes('architect')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (lower.includes('negotiat') || lower.includes('salary')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 border border-indigo-100/80 rounded-2xl p-6 shadow-sm relative overflow-hidden transition-all duration-300">
      {/* Subtle background glow */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-100/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-base">Quick Interview Tips</h3>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 rounded-md tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-600" />
                AI Confidence Boost
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              3 randomized high-impact career advice snippets tailored for <span className="font-semibold text-slate-700">{targetCareer}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchTips(true)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition-all disabled:opacity-60 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Generating...' : 'Refresh AI Tips'}</span>
        </button>
      </div>

      {/* Content Section */}
      {loading && tips.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-500">Gemini AI synthesizing high-impact interview tips...</p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {/* Grid of 3 AI Tips */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tips.map((tip, idx) => {
              const isSelected = activeTipIndex === idx;
              const isCopied = copiedId === tip.id;

              return (
                <div
                  key={tip.id || idx}
                  onClick={() => setActiveTipIndex(idx)}
                  className={`bg-white rounded-xl p-5 border transition-all duration-200 flex flex-col justify-between cursor-pointer relative group ${
                    isSelected
                      ? 'border-indigo-400 ring-2 ring-indigo-500/10 shadow-md scale-[1.01]'
                      : 'border-slate-200 hover:border-indigo-200 hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Category + Impact */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getCategoryBadgeColor(
                          tip.category
                        )}`}
                      >
                        {tip.category}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{tip.impactScore || 95}% Impact</span>
                      </div>
                    </div>

                    {/* Tip Title */}
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug">
                      {tip.title}
                    </h4>

                    {/* Snippet / Core Insight */}
                    <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                      "{tip.snippet}"
                    </p>

                    {/* Action Takeaway */}
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-2.5 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 uppercase tracking-wide">
                        <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                        <span>Takeaway Action</span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                        {tip.actionTakeaway}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Footer: Tags & Copy Action */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {tip.tags?.slice(0, 2).map((tag, tIdx) => (
                        <span
                          key={`tip-tag-${tip.id || idx}-${tag}-${tIdx}`}
                          className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(tip);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all text-[11px] flex items-center gap-1"
                      title="Copy advice to clipboard"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[10px] font-bold text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-medium">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom confidence reminder bar */}
          <div className="bg-white/80 border border-indigo-100 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-slate-600">
                <strong className="text-slate-800">Confidence Rule of Thumb:</strong> Interviewers want you to succeed. Frame your experiences as collaborative problem-solving rather than solo bragging.
              </span>
            </div>
            <span className="text-[11px] font-bold text-indigo-600 shrink-0 flex items-center gap-1">
              Apply in mock loop below <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
