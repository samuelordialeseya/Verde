// src/tests/testEconomy.js
// Unit tests for Programmer 2: Wallet & Vendor Security

// ─── Node.js Polyfills (browser APIs not available in Node) ───────────────────
if (typeof globalThis.localStorage === "undefined") {
  globalThis.localStorage = {
    _data: {},
    getItem(key) { return this._data[key] ?? null; },
    setItem(key, value) { this._data[key] = String(value); },
    removeItem(key) { delete this._data[key]; },
    clear() { this._data = {}; },
  };
}

if (typeof globalThis.window === "undefined") {
  globalThis.window = globalThis;
}
// ─────────────────────────────────────────────────────────────────────────────
import { db } from "../lib/firebase.js";
import { connectFirestoreEmulator } from "firebase/firestore";
import { createStudentIdentity } from "../services/students.js";
import { creditCoins, generateRedemptionToken, processRedemption, coinsToPhp } from "../services/wallet.js";
import { processVendorScan } from "../services/vendor.js";

// ─── Emulator Connection ─────────────────────────────────────────────────────
try {
  // Only connect if we haven't already (prevents hot-reload errors)
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  console.log("📡 Connected to Firestore Emulator (Port 8080)");
} catch (e) {
  // console.log("Emulator already connected or port 8080 not active.");
}
// ─────────────────────────────────────────────────────────────────────────────

async function runEconomyTests() {
  console.log("💰 Starting Economy & Security Tests...\n");

  let studentId;
  let tokenId;

  // 1. Setup Student
  const student = await createStudentIdentity("Security Tester");
  studentId = student.studentId;
  console.log(`✅ Test student created: ${studentId}`);

  // 2. Test Atomic Credit
  try {
    await creditCoins(studentId, "test-award", 100, {
      type: "bounty_reward",
      label: "Initial Grant",
      sdgNumber: 12
    });
    console.log("✅ Atomic Credit successful: +100 coins");
  } catch (e) {
    console.log("❌ Credit failed:", e.message);
  }

  // 3. Test Insufficient Balance
  try {
    console.log("⏳ Testing Insufficient Balance (Spending 500 when having 100)...");
    await generateRedemptionToken(studentId, 500);
    console.log("❌ Failure: Allowed spending more than balance!");
  } catch (e) {
    if (e.message === "INSUFFICIENT_BALANCE") {
      console.log("✅ Security Passed: Correctly blocked over-spending.");
    } else {
      console.log("❌ Unexpected error:", e.message);
    }
  }

  // 4. Test Valid Token Generation
  try {
    tokenId = await generateRedemptionToken(studentId, 40);
    console.log(`✅ QR Token generated for 40 coins (Value: ${coinsToPhp(40)})`);
  } catch (e) {
    console.log("❌ Token generation failed:", e.message);
  }

  // 5. Test Vendor Scanning
  try {
    const result = await processVendorScan(tokenId, "canteen-01");
    console.log(`✅ Vendor scan successful! Remaining: ${result.remainingBalance} coins`);
  } catch (e) {
    console.log("❌ Vendor scan failed:", e.message);
  }

  // 6. Test Double-Spending (Scanning same QR again)
  try {
    console.log("⏳ Testing Double-Spending (Scanning used QR)...");
    await processVendorScan(tokenId, "canteen-01");
    console.log("❌ Failure: Allowed double-redemption of same token!");
  } catch (e) {
    if (e.message === "ALREADY_REDEEMED") {
      console.log("✅ Security Passed: Blocked double-redemption.");
    } else {
      console.log("❌ Unexpected error:", e.message);
    }
  }

  console.log("\n🏁 Economy Security Check Complete!");
  process.exit(0);
}

runEconomyTests();
