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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { creditCoins } from "./wallet";

const COLLECTION = "submissions";
const CLAIMS_COLLECTION = "claims";
const DEFAULT_AI_COOLDOWN_MS = 10 * 60 * 1000;
let aiRetryAfterMs = 0;

export const VERDICT = {
  APPROVED: "approved",
  REJECTED: "rejected",
  FLAGGED: "flagged",
};

export async function hasExistingClaim(studentId, ecoMissionId) {
  const q = query(
    collection(db, CLAIMS_COLLECTION),
    where("studentId", "==", studentId),
    where("ecoMissionId", "==", ecoMissionId)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

async function uploadSubmissionPhoto(studentId, ecoMissionId, photoFile) {
  if (!photoFile) {
    console.warn("No photo file provided; using dummy url for testing.");
    return "https://picsum.photos/400/300"; 
  }

  const timestamp = Date.now();
  const path = `submissions/${studentId}/${ecoMissionId}/${timestamp}.jpg`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, photoFile);
  return await getDownloadURL(storageRef);
}

async function callGeminiVerification(photoUrl, ecoMission) {
  if (Date.now() < aiRetryAfterMs) {
    return {
      verdict: VERDICT.FLAGGED,
      confidence: 0,
      reason: "AI verification is temporarily rate-limited. Sent for manual review.",
      isSuspicious: false,
      missingElements: [],
    };
  }

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const region = "asia-southeast1";
  const endpoint = import.meta.env.DEV
    ? "/api/verifyEcoAction"
    : `https://${region}-${projectId}.cloudfunctions.net/verifyEcoActionHttp`;
  const payload = {
    photoUrl,
    ecoMissionTitle: ecoMission.title,
    ecoMissionDescription: ecoMission.description,
    ecoMissionInstructions: ecoMission.instructions,
    aiVerificationHint: ecoMission.aiVerificationHint,
  };

  const requestOnce = async () => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  };

  const { res, data } = await requestOnce();

  // Never hard-fail submission on AI throttling: route to manual review.
  if (res.status === 429) {
    const retryAfterHeader = Number.parseInt(res.headers.get("retry-after") || "", 10);
    const retryAfterMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
      ? retryAfterHeader * 1000
      : DEFAULT_AI_COOLDOWN_MS;
    aiRetryAfterMs = Date.now() + retryAfterMs;

    return {
      verdict: VERDICT.FLAGGED,
      confidence: 0,
      reason: "AI verification is rate-limited right now. Sent for manual review.",
      isSuspicious: false,
      missingElements: [],
    };
  }

  if (!res.ok) throw new Error(data?.error || `Verification request failed (${res.status})`);
  return data;
}

