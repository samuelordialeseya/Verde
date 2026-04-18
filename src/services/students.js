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

export function getLocalIdentity() {
  const studentId = localStorage.getItem("verde_student_id");
  const displayName = localStorage.getItem("verde_display_name");
  if (!studentId || !displayName) return null;
  return { studentId, displayName };
}

export async function createStudentIdentity(displayName) {
  const studentId = uuidv4();

  localStorage.setItem("verde_student_id", studentId);
  localStorage.setItem("verde_display_name", displayName);

  await setDoc(doc(db, COLLECTION, studentId), {
    studentId,
    displayName,
    coinBalance: 0,
    totalEarned: 0,
    createdAt: new Date().toISOString(),
  });

  return { studentId, displayName };
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
