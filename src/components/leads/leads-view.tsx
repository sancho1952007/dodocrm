"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Columns3,
  Table2,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { STAGE_ORDER, STAGE_LABELS, cn } from "@/lib/utils";
import { GroupedView } from "./grouped-view";
import { TableView } from "./table-view";
import { LeadDrawer } from "./lead-drawer";
import { CreateLeadModal } from "./create-lead-modal";

type LeadWithOwner = {
  id: string;
  businessId: string | null;
  businessName: string;
  email: string;
  category: string;
  meetingScheduledAt: Date | null;
  painPoints: string | null;
  questionsAsked: string | null;
  tier: string;
  stage: string;
  nextAction: string | null;
  nextActionDueAt: Date | null;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  owner: { id: string; name: string; email: string } | null;
  _count: { notes: number };
};

type User = { id: string; name: string; email: string; role: string };

export function LeadsView({
  leads,
  users,
  filters,
  currentUserRole,
}: {
  leads: LeadWithOwner[];
  users: User[];
  filters: Record<string, string | undefined>;
  currentUserRole?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"grouped" | "table">("grouped");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/leads?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = useCallback(() => {
    updateFilter("search", searchInput);
  }, [searchInput, updateFilter]);

  const clearFilters = () => {
    router.push("/leads");
    setSearchInput("");
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const grouped: Record<string, LeadWithOwner[]> = {};
  for (const s of STAGE_ORDER) grouped[s] = [];
  for (const lead of leads) {
    if (grouped[lead.stage]) grouped[lead.stage].push(lead);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b dark:bg-[#111113] dark:border-[#1e1e1e]">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-semibold text-[#18181b] tracking-tight dark:text-white">
                Product Demo Leads
              </h1>
              <p className="text-[13px] text-[#71717a] mt-0.5 font-sub">
                {leads.length} lead{leads.length !== 1 ? "s" : ""} across {STAGE_ORDER.length} stages
              </p>
            </div>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus className="w-4 h-4 mr-1.5" />
              New Lead
            </button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a1a1aa]" />
              <input
                type="text"
                className="input-field pl-9 py-1.5 text-[13px]"
                placeholder="Search leads..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-[#f4f4f5] rounded-lg p-0.5 dark:bg-[#1a1a1c]">
              <button
                onClick={() => setView("grouped")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all",
                  view === "grouped"
                    ? "bg-white text-[#18181b] shadow-sm dark:bg-[#27272a] dark:text-white"
                    : "text-[#71717a] hover:text-[#3f3f46] dark:hover:text-[#a1a1aa]"
                )}
              >
                <Columns3 className="w-3.5 h-3.5" />
                Board
              </button>
              <button
                onClick={() => setView("table")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all",
                  view === "table"
                    ? "bg-white text-[#18181b] shadow-sm dark:bg-[#27272a] dark:text-white"
                    : "text-[#71717a] hover:text-[#3f3f46] dark:hover:text-[#a1a1aa]"
                )}
              >
                <Table2 className="w-3.5 h-3.5" />
                Table
              </button>
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "btn-secondary py-1.5 text-[13px]",
                hasActiveFilters && "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400"
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1.5 bg-blue-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {Object.values(filters).filter(Boolean).length}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="p-1.5 text-[#a1a1aa] hover:text-[#52525b] hover:bg-[#f4f4f5] rounded-lg transition-colors dark:hover:bg-[#1a1a1c] dark:hover:text-[#71717a]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t dark:border-[#1e1e1e]">
              <select
                className="input-field w-auto text-[13px] py-1.5"
                value={filters.stage || ""}
                onChange={(e) => updateFilter("stage", e.target.value)}
              >
                <option value="">All Stages</option>
                {STAGE_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </option>
                ))}
              </select>

              <select
                className="input-field w-auto text-[13px] py-1.5"
                value={filters.tier || ""}
                onChange={(e) => updateFilter("tier", e.target.value)}
              >
                <option value="">All Tiers</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <select
                className="input-field w-auto text-[13px] py-1.5"
                value={filters.ownerId || ""}
                onChange={(e) => updateFilter("ownerId", e.target.value)}
              >
                <option value="">All Owners</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  className="input-field w-auto text-[13px] py-1.5"
                  value={filters.dateFrom || ""}
                  onChange={(e) => updateFilter("dateFrom", e.target.value)}
                />
                <span className="text-[#a1a1aa] text-xs">to</span>
                <input
                  type="date"
                  className="input-field w-auto text-[13px] py-1.5"
                  value={filters.dateTo || ""}
                  onChange={(e) => updateFilter("dateTo", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === "grouped" ? (
          <GroupedView grouped={grouped} onSelectLead={setSelectedLeadId} />
        ) : (
          <div className="h-full overflow-auto">
            <TableView leads={leads} onSelectLead={setSelectedLeadId} />
          </div>
        )}
      </div>

      {/* Lead Drawer */}
      {selectedLeadId && (
        <LeadDrawer
          leadId={selectedLeadId}
          users={users}
          onClose={() => setSelectedLeadId(null)}
          isAdmin={currentUserRole === "ADMIN"}
        />
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateLeadModal users={users} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}
