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

const COLLECTION = "bounties";

export const THEMES = ["Canteen", "Energy", "Waste", "Transport", "Campus"];
export const SDGS = [
  { number: 11, label: "Sustainable Cities and Communities" },
  { number: 12, label: "Responsible Consumption and Production" },
  { number: 13, label: "Climate Action" },
];

export async function createBounty({
  title,
  description,
  theme,
  sdgNumber,
  coinsReward,
  expiresAt,
  aiVerificationHint,
}) {
  const sdg = SDGS.find((s) => s.number === sdgNumber);
  if (!sdg) throw new Error(`Invalid SDG number: ${sdgNumber}`);

  const ref = await addDoc(collection(db, COLLECTION), {
    title,
    description,
    theme,
    sdgNumber,
    sdgLabel: sdg.label,
    coinsReward,
    expiresAt,
    aiVerificationHint,
    isActive: true,
    createdAt: new Date().toISOString(),
    submissionCount: 0,
  });

  return ref.id;
}

export async function updateBounty(bountyId, updates) {
  const ref = doc(db, COLLECTION, bountyId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function toggleBountyActive(bountyId, isActive) {
  const ref = doc(db, COLLECTION, bountyId);
  await updateDoc(ref, { isActive });
}

export async function getBounty(bountyId) {
  const ref = doc(db, COLLECTION, bountyId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Bounty not found");
  return { id: snap.id, ...snap.data() };
}

export async function getActiveBounties() {
  const q = query(
    collection(db, COLLECTION),
    where("isActive", "==", true),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function subscribeToBountyFeed(callback) {
  const q = query(
    collection(db, COLLECTION),
    where("isActive", "==", true),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const now = new Date();
    const bounties = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((b) => new Date(b.expiresAt) > now);

    const grouped = bounties.reduce((acc, bounty) => {
      if (!acc[bounty.theme]) acc[bounty.theme] = [];
      acc[bounty.theme].push(bounty);
      return acc;
    }, {});

    callback({ bounties, grouped });
  });
}

export function subscribeToAllBounties(callback) {
  const q = query(
    collection(db, COLLECTION),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function isBountyExpired(bounty) {
  return new Date(bounty.expiresAt) < new Date();
}

export function getTimeRemaining(expiresAt) {
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return "Expired";

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
