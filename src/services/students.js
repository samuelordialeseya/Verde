import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { v4 as uuidv4 } from "uuid";

const COLLECTION = "students";
const STUDENT_ID_KEY = "verde_student_id";
const DISPLAY_NAME_KEY = "verde_display_name";

function normalizeDisplayName(displayName) {
  return String(displayName || "").trim().replace(/\s+/g, " ");
}

function buildStudentRecord(studentId, displayName) {
  const joinedAt = new Date().toISOString();
  return {
    id: studentId,
    studentId,
    displayName,
    coinBalance: 0,
    totalEarned: 0,
    joinedAt,
    // Kept for backward compatibility with existing queries/UI.
    createdAt: joinedAt,
  };
}

export function getLocalIdentity() {
  const studentId = localStorage.getItem(STUDENT_ID_KEY);
  const displayName = localStorage.getItem(DISPLAY_NAME_KEY);
  if (!studentId || !displayName) return null;
  return { studentId, displayName };
}

export async function createStudentIdentity(displayName) {
  const normalizedName = normalizeDisplayName(displayName);
  if (!normalizedName) {
    throw new Error("Display name is required");
  }

  const existingIdentity = getLocalIdentity();
  const studentId = existingIdentity?.studentId || uuidv4();

  localStorage.setItem(STUDENT_ID_KEY, studentId);
  localStorage.setItem(DISPLAY_NAME_KEY, normalizedName);

  const ref = doc(db, COLLECTION, studentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, buildStudentRecord(studentId, normalizedName));
  } else if (snap.data()?.displayName !== normalizedName) {
    await updateDoc(ref, { displayName: normalizedName });
  }

  return { studentId, displayName: normalizedName };
}

export async function getStudent(studentId) {
  const ref = doc(db, COLLECTION, studentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Student not found");
  return snap.data();
}

export function subscribeToStudent(studentId, callback) {
  const ref = doc(db, COLLECTION, studentId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) callback(snap.data());
  });
}

export async function updateStudentBalance(studentId, newBalance, totalEarned) {
  const ref = doc(db, COLLECTION, studentId);
  await updateDoc(ref, {
    coinBalance: newBalance,
    totalEarned,
  });
}

import { collection, query, orderBy, limit } from "firebase/firestore";

export function subscribeToLeaderboard(limitCount = 10, callback) {
  const q = query(
    collection(db, COLLECTION),
    orderBy("totalEarned", "desc"),
    limit(limitCount)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(doc => doc.data()));
  });
}
