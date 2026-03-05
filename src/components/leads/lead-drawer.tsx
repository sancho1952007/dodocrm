"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getLead, updateLead, addNote, deleteLead } from "@/actions/leads";
import {
  X,
  Save,
  Loader2,
  MessageSquare,
  History,
  Send,
  ArrowRight,
  FileText,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_COLORS,
  STAGE_COLORS_DARK,
  STAGE_DOT_COLORS,
  TIER_COLORS,
  TIER_COLORS_LIGHT,
  formatDateTime,
  timeAgo,
  cn,
  getInitials,
  getOwnerColor,
} from "@/lib/utils";
import { useTheme } from "@/lib/theme";

type UserType = { id: string; name: string; email: string; role: string };

export function LeadDrawer({
  leadId,
  users,
  onClose,
  isAdmin,
}: {
  leadId: string;
  users: UserType[];
  onClose: () => void;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isPending, startTransition] = useTransition();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState<any>({});
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [stageError, setStageError] = useState("");
  const [noteError, setNoteError] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "notes" | "history">("details");

  useEffect(() => {
    loadLead();
  }, [leadId]);

  async function loadLead() {
    setLoading(true);
    const data = await getLead(leadId);
    setLead(data);
    if (data) {
      setForm({
        businessId: data.businessId || "",
        businessName: data.businessName,
        email: data.email,
        category: data.category || "",
        meetingScheduledAt: data.meetingScheduledAt
          ? new Date(data.meetingScheduledAt).toISOString().slice(0, 16)
          : "",
        painPoints: data.painPoints || "",
        questionsAsked: data.questionsAsked || "",
        website: data.website || "",
        businessDetails: data.businessDetails || "",
        tier: data.tier,
        stage: data.stage,
        nextAction: data.nextAction || "",
        nextActionDueAt: data.nextActionDueAt
          ? new Date(data.nextActionDueAt).toISOString().slice(0, 16)
          : "",
        ownerId: data.ownerId || "",
      });
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setStageError("");
    const result = await updateLead(leadId, {
      ...form,
      meetingScheduledAt: form.meetingScheduledAt || null,
      nextActionDueAt: form.nextActionDueAt || null,
      ownerId: form.ownerId || null,
      businessId: form.businessId || null,
      website: form.website || null,
      businessDetails: form.businessDetails || null,
    });
    if (result.success) {
      startTransition(() => { router.refresh(); });
      await loadLead();
    } else {
      setStageError(result.error);
    }
    setSaving(false);
  }

  async function handleStageChange(newStage: string) {
    const previousStage = form.stage;
    setForm((f: any) => ({ ...f, stage: newStage }));
    setSaving(true);
    setStageError("");
    const result = await updateLead(leadId, { stage: newStage });
    if (result.success) {
      startTransition(() => { router.refresh(); });
      await loadLead();
    } else {
      setStageError(result.error);
      setForm((f: any) => ({ ...f, stage: previousStage }));
    }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteLead(leadId);
    if (result.success) {
      startTransition(() => { router.refresh(); });
      onClose();
    }
    setDeleting(false);
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setAddingNote(true);
    setNoteError("");
    const result = await addNote({ leadId, content: noteText.trim() });
    if (result.success) {
      setNoteText("");
      await loadLead();
    } else {
      setNoteError(result.error);
    }
    setAddingNote(false);
  }

  function updateField(key: string, value: any) {
    setForm((f: any) => ({ ...f, [key]: value }));
  }

  if (loading) {
    return (
      <DrawerShell onClose={onClose}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-5 h-5 animate-spin text-[#a1a1aa]" />
        </div>
      </DrawerShell>
    );
  }

  if (!lead) {
    return (
      <DrawerShell onClose={onClose}>
        <div className="flex flex-col items-center justify-center h-full text-[#a1a1aa] gap-2">
          <AlertCircle className="w-6 h-6" />
          <span className="text-[13px]">Lead not found</span>
        </div>
      </DrawerShell>
    );
  }

  return (
    <DrawerShell onClose={onClose}>
      {/* Header */}
      <div className="flex-shrink-0 border-b dark:border-[#1e1e1e]">
        <div className="px-5 py-3.5">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <h2 className="text-[15px] font-semibold text-[#18181b] truncate dark:text-white">
                {lead.businessName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[13px] text-[#71717a]">{lead.email}</span>
                {lead.category && (
                  <span className="text-[11px] bg-[#f4f4f5] text-[#52525b] px-1.5 py-0.5 rounded dark:bg-[#1e1e1e] dark:text-[#71717a]">
                    {lead.category}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded", isDark ? TIER_COLORS[lead.tier] : TIER_COLORS_LIGHT[lead.tier])}>
                {lead.tier}
              </span>
              <button onClick={onClose} className="p-1.5 hover:bg-[#f4f4f5] rounded-lg transition-colors dark:hover:bg-[#1e1e1e]">
                <X className="w-4 h-4 text-[#a1a1aa]" />
              </button>
            </div>
          </div>
        </div>

        {/* Stage Pipeline */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-1">
            {STAGE_ORDER.map((stage, i) => {
              const isActive = form.stage === stage;
              const stageIdx = STAGE_ORDER.indexOf(form.stage);
              const isPast = i < stageIdx;
              return (
                <button
                  key={stage}
                  onClick={() => handleStageChange(stage)}
                  disabled={saving}
                  className={cn(
                    "flex-1 py-1.5 px-1 text-[10px] font-medium rounded-md transition-all text-center leading-tight",
                    isActive
                      ? cn(isDark ? STAGE_COLORS_DARK[stage] : STAGE_COLORS[stage])
                      : isPast
                      ? "bg-[#e4e4e7] text-[#52525b] dark:bg-[#27272a] dark:text-[#71717a]"
                      : "bg-[#f4f4f5] text-[#a1a1aa] hover:bg-[#e4e4e7] dark:bg-[#18181b] dark:text-[#3f3f46] dark:hover:bg-[#27272a]"
                  )}
                >
                  {STAGE_LABELS[stage]}
                </button>
              );
            })}
          </div>
          {stageError && (
            <p className="text-[11px] text-red-500 mt-1.5 dark:text-red-400">{stageError}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 border-b px-5 dark:border-[#1e1e1e]">
        <div className="flex gap-0.5">
          {[
            { id: "details", label: "Details", icon: FileText },
            { id: "notes", label: `Notes (${lead.notes?.length || 0})`, icon: MessageSquare },
            { id: "history", label: "History", icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-1.5 py-2.5 px-3 text-[13px] font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-[#18181b] text-[#18181b] dark:border-white dark:text-white"
                  : "border-transparent text-[#a1a1aa] hover:text-[#52525b] dark:hover:text-[#71717a]"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "details" && (
          <div className="p-5 space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Business ID">
                <input className="input-field text-[13px]" value={form.businessId} onChange={(e) => updateField("businessId", e.target.value)} placeholder="bus_0NYuf6nke..." />
              </Field>
              <Field label="Category">
                <input className="input-field text-[13px]" value={form.category} onChange={(e) => updateField("category", e.target.value)} placeholder="SaaS, E-commerce..." />
              </Field>
            </div>
            <Field label="Business Name">
              <input className="input-field text-[13px]" value={form.businessName} onChange={(e) => updateField("businessName", e.target.value)} />
            </Field>
            <Field label="Email">
              <input className="input-field text-[13px]" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
            </Field>
            <Field label="Website">
              <input className="input-field text-[13px]" value={form.website} onChange={(e) => updateField("website", e.target.value)} placeholder="https://example.com" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tier">
                <select className="input-field text-[13px]" value={form.tier} onChange={(e) => updateField("tier", e.target.value)}>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </Field>
              <Field label="Owner">
                <select className="input-field text-[13px]" value={form.ownerId} onChange={(e) => updateField("ownerId", e.target.value)}>
                  <option value="">Unassigned</option>
                  {users.map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
                </select>
              </Field>
            </div>
            <Field label="Meeting Scheduled">
              <input className="input-field text-[13px]" type="datetime-local" value={form.meetingScheduledAt} onChange={(e) => updateField("meetingScheduledAt", e.target.value)} />
            </Field>
            <Field label="Business Details">
              <textarea className="input-field min-h-[100px] resize-y text-[13px]" value={form.businessDetails} onChange={(e) => updateField("businessDetails", e.target.value)} placeholder="What does this business do? Key details from the meeting..." />
            </Field>
            <Field label="Pain Points">
              <textarea className="input-field min-h-[72px] resize-y text-[13px]" value={form.painPoints} onChange={(e) => updateField("painPoints", e.target.value)} placeholder="What problems does this business face?" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Next Action">
                <input className="input-field text-[13px]" value={form.nextAction} onChange={(e) => updateField("nextAction", e.target.value)} placeholder="Follow up, send docs..." />
              </Field>
              <Field label="Due Date">
                <input className="input-field text-[13px]" type="datetime-local" value={form.nextActionDueAt} onChange={(e) => updateField("nextActionDueAt", e.target.value)} />
              </Field>
            </div>

            <button onClick={handleSave} disabled={saving} className="btn-primary w-full mt-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
              Save Changes
            </button>

            {/* Admin Delete */}
            {isAdmin && (
              <div className="pt-3.5 mt-3.5 border-t dark:border-[#1e1e1e]">
                {!showDeleteConfirm ? (
                  <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 text-[13px] text-[#a1a1aa] hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete this lead
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 dark:bg-red-950/20 dark:border-red-900/30">
                    <p className="text-[13px] text-red-600 font-medium mb-2.5 dark:text-red-400">
                      Are you sure? This will permanently delete this lead and all associated data.
                    </p>
                    <div className="flex items-center gap-2">
                      <button onClick={handleDelete} disabled={deleting} className="btn-danger text-[12px] px-3 py-1.5">
                        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
                        Delete permanently
                      </button>
                      <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary text-[12px] px-3 py-1.5">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <div className="p-5">
            <div className="mb-5 bg-[#fafafa] rounded-lg p-3.5 border dark:bg-[#0f0f11] dark:border-[#1e1e1e]">
              <textarea
                className="input-field min-h-[72px] resize-y text-[13px] mb-2.5"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note or update..."
              />
              {noteError && (
                <p className="text-[11px] text-red-500 mb-2 dark:text-red-400">{noteError}</p>
              )}
              <div className="flex justify-end">
                <button onClick={handleAddNote} disabled={addingNote || !noteText.trim()} className="btn-primary text-[12px] px-3 py-1.5">
                  {addingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
                  Add Note
                </button>
              </div>
            </div>
            <div className="space-y-2.5">
              {lead.notes?.length === 0 && (
                <p className="text-[13px] text-[#a1a1aa] text-center py-8">No notes yet. Add the first update above.</p>
              )}
              {lead.notes?.map((note: any) => (
                <div key={note.id} className="bg-white rounded-lg p-3.5 border dark:bg-[#111113] dark:border-[#1e1e1e]">
                  <div className="flex items-center gap-2 mb-1.5">
                    {note.author?.image ? (
                      <img src={note.author.image} alt={note.author.name} className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: getOwnerColor(note.author?.name || "") }}>
                        {getInitials(note.author?.name || "?")}
                      </div>
                    )}
                    <span className="text-[13px] font-medium text-[#3f3f46] dark:text-[#a1a1aa]">{note.author?.name || "Unknown"}</span>
                    <span className="text-[11px] text-[#a1a1aa] ml-auto">{timeAgo(note.createdAt)}</span>
                  </div>
                  <p className="text-[13px] text-[#52525b] whitespace-pre-wrap leading-relaxed dark:text-[#a1a1aa]">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="p-5">
            <div className="space-y-1.5">
              {lead.stageHistory?.length === 0 && (
                <p className="text-[13px] text-[#a1a1aa] text-center py-8">No stage changes recorded.</p>
              )}
              {lead.stageHistory?.map((h: any) => (
                <div key={h.id} className="flex items-center gap-3 text-[13px] py-2.5 px-3 rounded-lg hover:bg-[#fafafa] transition-colors dark:hover:bg-[#111113]">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {h.fromStage ? (
                      <>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap", isDark ? STAGE_COLORS_DARK[h.fromStage] : STAGE_COLORS[h.fromStage])}>
                          {STAGE_LABELS[h.fromStage]}
                        </span>
                        <ArrowRight className="w-3 h-3 text-[#a1a1aa] shrink-0" />
                      </>
                    ) : (
                      <span className="text-[11px] text-[#a1a1aa]">Created as</span>
                    )}
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap", isDark ? STAGE_COLORS_DARK[h.toStage] : STAGE_COLORS[h.toStage])}>
                      {STAGE_LABELS[h.toStage]}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#a1a1aa] whitespace-nowrap shrink-0">
                    {h.changer?.name} · {timeAgo(h.changedAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DrawerShell>
  );
}

function DrawerShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl z-50 flex flex-col animate-slide-in border-l dark:bg-[#111113] dark:border-[#1e1e1e]">
        {children}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label text-[12px]">{label}</label>
      {children}
    </div>
  );
}
