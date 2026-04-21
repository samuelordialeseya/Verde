const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { v4: uuidv4 } = require("uuid");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const FILIPINO_NAMES = [
  "Andrei Santos", "Bianca Reyes", "Carlo Dela Cruz", "Dana Villanueva",
  "Emilio Garcia", "Frances Mendoza", "Gabriel Ramos", "Hannah Cruz",
  "Ivan Lopez", "Jasmine Torres", "Karl Bautista", "Lara Aquino",
  "Marco Fernandez", "Nina Castillo", "Oscar Guerrero", "Patricia Lim",
  "Quentin Tan", "Rachel Flores", "Samuel Navarro", "Trisha Padilla",
  "Ulysses Bernardo", "Vanessa Ocampo", "William Dizon", "Xandra Salazar",
  "Yvan Morales", "Zara Macapagal", "Anton Roxas", "Bea Tolentino",
  "Cris Delos Reyes", "Diana Corpus", "Enzo Hermoso", "Faye Aguilar",
  "Gab Sison", "Hazel Pascual", "Ian Villanueva", "Jem Castro",
  "Ken Mendez", "Liz Pangilinan", "Miguel Herrera", "Nikki Soriano",
  "Orlando Buenaventura", "Pamela Dionisio", "Renzo Alcantara",
  "Sabrina Fontanilla", "Theo Almeda", "Una Fajardo", "Vic Macalinao",
  "Wendy Ilustre", "Xio Araneta", "Yaya Gonzales",
];

const TARGETS = {
  students: 50,
  approvedSubmissions: 200,
  sdg: { 12: 100, 11: 40, 13: 60 },
};

const BOUNTIES = [
  {
    id: "bounty-tumbler",
    title: "Bring Your Own Tumbler",
    description: "Use a reusable tumbler or bottle for your drink in the canteen.",
    instructions: "Show a reusable tumbler with drink inside and canteen background context.",
    theme: "canteen",
    sdgTag: 12,
    sdgNumber: 12,
    sdgLabel: "SDG 12 - Responsible Consumption and Production",
    coinReward: 50,
    coinsReward: 50,
    mediaType: "photo",
    aiVerificationHint: "Reusable container with beverage visible in a campus canteen setting. Reject desk-only shots.",
    isActive: true,
    claimCount: 0,
    submissionCount: 0,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "bounty-lights",
    title: "Lights Off in Empty Classroom",
    description: "Turn off lights in an empty classroom and document the action.",
    instructions: "Classroom interior must be visible with lights off and switch in OFF position.",
    theme: "energy",
    sdgTag: 13,
    sdgNumber: 13,
    sdgLabel: "SDG 13 - Climate Action",
    coinReward: 40,
    coinsReward: 40,
    mediaType: "photo",
    aiVerificationHint: "Empty classroom context required, lights off, and switch visible in OFF state.",
    isActive: true,
    claimCount: 0,
    submissionCount: 0,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "bounty-segregate",
    title: "Segregate Plastic Correctly",
    description: "Dispose plastic waste into the correct segregation bin.",
    instructions: "Plastic item must be visibly inside the bin opening with label/color visible.",
    theme: "waste",
    sdgTag: 11,
    sdgNumber: 11,
    sdgLabel: "SDG 11 - Sustainable Cities and Communities",
    coinReward: 30,
    coinsReward: 30,
    mediaType: "photo",
    aiVerificationHint: "Item must be entering the correct bin opening; reject near-bin photos.",
    isActive: true,
    claimCount: 0,
    submissionCount: 0,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "bounty-zero-plastic",
    title: "Zero Plastic Lunch",
    description: "Finish a canteen meal without any single-use plastic materials.",
    instructions: "Meal tray should be fully visible with no disposable plastics.",
    theme: "canteen",
    sdgTag: 12,
    sdgNumber: 12,
    sdgLabel: "SDG 12 - Responsible Consumption and Production",
    coinReward: 60,
    coinsReward: 60,
    mediaType: "photo",
    aiVerificationHint: "Full meal tray in frame and no plastic wrappers or utensils visible.",
    isActive: true,
    claimCount: 0,
    submissionCount: 0,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "bounty-charger",
    title: "Unplug a Left-Behind Charger",
    description: "Unplug an idle charger that was left connected with no device attached.",
    instructions: "Show charger and socket with hand interaction while unplugging.",
    theme: "energy",
    sdgTag: 13,
    sdgNumber: 13,
    sdgLabel: "SDG 13 - Climate Action",
    coinReward: 35,
    coinsReward: 35,
    mediaType: "photo",
    aiVerificationHint: "Charger + wall socket + hand interaction must be visible.",
    isActive: true,
    claimCount: 0,
    submissionCount: 0,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

const VENDORS = [
  {
    id: "main-canteen",
    name: "Main Canteen",
    emoji: "🍚",
    description: "BatStateU Main Campus Canteen",
    isActive: true,
  },
  {
    id: "eng-print",
    name: "Engineering Print Shop",
    emoji: "🖨️",
    description: "Engineering Building Print Shop",
    isActive: true,
  },
];

const BOUNTY_BY_ID = Object.fromEntries(BOUNTIES.map((bounty) => [bounty.id, bounty]));
const BOUNTY_IDS_BY_SDG = {
  11: BOUNTIES.filter((bounty) => bounty.sdgNumber === 11).map((bounty) => bounty.id),
  12: BOUNTIES.filter((bounty) => bounty.sdgNumber === 12).map((bounty) => bounty.id),
  13: BOUNTIES.filter((bounty) => bounty.sdgNumber === 13).map((bounty) => bounty.id),
};

async function clearCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) return;

  let batch = db.batch();
  let opCount = 0;

  snapshot.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
    opCount += 1;

    if (opCount === 450) {
      batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  });

  if (opCount > 0) {
    await batch.commit();
  }
}

