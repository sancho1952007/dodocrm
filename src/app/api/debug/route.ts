import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const results: Record<string, any> = {};

  // Step 1: Check session
  try {
    const session = await getServerSession(authOptions);
    results.session = {
      exists: !!session,
      hasUser: !!session?.user,
      hasId: !!(session?.user as any)?.id,
      userId: (session?.user as any)?.id || "MISSING",
      email: session?.user?.email || "MISSING",
      role: (session?.user as any)?.role || "MISSING",
    };
  } catch (e: any) {
    results.session = { error: e.message };
  }

  // Step 2: Check DB read
  try {
    const leadCount = await prisma.lead.count();
    const firstLead = await prisma.lead.findFirst({ select: { id: true, businessName: true, stage: true } });
    results.dbRead = { leadCount, firstLead };
  } catch (e: any) {
    results.dbRead = { error: e.message };
  }

  // Step 3: Check DB write (try updating a lead's updatedAt and reverting)
  try {
    const lead = await prisma.lead.findFirst();
    if (lead) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { updatedAt: new Date() },
      });
      results.dbWrite = { success: true, leadId: lead.id };
    } else {
      results.dbWrite = { success: false, error: "No leads to test with" };
    }
  } catch (e: any) {
    results.dbWrite = { error: e.message };
  }

  // Step 4: Check note creation
  try {
    const userId = (results.session?.userId !== "MISSING") ? results.session.userId : null;
    const lead = await prisma.lead.findFirst();
    if (userId && lead) {
      const note = await prisma.leadNote.create({
        data: {
          leadId: lead.id,
          content: "DEBUG TEST - safe to delete",
          createdBy: userId,
        },
      });
      // Clean up
      await prisma.leadNote.delete({ where: { id: note.id } });
      results.noteWrite = { success: true };
    } else {
      results.noteWrite = { success: false, error: `userId: ${userId}, lead: ${!!lead}` };
    }
  } catch (e: any) {
    results.noteWrite = { error: e.message };
  }

  // Step 5: Check stage history creation
  try {
    const userId = (results.session?.userId !== "MISSING") ? results.session.userId : null;
    const lead = await prisma.lead.findFirst();
    if (userId && lead) {
      const history = await prisma.leadStageHistory.create({
        data: {
          leadId: lead.id,
          fromStage: lead.stage,
          toStage: lead.stage,
          changedBy: userId,
        },
      });
      // Clean up
      await prisma.leadStageHistory.delete({ where: { id: history.id } });
      results.stageHistoryWrite = { success: true };
    } else {
      results.stageHistoryWrite = { success: false, error: `userId: ${userId}, lead: ${!!lead}` };
    }
  } catch (e: any) {
    results.stageHistoryWrite = { error: e.message };
  }

  return NextResponse.json(results, { status: 200 });
}
