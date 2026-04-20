import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  runTransaction,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";

const STUDENTS = "students";
const TRANSACTIONS = "transactions";
const REDEMPTION_TOKENS = "redemption_tokens";

export const COIN_TO_PESO_RATE = 0.10;

const TOKEN_EXPIRY_MS = 5 * 60 * 1000;

export async function creditCoins(studentId, referenceId, amount, metadata) {
  const studentRef = doc(db, STUDENTS, studentId);

  await runTransaction(db, async (txn) => {
    const studentSnap = await txn.get(studentRef);
    if (!studentSnap.exists()) throw new Error("Student not found");

    const current = studentSnap.data();
    const newBalance = (current.coinBalance || 0) + amount;
    const newTotal = (current.totalEarned || 0) + amount;

    txn.update(studentRef, {
      coinBalance: newBalance,
      totalEarned: newTotal,
    });

    const txnRef = doc(collection(db, TRANSACTIONS));
    txn.set(txnRef, {
      studentId,
      referenceId,
      amount: +amount,
      balanceAfter: newBalance,
      type: metadata.type,
      label: metadata.label,
      sdgNumber: metadata.sdgNumber || null,
      createdAt: new Date().toISOString(),
    });
  });
}

export async function deductCoins(studentId, amount, redemptionId) {
  const studentRef = doc(db, STUDENTS, studentId);
  let newBalance = 0;

  await runTransaction(db, async (txn) => {
    const studentSnap = await txn.get(studentRef);
    if (!studentSnap.exists()) throw new Error("Student not found");

    const current = studentSnap.data();

    if ((current.coinBalance || 0) < amount) {
      throw new Error("INSUFFICIENT_BALANCE");
    }

    newBalance = current.coinBalance - amount;

    txn.update(studentRef, { coinBalance: newBalance });

    const txnRef = doc(collection(db, TRANSACTIONS));
    txn.set(txnRef, {
      studentId,
      referenceId: redemptionId,
      amount: -amount,
      balanceAfter: newBalance,
      type: "redemption",
      label: `Redemption at vendor`,
      sdgNumber: null,
      createdAt: new Date().toISOString(),
    });
  });

  return newBalance;
}

export async function generateRedemptionToken(studentId, coinsToRedeem) {
  const studentSnap = await getDoc(doc(db, STUDENTS, studentId));
  if (!studentSnap.exists()) throw new Error("Student not found");

  const student = studentSnap.data();
  if ((student.coinBalance || 0) < coinsToRedeem) {
    throw new Error("INSUFFICIENT_BALANCE");
  }

  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS).toISOString();

  const tokenRef = await addDoc(collection(db, REDEMPTION_TOKENS), {
    studentId,
    displayName: student.displayName,
    coinsToRedeem,
    pesoEquivalent: coinsToRedeem * COIN_TO_PESO_RATE,
    isRedeemed: false,
    expiresAt,
    createdAt: new Date().toISOString(),
    redeemedAt: null,
    redeemedByVendor: null,
  });

  return tokenRef.id;
}

export async function processRedemption(tokenId, vendorId) {
  const tokenRef = doc(db, REDEMPTION_TOKENS, tokenId);
  const tokenSnap = await getDoc(tokenRef);

  if (!tokenSnap.exists()) throw new Error("INVALID_QR_CODE");

  const token = tokenSnap.data();

  if (new Date(token.expiresAt) < new Date()) {
    throw new Error("QR_CODE_EXPIRED");
  }

  if (token.isRedeemed) {
    throw new Error("ALREADY_REDEEMED");
  }

  const newBalance = await deductCoins(token.studentId, token.coinsToRedeem, tokenId);

  await updateDoc(tokenRef, {
    isRedeemed: true,
    redeemedAt: new Date().toISOString(),
    redeemedByVendor: vendorId,
  });

  return {
    studentName: token.displayName,
    coinsRedeemed: token.coinsToRedeem,
    pesoEquivalent: token.pesoEquivalent,
    remainingBalance: newBalance,
    redeemedAt: new Date().toISOString(),
  };
}

export async function getTransactionHistory(studentId, limitCount = 20) {
  // No orderBy to avoid composite index requirement — sort client-side
  const q = query(
    collection(db, TRANSACTIONS),
    where("studentId", "==", studentId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limitCount);
}

export function subscribeToTransactions(studentId, callback) {
  // No orderBy to avoid composite index requirement — sort client-side
  const q = query(
    collection(db, TRANSACTIONS),
    where("studentId", "==", studentId)
  );
  return onSnapshot(q, (snap) => {
    const sorted = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          // Normalize field names to match UI expectations
          description: data.description || data.label || "Transaction",
          timestamp: data.timestamp || data.createdAt,
          type: data.type === "redemption" ? "redeemed" : data.type || "earned",
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    callback(sorted);
  });
}

export function coinsToPhp(coins) {
  return `₱${(coins * COIN_TO_PESO_RATE).toFixed(2)}`;
}