async function clearSeedCollections() {
  console.log("🧹 Clearing previous demo data...");
  await clearCollection("students");
  await clearCollection("submissions");
  await clearCollection("claims");
  await clearCollection("vendors");
  await clearCollection("bounties");
}

async function seedVendors() {
  console.log("🏪 Seeding vendors...");
  const batch = db.batch();

  VENDORS.forEach((vendor) => {
    const ref = db.collection("vendors").doc(vendor.id);
    batch.set(ref, vendor);
  });

  await batch.commit();
  console.log(`   ✅ ${VENDORS.length} vendors seeded`);
}

async function seedBounties() {
  console.log("🎯 Seeding bounties...");
  const batch = db.batch();

  BOUNTIES.forEach((bounty) => {
    const { id, ...data } = bounty;
    const ref = db.collection("bounties").doc(id);
    batch.set(ref, data);
  });

  await batch.commit();
  console.log(`   ✅ ${BOUNTIES.length} bounties seeded`);
}

function buildStudents() {
  return Array.from({ length: TARGETS.students }).map((_, index) => {
    const studentId = uuidv4();
    const displayName = FILIPINO_NAMES[index % FILIPINO_NAMES.length];
    const joinedAt = new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000).toISOString();
    return {
      id: studentId,
      studentId,
      displayName,
      coinBalance: 0,
      totalEarned: 0,
      joinedAt,
      createdAt: joinedAt,
    };
  });
}

function pickStudentWithCapacity(studentClaimedBounties, candidateIds) {
  const eligible = candidateIds.filter((studentId) => studentClaimedBounties[studentId].size < BOUNTIES.length);
  if (eligible.length === 0) {
    throw new Error("No eligible students remaining for target distribution");
  }
  return eligible[Math.floor(Math.random() * eligible.length)];
}

function pickBountyForSDG(sdg, claimedByStudent) {
  const options = BOUNTY_IDS_BY_SDG[sdg].filter((bountyId) => !claimedByStudent.has(bountyId));
  if (options.length === 0) return null;
  return options[Math.floor(Math.random() * options.length)];
}