export async function submitEcoMissionProof(studentId, ecoMissionId, photoFile) {
  const alreadyClaimed = await hasExistingClaim(studentId, ecoMissionId);
  if (alreadyClaimed) {
    throw new Error("ALREADY_CLAIMED");
  }

  const studentSnap = await getDoc(doc(db, "students", studentId));
  let student = studentSnap.exists() ? studentSnap.data() : null;

  if (!student) {
    // Recreate student if missing (e.g. after DB reset)
    const { getLocalIdentity, createStudentIdentity } = await import("./students");
    const local = getLocalIdentity();
    const name = local?.displayName || "Student";
    const res = await createStudentIdentity(name);
    student = { 
      studentId: res.studentId, 
      displayName: res.displayName,
      coinBalance: 0,
      totalEarned: 0
    };
  }

  const photoUrl = await uploadSubmissionPhoto(studentId, ecoMissionId, photoFile);
  const ecoMissionRef = doc(db, "ecoMissions", ecoMissionId);
  const ecoMissionSnap = await getDoc(ecoMissionRef);
  if (!ecoMissionSnap.exists()) throw new Error("ECOMISSION_NOT_FOUND");
  const ecoMission = ecoMissionSnap.data();

  const submissionRef = await addDoc(collection(db, COLLECTION), {
    studentId,
    studentName: student.displayName || "Student",
    studentAvatar: student.photoURL || null,
    ecoMissionId,
    ecoMissionTitle: ecoMission.title,
    theme: ecoMission.theme,
    sdgNumber: ecoMission.sdgNumber,
    sdgLabel: ecoMission.sdgLabel,
    coinsAwarded: 0,
    photoUrl,
    verdict: "pending",
    confidence: null,
    reason: null,
    isSuspicious: false,
    missingElements: [],
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
  });

  const submissionId = submissionRef.id;

  let geminiResult;
  try {
    geminiResult = await callGeminiVerification(photoUrl, ecoMission);
  } catch (err) {
    const detail = err?.message || err?.details || "AI verification failed";
    await updateDoc(submissionRef, { 
      verdict: VERDICT.FLAGGED, 
      reason: detail,
      isSuspicious: false,
      missingElements: []
    });
    return { submissionId, verdict: VERDICT.FLAGGED, confidence: null, reason: detail };
  }

  const { verdict, confidence, reason, isSuspicious, missingElements } = geminiResult;

  await updateDoc(submissionRef, {
    verdict,
    confidence,
    reason,
    isSuspicious,
    missingElements,
    coinsAwarded: verdict === VERDICT.APPROVED ? ecoMission.coinsReward : 0,
    reviewedAt: new Date().toISOString(),
  });

  if (verdict === VERDICT.APPROVED) {
    await addDoc(collection(db, CLAIMS_COLLECTION), {
      studentId,
      ecoMissionId,
      submissionId,
      claimedAt: new Date().toISOString(),
    });

    await creditCoins(studentId, submissionId, ecoMission.coinsReward, {
      type: "ecoMission_reward",
      label: `EcoMission: ${ecoMission.title}`,
      sdgNumber: ecoMission.sdgNumber,
    });

    await updateDoc(ecoMissionRef, {
      submissionCount: (ecoMission.submissionCount || 0) + 1,
    });
  }

  return {
    submissionId,
    verdict,
    confidence,
    reason,
    coinsAwarded: verdict === VERDICT.APPROVED ? ecoMission.coinsReward : 0,
  };
}

export async function adminApproveSubmission(submissionId, adminNote = "") {
  const ref = doc(db, COLLECTION, submissionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Submission not found");

  const sub = snap.data();
  if (sub.verdict !== VERDICT.FLAGGED) throw new Error("Only flagged submissions can be manually reviewed");

  const ecoMissionSnap = await getDoc(doc(db, "ecoMissions", sub.ecoMissionId));
  const ecoMission = ecoMissionSnap.data();

  await updateDoc(ref, {
    verdict: VERDICT.APPROVED,
    coinsAwarded: ecoMission.coinsReward,
    adminNote,
    reviewedAt: new Date().toISOString(),
  });

  await addDoc(collection(db, CLAIMS_COLLECTION), {
    studentId: sub.studentId,
    ecoMissionId: sub.ecoMissionId,
    submissionId,
    claimedAt: new Date().toISOString(),
  });

  await creditCoins(sub.studentId, submissionId, ecoMission.coinsReward, {
    type: "ecoMission_reward",
    label: `EcoMission: ${ecoMission.title}`,
    sdgNumber: ecoMission.sdgNumber,
  });
}

export async function adminRejectSubmission(submissionId, adminNote = "") {
  const ref = doc(db, COLLECTION, submissionId);
  await updateDoc(ref, {
    verdict: VERDICT.REJECTED,
    coinsAwarded: 0,
    adminNote,
    reviewedAt: new Date().toISOString(),
  });
}

export function subscribeToFlaggedSubmissions(callback) {
  const q = query(
    collection(db, COLLECTION),
    where("verdict", "==", VERDICT.FLAGGED),
    orderBy("submittedAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function getStudentSubmissions(studentId) {
  const q = query(
    collection(db, COLLECTION),
    where("studentId", "==", studentId),
    orderBy("submittedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
