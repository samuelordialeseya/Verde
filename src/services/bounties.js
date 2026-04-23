import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";

const COLLECTION = "ecoMissions";

export const THEMES = ["canteen", "energy", "waste", "general"];
export const SDGS = [
  { number: 11, label: "SDG 11 - Sustainable Cities and Communities" },
  { number: 12, label: "SDG 12 - Responsible Consumption and Production" },
  { number: 13, label: "SDG 13 - Climate Action" },
];

function normalizeTheme(theme) {
  const normalized = String(theme || "").trim().toLowerCase();
  return THEMES.includes(normalized) ? normalized : "general";
}

function normalizeExpiresAt(expiresAt) {
  if (!expiresAt) {
    throw new Error("expiresAt is required");
  }
  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid expiresAt value");
  }
  return parsed.toISOString();
}

function mapEcoMission(docSnap) {
  const data = docSnap.data();
  return { id: docSnap.id, ...data };
}

export async function createEcoMission({
  title,
  description,
  instructions = "",
  theme,
  sdgNumber,
  coinsReward,
  expiresAt,
  aiVerificationHint,
}) {
  const sdg = SDGS.find((s) => s.number === sdgNumber);
  if (!sdg) throw new Error(`Invalid SDG number: ${sdgNumber}`);
  const createdAt = new Date().toISOString();

  const ref = await addDoc(collection(db, COLLECTION), {
    title: String(title || "").trim(),
    description: String(description || "").trim(),
    instructions: String(instructions || "").trim(),
    theme: normalizeTheme(theme),
    sdgNumber,
    sdgTag: sdgNumber,
    sdgLabel: sdg.label,
    coinReward: coinsReward,
    coinsReward,
    expiresAt: normalizeExpiresAt(expiresAt),
    aiVerificationHint: String(aiVerificationHint || "").trim(),
    mediaType: "photo",
    isActive: true,
    createdAt,
    submissionCount: 0,
    claimCount: 0,
  });

  return ref.id;
}

export async function updateEcoMission(ecoMissionId, updates) {
  const ref = doc(db, COLLECTION, ecoMissionId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function toggleEcoMissionActive(ecoMissionId, isActive) {
  const ref = doc(db, COLLECTION, ecoMissionId);
  await updateDoc(ref, { isActive });
}

export async function getEcoMission(ecoMissionId) {
  const ref = doc(db, COLLECTION, ecoMissionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("EcoMission not found");
  return mapEcoMission(snap);
}

export async function getActiveEcoMissions() {
  // No orderBy to avoid requiring a composite index in Firestore
  const q = query(
    collection(db, COLLECTION),
    where("isActive", "==", true)
  );
  const snap = await getDocs(q);
  const now = Date.now();
  return snap.docs
    .map(mapEcoMission)
    .filter((ecoMission) => new Date(ecoMission.expiresAt).getTime() > now)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function subscribeToEcoMissionFeed(callback) {
  // No orderBy to avoid requiring a composite index — sort client-side instead
  const q = query(
    collection(db, COLLECTION),
    where("isActive", "==", true)
  );

  return onSnapshot(q, (snap) => {
    const now = Date.now();
    const ecoMissions = snap.docs
      .map(mapEcoMission)
      .filter((b) => new Date(b.expiresAt).getTime() > now)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const grouped = ecoMissions.reduce((acc, ecoMission) => {
      if (!acc[ecoMission.theme]) acc[ecoMission.theme] = [];
      acc[ecoMission.theme].push(ecoMission);
      return acc;
    }, {});

    callback({ ecoMissions, grouped });
  });
}

export function subscribeToAllEcoMissions(callback) {
  const q = query(
    collection(db, COLLECTION),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(mapEcoMission));
  });
}

export function isEcoMissionExpired(ecoMission) {
  return new Date(ecoMission.expiresAt) < new Date();
}

export function getTimeRemaining(expiresAt) {
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return "Expired";

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
