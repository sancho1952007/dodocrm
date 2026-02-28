"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { STAGE_ORDER } from "@/lib/utils";

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function getAnalytics(filters?: {
  dateFrom?: string;
  dateTo?: string;
  ownerId?: string;
}) {
  await getSessionUser();

  const leadWhere: any = {};
  const historyWhere: any = {};

  if (filters?.ownerId) {
    leadWhere.ownerId = filters.ownerId;
  }
  if (filters?.dateFrom) {
    leadWhere.createdAt = { ...(leadWhere.createdAt || {}), gte: new Date(filters.dateFrom) };
    historyWhere.changedAt = { ...(historyWhere.changedAt || {}), gte: new Date(filters.dateFrom) };
  }
  if (filters?.dateTo) {
    leadWhere.createdAt = { ...(leadWhere.createdAt || {}), lte: new Date(filters.dateTo) };
    historyWhere.changedAt = { ...(historyWhere.changedAt || {}), lte: new Date(filters.dateTo) };
  }

  // Total leads
  const totalLeads = await prisma.lead.count({ where: leadWhere });

  // Leads by stage
  const leadsByStage = await prisma.lead.groupBy({
    by: ["stage"],
    _count: { id: true },
    where: leadWhere,
  });

  const stageCountsMap: Record<string, number> = {};
  for (const s of STAGE_ORDER) stageCountsMap[s] = 0;
  for (const row of leadsByStage) stageCountsMap[row.stage] = row._count.id;

  // Conversion funnel
  const funnel = STAGE_ORDER.map((stage) => ({
    stage,
    count: stageCountsMap[stage] || 0,
  }));

  // Average time in stage (from stage history)
  const stageHistories = await prisma.leadStageHistory.findMany({
    where: historyWhere,
    orderBy: { changedAt: "asc" },
    select: {
      leadId: true,
      fromStage: true,
      toStage: true,
      changedAt: true,
    },
  });

  // Group histories by lead
  const historyByLead: Record<string, typeof stageHistories> = {};
  for (const h of stageHistories) {
    if (!historyByLead[h.leadId]) historyByLead[h.leadId] = [];
    historyByLead[h.leadId].push(h);
  }

  // Calculate time spent in each stage
  const stageTimeMs: Record<string, number[]> = {};
  for (const s of STAGE_ORDER) stageTimeMs[s] = [];

  for (const leadId in historyByLead) {
    const records = historyByLead[leadId];
    for (let i = 0; i < records.length; i++) {
      const current = records[i];
      const next = records[i + 1];
      if (next) {
        const duration = new Date(next.changedAt).getTime() - new Date(current.changedAt).getTime();
        stageTimeMs[current.toStage]?.push(duration);
      } else {
        // Still in this stage: measure from changedAt to now
        const duration = Date.now() - new Date(current.changedAt).getTime();
        stageTimeMs[current.toStage]?.push(duration);
      }
    }
  }

  const avgTimePerStage = STAGE_ORDER.map((stage) => {
    const times = stageTimeMs[stage] || [];
    const avg = times.length > 0
      ? times.reduce((a, b) => a + b, 0) / times.length
      : 0;
    return {
      stage,
      avgDays: Math.round((avg / (1000 * 60 * 60 * 24)) * 10) / 10,
    };
  });

  // Demos scheduled — daily (last 12 days), weekly (last 12 weeks), monthly (last 12 months)
  function getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // Fetch all demos from last 12 months (covers all 3 ranges)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const allDemos = await prisma.lead.findMany({
    where: {
      ...leadWhere,
      meetingScheduledAt: { gte: twelveMonthsAgo },
    },
    select: { meetingScheduledAt: true },
  });

  // --- Daily: last 12 days ---
  const dayBuckets: Record<string, number> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (11 - i));
    dayBuckets[d.toISOString().slice(0, 10)] = 0;
  }
  for (const lead of allDemos) {
    if (lead.meetingScheduledAt) {
      const key = new Date(lead.meetingScheduledAt).toISOString().slice(0, 10);
      if (dayBuckets[key] !== undefined) dayBuckets[key]++;
    }
  }
  const demosDaily = Object.entries(dayBuckets).map(([key, demos]) => ({
    label: new Date(key).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    demos,
  }));

  // --- Weekly: last 12 weeks (Monday-aligned) ---
  const currentMonday = getMonday(new Date());
  const twelveWeeksAgo = new Date(currentMonday);
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 11 * 7);

  const weekBuckets: Record<string, number> = {};
  const weekLabels: Record<string, string> = {};
  for (let i = 0; i < 12; i++) {
    const monday = new Date(twelveWeeksAgo);
    monday.setDate(monday.getDate() + i * 7);
    const key = monday.toISOString().slice(0, 10);
    weekBuckets[key] = 0;
    weekLabels[key] = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  for (const lead of allDemos) {
    if (lead.meetingScheduledAt) {
      const monday = getMonday(new Date(lead.meetingScheduledAt));
      const key = monday.toISOString().slice(0, 10);
      if (weekBuckets[key] !== undefined) weekBuckets[key]++;
    }
  }
  const demosWeekly = Object.entries(weekBuckets).map(([key, demos]) => ({
    label: weekLabels[key],
    demos,
  }));

  // --- Monthly: last 12 months ---
  const monthBuckets: Record<string, number> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthBuckets[key] = 0;
  }
  for (const lead of allDemos) {
    if (lead.meetingScheduledAt) {
      const d = new Date(lead.meetingScheduledAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthBuckets[key] !== undefined) monthBuckets[key]++;
    }
  }
  const demosMonthly = Object.entries(monthBuckets).map(([key, demos]) => ({
    label: new Date(key + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    demos,
  }));

  // --- Calendar: current month day-by-day ---
  const now = new Date();
  const calendarMonth = now.getMonth();
  const calendarYear = now.getFullYear();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarDemos: Record<number, number> = {};
  for (let d = 1; d <= daysInMonth; d++) calendarDemos[d] = 0;
  let calendarTotal = 0;
  for (const lead of allDemos) {
    if (lead.meetingScheduledAt) {
      const dt = new Date(lead.meetingScheduledAt);
      if (dt.getMonth() === calendarMonth && dt.getFullYear() === calendarYear) {
        calendarDemos[dt.getDate()]++;
        calendarTotal++;
      }
    }
  }
  const calendarData = {
    month: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    total: calendarTotal,
    firstDayOfWeek: new Date(calendarYear, calendarMonth, 1).getDay(), // 0=Sun
    daysInMonth,
    days: Object.entries(calendarDemos).map(([day, count]) => ({ day: Number(day), count })),
  };

  // --- Last 6 months bar chart ---
  const last6Months = demosMonthly.slice(-6);

  // At-risk leads: overdue next action OR stuck in stage > 14 days
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const atRiskLeads = await prisma.lead.findMany({
    where: {
      ...leadWhere,
      OR: [
        { nextActionDueAt: { lt: new Date() } },
        { updatedAt: { lt: fourteenDaysAgo } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "asc" },
    take: 20,
  });

  // Leads by tier
  const leadsByTier = await prisma.lead.groupBy({
    by: ["tier"],
    _count: { id: true },
    where: leadWhere,
  });

  // Leads by category
  const leadsByCategory = await prisma.lead.groupBy({
    by: ["category"],
    _count: { id: true },
    where: leadWhere,
  });

  return {
    totalLeads,
    stageCounts: STAGE_ORDER.map((s) => ({ stage: s, count: stageCountsMap[s] || 0 })),
    funnel,
    avgTimePerStage,
    demosDaily,
    demosWeekly,
    demosMonthly,
    calendarData,
    last6Months,
    atRiskLeads,
    leadsByTier: leadsByTier.map((r) => ({ tier: r.tier, count: r._count.id })),
    leadsByCategory: leadsByCategory
      .filter((r) => r.category && r.category.trim() !== "")
      .map((r) => ({ category: r.category, count: r._count.id }))
      .sort((a, b) => b.count - a.count),
  };
}
