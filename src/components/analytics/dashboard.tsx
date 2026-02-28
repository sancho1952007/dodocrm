"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  AlertTriangle,
} from "lucide-react";
import { STAGE_LABELS, formatDate, cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

const STAGE_COLOR_LIST = ["#3b82f6", "#60a5fa", "#93c5fd", "#2563eb", "#1d4ed8"];

type User = { id: string; name: string; email: string; role: string };

type CalendarData = {
  month: string;
  total: number;
  firstDayOfWeek: number;
  daysInMonth: number;
  days: { day: number; count: number }[];
};

type AnalyticsData = {
  totalLeads: number;
  stageCounts: { stage: string; count: number }[];
  funnel: { stage: string; count: number }[];
  avgTimePerStage: { stage: string; avgDays: number }[];
  demosDaily: { label: string; demos: number }[];
  demosWeekly: { label: string; demos: number }[];
  demosMonthly: { label: string; demos: number }[];
  calendarData: CalendarData;
  last6Months: { label: string; demos: number }[];
  atRiskLeads: any[];
  leadsByTier: { tier: string; count: number }[];
  leadsByCategory: { category: string; count: number }[];
};

export function AnalyticsDashboard({
  data,
  users,
  filters,
}: {
  data: AnalyticsData;
  users: User[];
  filters: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState<"overview" | "funnel" | "risk">("overview");
  const [demoRange, setDemoRange] = useState<"daily" | "weekly" | "monthly">("daily");

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`/analytics?${params.toString()}`);
    },
    [router, searchParams]
  );

  const transactingCount = data.stageCounts.find((s) => s.stage === "TRANSACTING_BUSINESS")?.count || 0;
  const conversionRate = data.totalLeads > 0 ? Math.round((transactingCount / data.totalLeads) * 100) : 0;

  const funnelData = data.funnel.map((s, i) => ({
    name: STAGE_LABELS[s.stage] || s.stage,
    value: s.count,
    color: STAGE_COLOR_LIST[i],
  }));

  const avgTimeData = data.avgTimePerStage.map((s, i) => ({
    name: STAGE_LABELS[s.stage] || s.stage,
    days: s.avgDays,
    color: STAGE_COLOR_LIST[i],
  }));

  // Tier counts for display
  const tierMap: Record<string, number> = {};
  for (const t of data.leadsByTier) tierMap[t.tier] = t.count;

  return (
    <div className="p-6 space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#18181b] tracking-tight dark:text-white">Analytics</h1>
          <p className="text-[13px] text-[#a1a1aa] font-sub">Product demo pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input-field w-auto text-[13px] py-1.5"
            value={filters.ownerId || ""}
            onChange={(e) => updateFilter("ownerId", e.target.value)}
          >
            <option value="">All Owners</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <input type="date" className="input-field w-auto text-[13px] py-1.5" value={filters.dateFrom || ""} onChange={(e) => updateFilter("dateFrom", e.target.value)} />
          <input type="date" className="input-field w-auto text-[13px] py-1.5" value={filters.dateTo || ""} onChange={(e) => updateFilter("dateTo", e.target.value)} />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-[#f4f4f5] rounded-lg p-0.5 w-fit dark:bg-[#1a1a1c]">
        {(["overview", "funnel", "risk"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-1.5 rounded-md text-[13px] font-medium transition-all",
              activeTab === tab
                ? "bg-white text-[#18181b] shadow-sm dark:bg-[#27272a] dark:text-white"
                : "text-[#71717a] hover:text-[#3f3f46] dark:hover:text-[#a1a1aa]"
            )}
          >
            {tab === "overview" ? "Overview" : tab === "funnel" ? "Pipeline" : `At Risk (${data.atRiskLeads.length})`}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Big stat cards */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="Total Leads" value={data.totalLeads} />
            <StatCard label="Transacting" value={transactingCount} accent="#22c55e" />
            <StatCard label="Conversion" value={`${conversionRate}%`} />
            <StatCard label="In Pipeline" value={data.totalLeads - transactingCount} />
          </div>

          {/* Demos over time chart */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-medium text-[#3f3f46] dark:text-[#a1a1aa]">Demos over time</h3>
              <div className="flex items-center gap-1 bg-[#f4f4f5] rounded-md p-0.5 dark:bg-[#1a1a1c]">
                {(["daily", "weekly", "monthly"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDemoRange(range)}
                    className={cn(
                      "px-2.5 py-1 rounded text-[11px] font-medium transition-all",
                      demoRange === range
                        ? "bg-white text-[#18181b] shadow-sm dark:bg-[#27272a] dark:text-white"
                        : "text-[#71717a] hover:text-[#3f3f46] dark:hover:text-[#a1a1aa]"
                    )}
                  >
                    {range === "daily" ? "12 Days" : range === "weekly" ? "12 Weeks" : "12 Months"}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={demoRange === "daily" ? data.demosDaily : demoRange === "weekly" ? data.demosWeekly : data.demosMonthly}>
                  <defs>
                    <linearGradient id="colorDemos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: isDark ? "#52525b" : "#a1a1aa" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: isDark ? "#52525b" : "#a1a1aa" }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: isDark ? "1px solid #27272a" : "1px solid #e4e4e7",
                      backgroundColor: isDark ? "#18181b" : "#fff",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      color: isDark ? "#e4e4e7" : "#18181b",
                    }}
                  />
                  <Area
                    type="linear"
                    dataKey="demos"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorDemos)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: isDark ? "#18181b" : "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom row: By Stage + By Tier + By Category */}
          <div className="grid grid-cols-3 gap-3">
            {/* By Stage */}
            <div className="card p-4">
              <h3 className="text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wide mb-3">By Stage</h3>
              <div className="space-y-2.5">
                {data.stageCounts.map((s, i) => (
                  <div key={s.stage} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STAGE_COLOR_LIST[i] }} />
                      <span className="text-[12px] text-[#52525b] dark:text-[#71717a]">{STAGE_LABELS[s.stage]}</span>
                    </div>
                    <span className="text-[13px] font-semibold text-[#18181b] dark:text-white">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* By Tier */}
            <div className="card p-4">
              <h3 className="text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wide mb-3">By Tier</h3>
              <div className="space-y-2.5">
                {[
                  { tier: "HIGH", color: "#1d4ed8" },
                  { tier: "MEDIUM", color: "#3b82f6" },
                  { tier: "LOW", color: "#93c5fd" },
                ].map((item) => (
                  <div key={item.tier} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[12px] text-[#52525b] dark:text-[#71717a]">{item.tier.charAt(0) + item.tier.slice(1).toLowerCase()}</span>
                    </div>
                    <span className="text-[13px] font-semibold text-[#18181b] dark:text-white">{tierMap[item.tier] || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* By Category */}
            <div className="card p-4">
              <h3 className="text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wide mb-3">By Category</h3>
              {data.leadsByCategory.length === 0 ? (
                <p className="text-[12px] text-[#a1a1aa] py-2">No data yet</p>
              ) : (
                <div className="space-y-2.5">
                  {data.leadsByCategory.slice(0, 5).map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <span className="text-[12px] text-[#52525b] dark:text-[#71717a] truncate max-w-[140px]">{cat.category}</span>
                      <span className="text-[13px] font-semibold text-[#18181b] dark:text-white">{cat.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ PIPELINE TAB ═══ */}
      {activeTab === "funnel" && (
        <div className="space-y-4">
          {/* Demo Pipeline — Dodo Payments style bar chart */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[13px] font-medium text-[#3f3f46] dark:text-[#a1a1aa]">Demo Pipeline</h3>
            </div>
            <p className="text-3xl font-bold text-[#18181b] dark:text-white mb-0.5">{data.totalLeads}</p>
            <p className="text-[11px] text-[#a1a1aa] mb-6">Total leads in pipeline</p>
            <div className="flex items-end gap-3" style={{ height: "180px" }}>
              {funnelData.map((stage, i) => {
                const maxVal = Math.max(...funnelData.map((s) => s.value), 1);
                const heightPct = Math.max((stage.value / maxVal) * 100, 6);
                return (
                  <div key={stage.name} className="flex-1 flex flex-col items-center h-full justify-end gap-2">
                    <span className="text-[13px] font-semibold text-[#18181b] dark:text-white">{stage.value}</span>
                    <div className="w-full flex items-end flex-1">
                      <div
                        className="w-full rounded-t-md transition-all duration-500"
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: "#3b82f6",
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-center leading-tight max-w-full text-[#3b82f6]">{stage.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Avg time in stage */}
          <div className="card p-5">
            <h3 className="text-[13px] font-medium text-[#3f3f46] mb-4 dark:text-[#a1a1aa]">Average Days in Stage</h3>
            <div className="grid grid-cols-5 gap-4">
              {avgTimeData.map((stage) => (
                <div key={stage.name} className="text-center py-3">
                  <div className="text-3xl font-bold text-[#18181b] dark:text-white">{stage.days}</div>
                  <div className="text-[11px] text-[#a1a1aa] mt-0.5 mb-2">days avg</div>
                  <div className="mx-auto h-0.5 rounded-full w-8 bg-[#3b82f6] opacity-40" />
                  <div className="text-[11px] font-medium text-[#71717a] mt-2 leading-tight">{stage.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ AT RISK TAB ═══ */}
      {activeTab === "risk" && (
        <div className="space-y-4">
          <div className="card">
            <div className="px-5 py-3.5 border-b dark:border-[#1e1e1e]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <h3 className="text-[13px] font-medium text-[#3f3f46] dark:text-[#a1a1aa]">Leads Needing Attention</h3>
                <span className="text-[11px] text-[#a1a1aa]">Overdue action or inactive &gt;14 days</span>
              </div>
            </div>
            {data.atRiskLeads.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[13px] text-[#a1a1aa]">No at-risk leads. Everything is on track.</p>
              </div>
            ) : (
              <div>
                {/* Table header */}
                <div className="grid grid-cols-[1fr_120px_100px_110px_100px] gap-4 px-5 py-2 border-b text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wide dark:border-[#1e1e1e]">
                  <span>Business</span>
                  <span>Stage</span>
                  <span>Category</span>
                  <span>Action Due</span>
                  <span>Owner</span>
                </div>
                {data.atRiskLeads.map((lead: any, i: number) => (
                  <div
                    key={lead.id}
                    className={cn(
                      "grid grid-cols-[1fr_120px_100px_110px_100px] gap-4 px-5 py-3 items-center hover:bg-[#fafafa] dark:hover:bg-[#111113] transition-colors",
                      i < data.atRiskLeads.length - 1 && "border-b dark:border-[#1e1e1e]"
                    )}
                  >
                    <span className="text-[13px] font-medium text-[#18181b] dark:text-white truncate">{lead.businessName}</span>
                    <span className="text-[12px] text-[#71717a]">{STAGE_LABELS[lead.stage]}</span>
                    <span className="text-[12px] text-[#71717a] truncate">{lead.category || "—"}</span>
                    {lead.nextActionDueAt ? (
                      <span className={cn("text-[12px]", new Date(lead.nextActionDueAt) < new Date() ? "text-red-500 font-medium" : "text-[#71717a]")}>
                        {formatDate(lead.nextActionDueAt)}
                      </span>
                    ) : (
                      <span className="text-[12px] text-[#a1a1aa]">—</span>
                    )}
                    <span className="text-[12px] text-[#71717a]">{lead.owner?.name || "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="card p-4">
      <p className="text-[11px] text-[#a1a1aa] uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold dark:text-white" style={{ color: accent || undefined }}>
        <span className={accent ? "" : "text-[#18181b] dark:text-white"}>{value}</span>
      </p>
    </div>
  );
}
