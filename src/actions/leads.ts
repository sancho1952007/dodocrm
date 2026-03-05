"use server";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { leadSchema, noteSchema, stageChangeSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type ActionResult<T = any> = { success: true; data: T } | { success: false; error: string };

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return null;
  // Verify user still exists in DB (handles re-seed / stale session)
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, image: true },
  });
  if (!dbUser) return null;
  return { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role, image: dbUser.image };
}

// ─── Fetch Leads ───────────────────────────────────────────────
export async function getLeads(filters?: {
  stage?: string;
  tier?: string;
  ownerId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const where: any = {};

  if (filters?.stage) where.stage = filters.stage;
  if (filters?.tier) where.tier = filters.tier;
  if (filters?.ownerId) where.ownerId = filters.ownerId;

  if (filters?.search) {
    where.OR = [
      { businessName: { contains: filters.search } },
      { email: { contains: filters.search } },
      { businessId: { contains: filters.search } },
    ];
  }

  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
  }

  return prisma.lead.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
      _count: { select: { notes: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

// ─── Get Single Lead ───────────────────────────────────────────
export async function getLead(id: string) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return prisma.lead.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
      notes: {
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
      stageHistory: {
        include: { changer: { select: { id: true, name: true } } },
        orderBy: { changedAt: "desc" },
      },
    },
  });
}

// ─── Create Lead ───────────────────────────────────────────────
export async function createLead(data: unknown): Promise<ActionResult> {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: "Not authenticated. Please log in again." };

    const parsed = leadSchema.parse(data);

    const lead = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          businessId: parsed.businessId || null,
          businessName: parsed.businessName,
          email: parsed.email,
          category: parsed.category || "",
          meetingScheduledAt: parsed.meetingScheduledAt
            ? new Date(parsed.meetingScheduledAt)
            : null,
          painPoints: parsed.painPoints || null,
          questionsAsked: parsed.questionsAsked || null,
          website: parsed.website || null,
          businessDetails: parsed.businessDetails || null,
          tier: parsed.tier,
          stage: parsed.stage,
          nextAction: parsed.nextAction || null,
          nextActionDueAt: parsed.nextActionDueAt
            ? new Date(parsed.nextActionDueAt)
            : null,
          ownerId: parsed.ownerId || null,
        },
      });

      // Initial stage history
      await tx.leadStageHistory.create({
        data: {
          leadId: lead.id,
          fromStage: null,
          toStage: lead.stage,
          changedBy: user.id,
        },
      });

      return lead;
    });

    revalidatePath("/leads");
    return { success: true, data: lead };
  } catch (e: any) {
    console.error("createLead error:", e);
    return { success: false, error: e?.message || "Failed to create lead" };
  }
}

// ─── Update Lead ───────────────────────────────────────────────
export async function updateLead(id: string, data: unknown): Promise<ActionResult> {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: "Not authenticated. Please log in again." };

    const parsed = leadSchema.partial().parse(data);

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Lead not found" };

    const stageChanged = parsed.stage && parsed.stage !== existing.stage;

    const lead = await prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({
        where: { id },
        data: {
          ...(parsed.businessId !== undefined && { businessId: parsed.businessId || null }),
          ...(parsed.businessName !== undefined && { businessName: parsed.businessName }),
          ...(parsed.email !== undefined && { email: parsed.email }),
          ...(parsed.category !== undefined && { category: parsed.category }),
          ...(parsed.meetingScheduledAt !== undefined && {
            meetingScheduledAt: parsed.meetingScheduledAt
              ? new Date(parsed.meetingScheduledAt)
              : null,
          }),
          ...(parsed.painPoints !== undefined && { painPoints: parsed.painPoints }),
          ...(parsed.questionsAsked !== undefined && { questionsAsked: parsed.questionsAsked }),
          ...(parsed.website !== undefined && { website: parsed.website || null }),
          ...(parsed.businessDetails !== undefined && { businessDetails: parsed.businessDetails || null }),
          ...(parsed.tier !== undefined && { tier: parsed.tier }),
          ...(parsed.stage !== undefined && { stage: parsed.stage }),
          ...(parsed.nextAction !== undefined && { nextAction: parsed.nextAction }),
          ...(parsed.nextActionDueAt !== undefined && {
            nextActionDueAt: parsed.nextActionDueAt
              ? new Date(parsed.nextActionDueAt)
              : null,
          }),
          ...(parsed.ownerId !== undefined && { ownerId: parsed.ownerId || null }),
        },
      });

      if (stageChanged) {
        await tx.leadStageHistory.create({
          data: {
            leadId: id,
            fromStage: existing.stage,
            toStage: parsed.stage!,
            changedBy: user.id,
          },
        });
      }

      return updated;
    });

    revalidatePath("/leads");
    return { success: true, data: lead };
  } catch (e: any) {
    console.error("updateLead error:", e);
    return { success: false, error: e?.message || "Failed to update lead" };
  }
}

// ─── Change Stage (shortcut) ──────────────────────────────────
export async function changeStage(data: unknown): Promise<ActionResult> {
  try {
    const parsed = stageChangeSchema.parse(data);
    return updateLead(parsed.leadId, { stage: parsed.newStage });
  } catch (e: any) {
    return { success: false, error: e?.message || "Failed to change stage" };
  }
}

// ─── Add Note ──────────────────────────────────────────────────
export async function addNote(data: unknown): Promise<ActionResult> {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: "Not authenticated. Please log in again." };

    const parsed = noteSchema.parse(data);

    const note = await prisma.leadNote.create({
      data: {
        leadId: parsed.leadId,
        content: parsed.content,
        createdBy: user.id,
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    revalidatePath("/leads");
    return { success: true, data: note };
  } catch (e: any) {
    console.error("addNote error:", e);
    return { success: false, error: e?.message || "Failed to add note" };
  }
}

// ─── Delete Lead ───────────────────────────────────────────────
export async function deleteLead(id: string): Promise<ActionResult> {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: "Not authenticated. Please log in again." };
    if (user.role !== "ADMIN") return { success: false, error: "Only admins can delete leads" };

    await prisma.lead.delete({ where: { id } });
    revalidatePath("/leads");
    return { success: true, data: null };
  } catch (e: any) {
    console.error("deleteLead error:", e);
    return { success: false, error: e?.message || "Failed to delete lead" };
  }
}

// ─── Get Users (for owner select) ─────────────────────────────
export async function getUsers() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
}
