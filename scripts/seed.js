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

const BOUNTIES = [
  {
    id: "bounty-tumbler",
    title: "Bring Your Own Tumbler",
    description: "Use a reusable tumbler or container when getting drinks at the canteen. No disposable cups!",
    theme: "Canteen",
    sdgNumber: 12,
    sdgLabel: "Responsible Consumption and Production",
    coinsReward: 50,
    aiVerificationHint: "Look for a reusable tumbler, mug, or container being used for a drink in a canteen or cafeteria setting.",
    isActive: true,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    submissionCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "bounty-lights",
    title: "Lights Off in Empty Classroom",
    description: "Turn off the lights when leaving or entering an empty classroom. Take a photo of the dark room.",
    theme: "Energy",
    sdgNumber: 13,
    sdgLabel: "Climate Action",
    coinsReward: 40,
    aiVerificationHint: "Look for a classroom with lights turned off. Room should appear dark or naturally lit only.",
    isActive: true,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    submissionCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "bounty-segregate",
    title: "Segregate Plastic Correctly",
    description: "Place plastic waste in the correct segregation bin. Show the plastic item going into the right bin.",
    theme: "Waste",
    sdgNumber: 11,
    sdgLabel: "Sustainable Cities and Communities",
    coinsReward: 30,
    aiVerificationHint: "Look for a plastic bottle, wrapper, or container being placed into a labeled recycling or plastic waste bin.",
    isActive: true,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    submissionCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "bounty-zero-plastic",
    title: "Zero Plastic Lunch",
    description: "Have lunch at the canteen without any single-use plastic. Bring your own utensils and containers.",
    theme: "Canteen",
    sdgNumber: 12,
    sdgLabel: "Responsible Consumption and Production",
    coinsReward: 60,
    aiVerificationHint: "Look for a meal in reusable containers with no disposable plastic cups, bags, or utensils visible.",
    isActive: true,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    submissionCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "bounty-charger",
    title: "Unplug a Left-Behind Charger",
    description: "Find and unplug a phone charger or device left plugged in with no device attached.",
    theme: "Energy",
    sdgNumber: 13,
    sdgLabel: "Climate Action",
    coinsReward: 35,
    aiVerificationHint: "Look for a phone charger or laptop charger being removed from a wall outlet with no device attached.",
    isActive: true,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    submissionCount: 0,
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

async function seedStudentsAndSubmissions() {
  console.log("👥 Seeding students and submissions...");

  const sdgTargets = { 12: 100, 11: 65, 13: 35 };
  const sdgCounts = { 12: 0, 11: 0, 13: 0 };

  const bountySDG = {
    "bounty-tumbler": 12,
    "bounty-lights": 13,
    "bounty-segregate": 11,
    "bounty-zero-plastic": 12,
    "bounty-charger": 13,
  };

  for (let i = 0; i < 50; i++) {
    const studentId = uuidv4();
    const displayName = FILIPINO_NAMES[i];

    const numSubmissions = Math.floor(Math.random() * 3) + 3;
    const shuffledBounties = [...BOUNTIES].sort(() => Math.random() - 0.5);
    const studentBounties = shuffledBounties.slice(0, numSubmissions);

    let totalEarned = 0;
    const submissions = [];

    for (const bounty of studentBounties) {
      const sdg = bountySDG[bounty.id];

      if (sdgCounts[sdg] >= sdgTargets[sdg]) continue;

      const submissionId = uuidv4();
      const daysAgo = Math.floor(Math.random() * 7);
      const submittedAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

      submissions.push({
        id: submissionId,
        studentId,
        bountyId: bounty.id,
        bountyTitle: bounty.title,
        theme: bounty.theme,
        sdgNumber: bounty.sdgNumber,
        sdgLabel: bounty.sdgLabel,
        coinsAwarded: bounty.coinsReward,
        photoUrl: `https://picsum.photos/seed/${submissionId}/400/300`,
        verdict: "approved",
        confidence: 0.85 + Math.random() * 0.14,
        reason: `${bounty.title} clearly visible in the photo.`,
        submittedAt,
        reviewedAt: submittedAt,
      });

      await db.collection("claims").add({
        studentId,
        bountyId: bounty.id,
        submissionId,
        claimedAt: submittedAt,
      });

      totalEarned += bounty.coinsReward;
      sdgCounts[sdg]++;
    }

    await db.collection("students").doc(studentId).set({
      studentId,
      displayName,
      coinBalance: totalEarned,
      totalEarned,
      createdAt: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
    });

    for (const sub of submissions) {
      const { id, ...data } = sub;
      await db.collection("submissions").doc(id).set(data);
    }

    if ((i + 1) % 10 === 0) console.log(`   ${i + 1}/50 students seeded...`);
  }

  console.log(`   ✅ SDG counts: SDG 11 = ${sdgCounts[11]}, SDG 12 = ${sdgCounts[12]}, SDG 13 = ${sdgCounts[13]}`);
}

async function main() {
  console.log("🌿 Verde Demo Seed Script");
  console.log("──────────────────────────");

  try {
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
