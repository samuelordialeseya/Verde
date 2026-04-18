import { db } from "../lib/firebase";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";
import { submitBountyProof } from "./submissions";

/**
 * PROGRAMMER 3: SANDBOX TESTER
 * This file contains temporary functions to test your AI & Analytics features 
 * without needing the full UI from Programmer 1.
 * 
 * TO USE: Import and call 'runProgrammer3Test()' in your main App file.
 */

export async function seedTestBounty() {
  console.log("🛠️ Seeding test bounty...");
  const bountyId = "test-tumbler";
  const bountyData = {
    title: "Test: Bring Your Own Tumbler",
    description: "Testing AI verification for tumblers.",
    instructions: "Must show a tumbler with liquid inside in a canteen setting.",
    theme: "Canteen",
    sdgNumber: 12,
    sdgLabel: "Responsible Consumption",
    coinsReward: 50,
    aiVerificationHint: "A reusable tumbler with beverage in a cafeteria background.",
    isActive: true,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    submissionCount: 0
  };

  await setDoc(doc(db, "bounties", bountyId), bountyData);
  console.log("✅ Test Bounty Seeded: ", bountyId);
  return bountyId;
}

export async function simulateSubmission(photoFile = null) {
  const studentId = "test-student-99";
  const bountyId = "test-tumbler";

  console.log(`🚀 Simulating submission for ${studentId}...`);
  
  try {
    const result = await submitBountyProof(studentId, bountyId, photoFile);
    console.log("🏁 AI VERDICT RECEIVED:", result);
    return result;
  } catch (err) {
    if (err.message === "ALREADY_CLAIMED") {
      console.warn("⚠️ Already claimed! Delete the 'claims' and 'submissions' records for this student in Firestore to re-test.");
    } else {
      console.error("❌ Submission Failed:", err);
    }
  }
}

/**
 * Runs the full sequence.
 * Note: submitBountyProof will likely fail if photoFile is null 
 * unless the Cloud Function is mocked or handles missing files.
 */
export async function runProgrammer3Test() {
  await seedTestBounty();
  console.log("---");
  console.log("Test data is ready. You can now test the Admin stats or call simulateSubmission.");
}
