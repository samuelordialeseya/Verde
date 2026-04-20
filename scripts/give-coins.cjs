// Quick dev script to give 500 coins to ALL students in Firestore for testing
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const serviceAccount = require("./serviceAccountKey.json");
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function giveCoins() {
  const snapshot = await db.collection("students").get();
  if (snapshot.empty) {
    console.log("❌ No students found. Have you signed in to the app yet?");
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      coinBalance: FieldValue.increment(500),
      totalEarned: FieldValue.increment(500),
    });
  });

  await batch.commit();

  console.log(`✅ Gave 500 coins to ${snapshot.size} student(s):`);
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    console.log(`   → ${data.displayName} (was ${data.coinBalance ?? 0} coins)`);
  });
  console.log("\n💡 Refresh your browser to see the updated balance!");
}

giveCoins().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
