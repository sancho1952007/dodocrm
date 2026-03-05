"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  STAGE_LABELS,
  STAGE_COLORS,
  STAGE_COLORS_DARK,
  STAGE_DOT_COLORS,
  TIER_COLORS,
  TIER_COLORS_LIGHT,
  formatDate,
  getInitials,
  getOwnerColor,
  cn,
} from "@/lib/utils";
import { useTheme } from "@/lib/theme";

type Lead = {
  id: string;
  businessId: string | null;
  businessName: string;
  email: string;
  category: string;
  meetingScheduledAt: Date | null;
  tier: string;
  stage: string;
  updatedAt: Date;
  owner: { id: string; name: string } | null;
  _count: { notes: number };
};

export function TableView({
  leads,
  onSelectLead,
}: {
  leads: Lead[];
  onSelectLead: (id: string) => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyBusinessId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="overflow-x-auto bg-white dark:bg-[#09090b]">
      <table className="w-full text-[13px] table-fixed">
        <thead>
          <tr className="bg-[#fafafa] border-b dark:bg-[#0f0f11] dark:border-[#1e1e1e]">
            <th className="text-left px-4 py-2.5 font-medium text-[#71717a] text-[11px] uppercase tracking-wider w-[170px]">Stage</th>
            <th className="text-left px-4 py-2.5 font-medium text-[#71717a] text-[11px] uppercase tracking-wider">Business</th>
            <th className="text-left px-4 py-2.5 font-medium text-[#71717a] text-[11px] uppercase tracking-wider w-[160px]">ID</th>
            <th className="text-left px-4 py-2.5 font-medium text-[#71717a] text-[11px] uppercase tracking-wider w-[120px]">Meeting Date</th>
            <th className="text-left px-4 py-2.5 font-medium text-[#71717a] text-[11px] uppercase tracking-wider w-[110px]">Category</th>
            <th className="text-left px-4 py-2.5 font-medium text-[#71717a] text-[11px] uppercase tracking-wider w-[170px]">Email</th>
            <th className="text-left px-4 py-2.5 font-medium text-[#71717a] text-[11px] uppercase tracking-wider w-[75px]">Tier</th>
            <th className="text-left px-4 py-2.5 font-medium text-[#71717a] text-[11px] uppercase tracking-wider w-[110px]">Owner</th>
            <th className="text-left px-4 py-2.5 font-medium text-[#71717a] text-[11px] uppercase tracking-wider w-[100px]">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f4f4f5] dark:divide-[#1e1e1e]">
          {leads.map((lead) => (
            <tr
              key={lead.id}
              onClick={() => onSelectLead(lead.id)}
              className="cursor-pointer hover:bg-[#fafafa] transition-colors group dark:hover:bg-[#111113]"
            >
              {/* Stage */}
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", STAGE_DOT_COLORS[lead.stage])} />
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap", isDark ? STAGE_COLORS_DARK[lead.stage] : STAGE_COLORS[lead.stage])}>
                    {STAGE_LABELS[lead.stage]}
                  </span>
                </div>
              </td>

              {/* Business Name */}
              <td className="px-4 py-2.5">
                <span className="font-medium text-[#18181b] group-hover:text-blue-600 transition-colors dark:text-[#e4e4e7] dark:group-hover:text-blue-400 truncate block">
                  {lead.businessName}
                </span>
              </td>

              {/* ID */}
              <td className="px-4 py-2.5">
                {lead.businessId ? (
                  <div className="flex items-center gap-1 group/id">
                    <span className="text-[#a1a1aa] font-mono text-[11px] truncate">{lead.businessId}</span>
                    <button
                      onClick={(e) => copyBusinessId(e, lead.businessId!)}
                      className="opacity-0 group-hover/id:opacity-100 transition-opacity p-0.5 rounded hover:bg-[#f4f4f5] dark:hover:bg-[#27272a] flex-shrink-0"
                      title="Copy ID"
                    >
                      {copiedId === lead.businessId ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-[#a1a1aa]" />
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="text-[#a1a1aa] font-mono text-[11px]">—</span>
                )}
              </td>

              {/* Meeting Date */}
              <td className="px-4 py-2.5 text-[#71717a] text-[12px]">{formatDate(lead.meetingScheduledAt)}</td>

              {/* Category */}
              <td className="px-4 py-2.5">
                {lead.category ? (
                  <span className="inline-block text-[11px] px-1.5 py-0.5 bg-[#f4f4f5] text-[#52525b] rounded truncate max-w-full dark:bg-[#1e1e1e] dark:text-[#71717a]">{lead.category}</span>
                ) : (
                  <span className="text-[#a1a1aa] text-[12px]">—</span>
                )}
              </td>

              {/* Email */}
              <td className="px-4 py-2.5">
                <span className="text-[#71717a] text-[12px] truncate block">{lead.email}</span>
              </td>

              {/* Tier */}
              <td className="px-4 py-2.5">
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide inline-block",
                  isDark ? TIER_COLORS[lead.tier] : TIER_COLORS_LIGHT[lead.tier]
                )}>
                  {lead.tier}
                </span>
              </td>

              {/* Owner */}
              <td className="px-4 py-2.5">
                {lead.owner ? (
                  <div className="flex items-center gap-1.5">
                    {lead.owner.image ? (
                      <img src={lead.owner.image} alt={lead.owner.name} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ backgroundColor: getOwnerColor(lead.owner.name) }}>
                        {getInitials(lead.owner.name)}
                      </div>
                    )}
                    <span className="text-[12px] text-[#3f3f46] font-medium dark:text-[#a1a1aa]">{lead.owner.name}</span>
                  </div>
                ) : (
                  <span className="text-[12px] text-[#a1a1aa] dark:text-[#3f3f46]">—</span>
                )}
              </td>

              {/* Updated */}
              <td className="px-4 py-2.5 text-[#a1a1aa] text-[12px]">{formatDate(lead.updatedAt)}</td>
            </tr>
          ))}
          {leads.length === 0 && (
            <tr>
              <td colSpan={9} className="text-center py-16 text-[#a1a1aa]">
                No leads found. Create your first lead to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
