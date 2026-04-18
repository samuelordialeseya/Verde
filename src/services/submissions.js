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
import { httpsCallable } from "firebase/functions";
import { db, storage, functions } from "../lib/firebase";
import { creditCoins } from "./wallet";

const COLLECTION = "submissions";
const CLAIMS_COLLECTION = "claims";

export const VERDICT = {
  APPROVED: "approved",
  REJECTED: "rejected",
  FLAGGED: "flagged",
};

const AUTO_APPROVE_THRESHOLD = 0.75;
const AUTO_REJECT_THRESHOLD = 0.40;

export async function hasExistingClaim(studentId, bountyId) {
  const q = query(
    collection(db, CLAIMS_COLLECTION),
    where("studentId", "==", studentId),
    where("bountyId", "==", bountyId)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

async function uploadSubmissionPhoto(studentId, bountyId, photoFile) {
  const timestamp = Date.now();
  const path = `submissions/${studentId}/${bountyId}/${timestamp}.jpg`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, photoFile);
  return await getDownloadURL(storageRef);
}

async function callGeminiVerification(photoUrl, aiVerificationHint) {
  const verifyFn = httpsCallable(functions, "verifyEcoAction");

  const result = await verifyFn({
    photoUrl,
    hint: aiVerificationHint,
  });

  return result.data;
}

export async function submitBountyProof(studentId, bountyId, photoFile) {
  const alreadyClaimed = await hasExistingClaim(studentId, bountyId);
  if (alreadyClaimed) {
    throw new Error("ALREADY_CLAIMED");
  }

  const bountyRef = doc(db, "bounties", bountyId);
  const bountySnap = await getDoc(bountyRef);
  if (!bountySnap.exists()) throw new Error("Bounty not found");
  const bounty = bountySnap.data();

  const photoUrl = await uploadSubmissionPhoto(studentId, bountyId, photoFile);

  const submissionRef = await addDoc(collection(db, COLLECTION), {
    studentId,
    bountyId,
    bountyTitle: bounty.title,
    theme: bounty.theme,
    sdgNumber: bounty.sdgNumber,
    sdgLabel: bounty.sdgLabel,
    coinsAwarded: 0,
    photoUrl,
    verdict: "pending",
    confidence: null,
    reason: null,
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
  });

  const submissionId = submissionRef.id;

  let geminiResult;
  try {
    geminiResult = await callGeminiVerification(photoUrl, bounty.aiVerificationHint);
  } catch (err) {
    await updateDoc(submissionRef, { verdict: VERDICT.FLAGGED, reason: "AI verification failed" });
    return { submissionId, verdict: VERDICT.FLAGGED, confidence: null, reason: "AI verification failed" };
  }

  const { approved, confidence, reason } = geminiResult;

  let verdict;
  if (approved && confidence >= AUTO_APPROVE_THRESHOLD) {
    verdict = VERDICT.APPROVED;
  } else if (!approved && confidence >= AUTO_REJECT_THRESHOLD) {
    verdict = VERDICT.REJECTED;
  } else {
    verdict = VERDICT.FLAGGED;
  }

  await updateDoc(submissionRef, {
    verdict,
    confidence,
    reason,
    coinsAwarded: verdict === VERDICT.APPROVED ? bounty.coinsReward : 0,
    reviewedAt: new Date().toISOString(),
  });

  if (verdict === VERDICT.APPROVED) {
    await addDoc(collection(db, CLAIMS_COLLECTION), {
      studentId,
      bountyId,
      submissionId,
      claimedAt: new Date().toISOString(),
    });

    await creditCoins(studentId, submissionId, bounty.coinsReward, {
      type: "bounty_reward",
      label: `Bounty: ${bounty.title}`,
      sdgNumber: bounty.sdgNumber,
    });

    await updateDoc(bountyRef, {
      submissionCount: (bounty.submissionCount || 0) + 1,
    });
  }

  return {
    submissionId,
    verdict,
    confidence,
    reason,
    coinsAwarded: verdict === VERDICT.APPROVED ? bounty.coinsReward : 0,
  };
}

export async function adminApproveSubmission(submissionId, adminNote = "") {
  const ref = doc(db, COLLECTION, submissionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Submission not found");

  const sub = snap.data();
  if (sub.verdict !== VERDICT.FLAGGED) throw new Error("Only flagged submissions can be manually reviewed");

  const bountySnap = await getDoc(doc(db, "bounties", sub.bountyId));
  const bounty = bountySnap.data();

  await updateDoc(ref, {
    verdict: VERDICT.APPROVED,
    coinsAwarded: bounty.coinsReward,
    adminNote,
    reviewedAt: new Date().toISOString(),
  });

  await addDoc(collection(db, CLAIMS_COLLECTION), {
    studentId: sub.studentId,
    bountyId: sub.bountyId,
    submissionId,
    claimedAt: new Date().toISOString(),
  });

  await creditCoins(sub.studentId, submissionId, bounty.coinsReward, {
    type: "bounty_reward",
    label: `Bounty: ${bounty.title}`,
    sdgNumber: bounty.sdgNumber,
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
