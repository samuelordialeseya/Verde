import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { processRedemption } from "./wallet";

const COLLECTION = "vendors";

export const SCAN_ERRORS = {
  INVALID_QR_CODE: "Invalid QR Code",
  QR_CODE_EXPIRED: "QR Code Expired",
  ALREADY_REDEEMED: "Already Redeemed",
  INSUFFICIENT_BALANCE: "Insufficient Balance",
};

export async function getVendor(vendorId) {
  const ref = doc(db, COLLECTION, vendorId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Vendor not found");
  return { id: snap.id, ...snap.data() };
}

export async function processVendorScan(rawQrValue, vendorId) {
  const tokenId = rawQrValue.trim();

  if (!tokenId) throw new Error("INVALID_QR_CODE");

  try {
    const result = await processRedemption(tokenId, vendorId);
    return result;
  } catch (err) {
    const message = err.message || "";

    if (message === "INVALID_QR_CODE" || message === "Student not found") {
      throw new Error("INVALID_QR_CODE");
    }
    if (message === "QR_CODE_EXPIRED") throw new Error("QR_CODE_EXPIRED");
    if (message === "ALREADY_REDEEMED") throw new Error("ALREADY_REDEEMED");
    if (message === "INSUFFICIENT_BALANCE") throw new Error("INSUFFICIENT_BALANCE");

    throw new Error("INVALID_QR_CODE");
  }
}
