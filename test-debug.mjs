// Run this directly: node test-debug.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("\n=== DODO CRM DEBUG TEST ===\n");

  // Test 1: Read leads
  try {
    const leads = await prisma.lead.findMany({ take: 2, select: { id: true, businessName: true, stage: true } });
    console.log("✅ DB READ works. Found", leads.length, "leads");
    console.log("   Sample:", leads[0]?.businessName, "-", leads[0]?.stage);

    if (leads.length === 0) {
      console.log("❌ No leads in database. Run: npx prisma db seed");
      return;
    }

    const testLead = leads[0];

    // Test 2: Update lead stage
    try {
      const newStage = testLead.stage === "MEETING_SCHEDULED" ? "MEETING_DONE" : "MEETING_SCHEDULED";
      await prisma.lead.update({
        where: { id: testLead.id },
        data: { stage: newStage },
      });
      // Revert
      await prisma.lead.update({
        where: { id: testLead.id },
        data: { stage: testLead.stage },
      });
      console.log("✅ DB WRITE (stage change) works");
    } catch (e) {
      console.log("❌ DB WRITE (stage change) FAILED:", e.message);
    }

    // Test 3: Read users
    try {
      const users = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
      console.log("✅ Users found:", users.map(u => `${u.name} (${u.email})`).join(", "));

      if (users.length > 0) {
        const testUser = users[0];

        // Test 4: Create and delete note
        try {
          const note = await prisma.leadNote.create({
            data: {
              leadId: testLead.id,
              content: "TEST NOTE - ignore",
              createdBy: testUser.id,
            },
          });
          await prisma.leadNote.delete({ where: { id: note.id } });
          console.log("✅ NOTE CREATE/DELETE works");
        } catch (e) {
          console.log("❌ NOTE CREATE FAILED:", e.message);
        }

        // Test 5: Create and delete stage history
        try {
          const history = await prisma.leadStageHistory.create({
            data: {
              leadId: testLead.id,
              fromStage: "MEETING_SCHEDULED",
              toStage: "MEETING_DONE",
              changedBy: testUser.id,
            },
          });
          await prisma.leadStageHistory.delete({ where: { id: history.id } });
          console.log("✅ STAGE HISTORY CREATE/DELETE works");
        } catch (e) {
          console.log("❌ STAGE HISTORY CREATE FAILED:", e.message);
        }
      }
    } catch (e) {
      console.log("❌ USER READ FAILED:", e.message);
    }

  } catch (e) {
    console.log("❌ DB READ FAILED:", e.message);
  }

  console.log("\n=== DONE ===\n");
}

run().catch(e => console.error("FATAL:", e)).finally(() => prisma.$disconnect());
