"use client";

import {
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_HEADER_COLORS,
  TIER_COLORS,
  TIER_COLORS_LIGHT,
  formatDate,
  getInitials,
  getOwnerColor,
  cn,
} from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { MessageSquare, Calendar, ArrowRight } from "lucide-react";

type Lead = {
  id: string;
  businessName: string;
  email: string;
  category: string;
  tier: string;
  stage: string;
  nextAction: string | null;
  nextActionDueAt: Date | null;
  meetingScheduledAt: Date | null;
  updatedAt: Date;
  owner: { id: string; name: string } | null;
  _count: { notes: number };
};

export function GroupedView({
  grouped,
  onSelectLead,
}: {
  grouped: Record<string, Lead[]>;
  onSelectLead: (id: string) => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex gap-3 p-4 h-full overflow-x-auto">
      {STAGE_ORDER.map((stage) => {
        const leads = grouped[stage] || [];
        return (
          <div
            key={stage}
            className="flex-shrink-0 w-[280px] flex flex-col rounded-xl bg-white border overflow-hidden dark:bg-[#111113] dark:border-[#1e1e1e]"
          >
            {/* Column Header — colored top bar */}
            <div className={cn("h-0.5", STAGE_HEADER_COLORS[stage])} />
            <div className="px-3.5 py-2.5 border-b dark:border-[#1e1e1e]">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-[#3f3f46] dark:text-[#a1a1aa]">
                  {STAGE_LABELS[stage]}
                </h2>
                <span className="text-[11px] font-semibold text-[#a1a1aa] bg-[#f4f4f5] rounded-full w-5 h-5 flex items-center justify-center dark:bg-[#1e1e1e] dark:text-[#52525b]">
                  {leads.length}
                </span>
              </div>
            </div>

            {/* Cards List */}
            <div className={cn(
              "flex-1 overflow-y-auto kanban-column p-2.5 space-y-2",
              isDark ? "bg-[#09090b]" : "bg-[#fafafa]"
            )}>
              {leads.length === 0 ? (
                <div className="text-[11px] text-[#a1a1aa] text-center py-8 dark:text-[#3f3f46]">
                  No leads yet
                </div>
              ) : (
                leads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => onSelectLead(lead.id)}
                    className={cn(
                      "w-full bg-white rounded-lg border p-3 text-left hover:border-[#d4d4d8] transition-all duration-150 group cursor-pointer",
                      "dark:bg-[#111113] dark:border-[#1e1e1e] dark:hover:border-[#27272a]"
                    )}
                  >
                    {/* Top: Name + Tier */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-medium text-[13px] text-[#18181b] group-hover:text-blue-600 leading-tight line-clamp-2 dark:text-[#e4e4e7] dark:group-hover:text-blue-400">
                        {lead.businessName}
                      </h3>
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 uppercase tracking-wide",
                          isDark ? TIER_COLORS[lead.tier] : TIER_COLORS_LIGHT[lead.tier]
                        )}
                      >
                        {lead.tier}
                      </span>
                    </div>

                    {/* Category tag */}
                    {lead.category && (
                      <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-[#f4f4f5] text-[#52525b] font-medium mb-1.5 dark:bg-[#1e1e1e] dark:text-[#71717a]">
                        {lead.category}
                      </span>
                    )}

                    {/* Next Action */}
                    {lead.nextAction && (
                      <div className="flex items-start gap-1.5 mb-2.5 bg-blue-50/60 rounded-md px-2 py-1.5 dark:bg-blue-950/15">
                        <ArrowRight className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0 dark:text-blue-400" />
                        <p className="text-[11px] text-blue-600 line-clamp-2 dark:text-blue-400">
                          {lead.nextAction}
                        </p>
                      </div>
                    )}

                    {/* Footer: Owner + Notes + Date */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[#f4f4f5] dark:border-[#1e1e1e]">
                      {lead.owner ? (
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-4.5 h-4.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                            style={{ backgroundColor: getOwnerColor(lead.owner.name), width: 18, height: 18 }}
                          >
                            {getInitials(lead.owner.name)}
                          </div>
                          <span className="text-[11px] font-medium text-[#52525b] dark:text-[#71717a]">
                            {lead.owner.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#a1a1aa] italic dark:text-[#3f3f46]">Unassigned</span>
                      )}

                      <div className="flex items-center gap-2 ml-auto text-[#a1a1aa] dark:text-[#3f3f46] font-sub">
                        {lead._count.notes > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px]">
                            <MessageSquare className="w-3 h-3" />
                            {lead._count.notes}
                          </span>
                        )}
                        <span className="flex items-center gap-0.5 text-[10px]">
                          <Calendar className="w-3 h-3" />
                          {formatDate(lead.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
