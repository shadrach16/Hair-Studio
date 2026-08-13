// A4: Quality & Cost Analytics Dashboard — Mobile-first Capacitor surface
// Shows generation quality metrics, mode distribution, defects, and cost analytics.

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Diamond, Zap, ImageOff, TrendingUp, AlertTriangle, ShieldCheck, Coins, RefreshCw, BarChart3 } from 'lucide-react';
import { apiService, type QualityAnalyticsData, type QualityModeStats } from '@/lib/api';
import { tierMeta } from '@/lib/generationTiers';

interface QualityDashboardProps {
  onBack: () => void;
}

const MODE_META: Record<string, { icon: typeof Diamond; color: string; bg: string; label: string }> = {
  // Labels come from lib/generationTiers so this dashboard can't drift from the
  // names the user saw when they picked the tier.
  standard: { icon: ImageOff, color: 'text-gray-600', bg: 'bg-gray-50', label: tierMeta('standard').label },
  hd:       { icon: Diamond, color: 'text-blue-600', bg: 'bg-blue-50', label: tierMeta('hd').label },
  pro:      { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', label: tierMeta('pro').label },
};

function StatCard({ label, value, sub, icon: Icon, color = 'text-gray-600', bg = 'bg-gray-50' }: {
  label: string; value: string | number; sub?: string; icon: typeof TrendingUp; color?: string; bg?: string;
}) {
  return (
    <div className={`${bg} rounded-2xl p-3.5 border border-gray-100`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-[11px] text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ModeCard({ mode, data }: { mode: string; data: QualityAnalyticsData['modes'][0] }) {
  const meta = MODE_META[mode] || MODE_META.standard;
  const Icon = meta.icon;
  return (
    <div className={`${meta.bg} rounded-2xl p-3.5 border border-gray-100`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-4 h-4 ${meta.color}`} />
          <span className="text-sm font-semibold text-gray-900">{meta.label}</span>
        </div>
        <span className="text-xs text-gray-500">{data.completed + data.failed} gens</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-base font-bold text-gray-900">{data.successRate}%</p>
          <p className="text-[10px] text-gray-500">Success</p>
        </div>
        <div>
          <p className="text-base font-bold text-gray-900">{data.avgQuality}</p>
          <p className="text-[10px] text-gray-500">Avg Score</p>
        </div>
        <div>
          <p className="text-base font-bold text-gray-900">{data.qualityPassRate}%</p>
          <p className="text-[10px] text-gray-500">Q Pass</p>
        </div>
      </div>
      {data.avgRetries > 0 && (
        <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> {data.avgRetries} avg retries
        </p>
      )}
    </div>
  );
}

function DefectRow({ defect, severity, count, avgScore }: {
  defect: string; severity: string; count: number; avgScore: number;
}) {
  const sevColor = severity === 'severe' ? 'text-red-600 bg-red-50' : severity === 'moderate' ? 'text-amber-600 bg-amber-50' : 'text-gray-600 bg-gray-50';
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <AlertTriangle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-sm text-gray-700 truncate">{defect}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${sevColor}`}>{severity}</span>
        <span className="text-xs text-gray-500 w-8 text-right">{count}×</span>
      </div>
    </div>
  );
}

export default function QualityDashboard({ onBack }: QualityDashboardProps) {
  const [data, setData] = useState<QualityAnalyticsData | null>(null);
  const [personalModes, setPersonalModes] = useState<QualityModeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadData();
  }, [days]);

  async function loadData() {
    setLoading(true);
    const [qualRes, modeRes] = await Promise.all([
      apiService.getQualityAnalytics(days),
      apiService.getQualityModeStats(days),
    ]);
    if (qualRes.success && qualRes.data) setData(qualRes.data);
    if (modeRes.success && modeRes.data) setPersonalModes(modeRes.data.modes);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 safe-area-top">
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold">Quality Dashboard</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-gray-400">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 safe-area-top">
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold">Quality Dashboard</h1>
        </div>
        <div className="flex flex-col items-center justify-center h-64 gap-2 text-gray-400">
          <BarChart3 className="w-8 h-8" />
          <p className="text-sm">No quality data available yet</p>
        </div>
      </div>
    );
  }

  const { overall, modes, costByMode, topDefects, dailyQuality } = data;

  return (
    <div className="min-h-screen bg-gray-50 safe-area-top">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100" aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Quality & Cost</h1>
        </div>
        {/* Period selector */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${days === d ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-5 pb-24">
        {/* Overview cards */}
        <section>
          <p className="text-xs text-gray-500 font-medium mb-2">Overview</p>
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Success Rate" value={`${overall.successRate}%`} sub={`${overall.completed}/${overall.total} gens`} icon={ShieldCheck} color="text-emerald-600" bg="bg-emerald-50" />
            <StatCard label="Credits Spent" value={overall.totalCreditsSpent} sub={`${overall.total} generations`} icon={Coins} color="text-amber-600" bg="bg-amber-50" />
            <StatCard label="Total Retries" value={overall.totalRetries} sub={`across all modes`} icon={RefreshCw} color="text-blue-600" bg="bg-blue-50" />
            <StatCard label="Failed" value={overall.failed} sub={`${overall.total > 0 ? Math.round((overall.failed / overall.total) * 100) : 0}% failure rate`} icon={AlertTriangle} color="text-red-600" bg="bg-red-50" />
          </div>
        </section>

        {/* Mode breakdown */}
        {modes.length > 0 && (
          <section>
            <p className="text-xs text-gray-500 font-medium mb-2">Quality by Mode</p>
            <div className="space-y-2">
              {modes.map(m => <ModeCard key={m.mode} mode={m.mode} data={m} />)}
            </div>
          </section>
        )}

        {/* Cost per mode */}
        {costByMode.length > 0 && (
          <section>
            <p className="text-xs text-gray-500 font-medium mb-2">Cost by Mode</p>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {costByMode.map(c => {
                const meta = MODE_META[c.mode] || MODE_META.standard;
                const Icon = meta.icon;
                return (
                  <div key={c.mode} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                      <span className="text-sm font-medium text-gray-900">{meta.label}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{c.totalCredits} cr</p>
                      <p className="text-[10px] text-gray-400">{c.count} gens · {c.avgCreditsPerGen} avg</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Your mode stats */}
        {personalModes.length > 0 && (
          <section>
            <p className="text-xs text-gray-500 font-medium mb-2">Your Mode Usage</p>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {personalModes.map(m => {
                const meta = MODE_META[m.mode] || MODE_META.standard;
                const Icon = meta.icon;
                return (
                  <div key={m.mode} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                      <span className="text-sm font-medium text-gray-900">{meta.label}</span>
                      <span className="text-[10px] text-gray-400">{m.count}×</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">Score: {m.avgScore}</span>
                      <span className="text-xs font-medium text-emerald-600">{m.passRate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Top defects */}
        {topDefects.length > 0 && (
          <section>
            <p className="text-xs text-gray-500 font-medium mb-2">Top Quality Defects</p>
            <div className="bg-white rounded-2xl border border-gray-100 px-4 py-2">
              {topDefects.slice(0, 5).map((d, i) => (
                <DefectRow key={i} defect={d.defect} severity={d.severity} count={d.count} avgScore={d.avgScore} />
              ))}
            </div>
          </section>
        )}

        {/* Daily quality trend (simple bar representation) */}
        {dailyQuality.length > 0 && (
          <section>
            <p className="text-xs text-gray-500 font-medium mb-2">Daily Quality Trend</p>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-end gap-1 h-24">
                {dailyQuality.slice(-14).map((d, i) => {
                  const maxScore = 100;
                  const h = Math.max(4, (d.avgScore / maxScore) * 100);
                  const isGood = d.passRate >= 70;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div
                        className={`w-full rounded-t-sm ${isGood ? 'bg-emerald-400' : 'bg-amber-400'}`}
                        style={{ height: `${h}%` }}
                        title={`${d.date}: ${d.avgScore} avg, ${d.passRate}% pass`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-400">{dailyQuality[Math.max(0, dailyQuality.length - 14)]?.date?.slice(5)}</span>
                <span className="text-[10px] text-gray-400">{dailyQuality[dailyQuality.length - 1]?.date?.slice(5)}</span>
              </div>
            </div>
          </section>
        )}
      </div>

      <style>{`
        .safe-area-top { padding-top: env(safe-area-inset-top); }
      `}</style>
    </div>
  );
}