function buildApprovedSubmissions(students) {
  const studentsById = Object.fromEntries(students.map((student) => [student.studentId, student]));
  const studentIds = students.map((student) => student.studentId);
  const studentClaimedBounties = Object.fromEntries(studentIds.map((id) => [id, new Set()]));
  const bountyClaimCounts = Object.fromEntries(BOUNTIES.map((bounty) => [bounty.id, 0]));
  const submissions = [];
  const claims = [];
  const sdgCounts = { 11: 0, 12: 0, 13: 0 };

  const orderedSDGs = [
    ...Array(TARGETS.sdg[12]).fill(12),
    ...Array(TARGETS.sdg[11]).fill(11),
    ...Array(TARGETS.sdg[13]).fill(13),
  ];

  orderedSDGs.forEach((sdg) => {
    let attempts = 0;
    while (attempts < 2000) {
      attempts += 1;
      const studentId = pickStudentWithCapacity(studentClaimedBounties, studentIds);
      const bountyId = pickBountyForSDG(sdg, studentClaimedBounties[studentId]);
      if (!bountyId) continue;

      const bounty = BOUNTY_BY_ID[bountyId];
      const submissionId = uuidv4();
      const daysAgo = Math.floor(Math.random() * 7);
      const submittedAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

      submissions.push({
        id: submissionId,
        studentId,
        bountyId,
        bountyTitle: bounty.title,
        theme: bounty.theme,
        sdgNumber: bounty.sdgNumber,
        sdgLabel: bounty.sdgLabel,
        coinsAwarded: bounty.coinsReward,
        photoUrl: `https://picsum.photos/seed/${submissionId}/800/600`,
        verdict: "approved",
        confidence: Number((0.86 + Math.random() * 0.13).toFixed(2)),
        reason: `${bounty.title} verified with required context.`,
        submittedAt,
        reviewedAt: submittedAt,
      });

      claims.push({
        id: uuidv4(),
        studentId,
        bountyId,
        submissionId,
        claimedAt: submittedAt,
      });

      studentClaimedBounties[studentId].add(bountyId);
      studentsById[studentId].coinBalance += bounty.coinsReward;
      studentsById[studentId].totalEarned += bounty.coinsReward;
      bountyClaimCounts[bountyId] += 1;
      sdgCounts[sdg] += 1;
      return;
    }

    throw new Error(`Unable to place SDG ${sdg} submission after many attempts`);
  });

  if (submissions.length !== TARGETS.approvedSubmissions) {
    throw new Error(`Expected ${TARGETS.approvedSubmissions} submissions, got ${submissions.length}`);
  }

  return { students, submissions, claims, sdgCounts, bountyClaimCounts };
}

async function seedStudentsAndSubmissions() {
  console.log("👥 Seeding students, claims, and submissions...");

  const students = buildStudents();
  const { submissions, claims, sdgCounts, bountyClaimCounts } = buildApprovedSubmissions(students);

  for (const student of students) {
    await db.collection("students").doc(student.studentId).set(student);
  }

  for (const claim of claims) {
    await db.collection("claims").doc(claim.id).set({
      studentId: claim.studentId,
      bountyId: claim.bountyId,
      submissionId: claim.submissionId,
      claimedAt: claim.claimedAt,
    });
  }

  for (const submission of submissions) {
    const { id, ...submissionData } = submission;
    await db.collection("submissions").doc(id).set(submissionData);
  }

  const bountyUpdates = db.batch();
  Object.entries(bountyClaimCounts).forEach(([bountyId, count]) => {
    const ref = db.collection("bounties").doc(bountyId);
    bountyUpdates.update(ref, {
      claimCount: count,
      submissionCount: count,
    });
  });
  await bountyUpdates.commit();

  console.log(`   ✅ ${students.length} students seeded`);
  console.log(`   ✅ ${submissions.length} approved submissions seeded`);
  console.log(`   ✅ SDG counts: SDG 11 = ${sdgCounts[11]}, SDG 12 = ${sdgCounts[12]}, SDG 13 = ${sdgCounts[13]}`);
}

async function main() {
  console.log("🌿 Verde Demo Seed Script");
  console.log("──────────────────────────");

  try {
    await clearSeedCollections();
    await seedVendors();
    await seedBounties();
    await seedStudentsAndSubmissions();

    console.log("──────────────────────────");
    console.log("✅ Seed complete! Verde is ready for demo.");
    console.log("   Open /admin to see the dashboard live.");
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

main();
