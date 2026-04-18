import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";

const SUBMISSIONS = "submissions";
const STUDENTS = "students";

const SDG_LABELS = {
  11: "Sustainable Cities",
  12: "Responsible Consumption",
  13: "Climate Action",
};

export function subscribeToDashboardStats(callback) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, SUBMISSIONS),
    where("verdict", "==", "approved"),
    where("submittedAt", ">=", todayStart.toISOString())
  );

  return onSnapshot(q, (snap) => {
    const submissions = snap.docs.map((d) => d.data());

    const totalActions = submissions.length;
    const activeStudents = new Set(submissions.map((s) => s.studentId)).size;
    const coinsAwarded = submissions.reduce((sum, s) => sum + (s.coinsAwarded || 0), 0);

    callback({ totalActions, activeStudents, coinsAwarded });
  });
}

export function subscribeToSDGBreakdown(callback) {
  const q = query(
    collection(db, SUBMISSIONS),
    where("verdict", "==", "approved")
  );

  return onSnapshot(q, (snap) => {
    const breakdown = {};

    snap.docs.forEach((d) => {
      const { sdgNumber } = d.data();
      if (sdgNumber) {
        breakdown[sdgNumber] = (breakdown[sdgNumber] || 0) + 1;
      }
    });

    const formatted = Object.entries(breakdown).map(([num, count]) => ({
      sdgNumber: parseInt(num),
      label: SDG_LABELS[num] || `SDG ${num}`,
      count,
    }));

    callback(formatted.sort((a, b) => b.count - a.count));
  });
}

export function subscribeToLeaderboard(callback, topN = 10) {
  const q = query(
    collection(db, STUDENTS),
    orderBy("totalEarned", "desc"),
    limit(topN)
  );

  return onSnapshot(q, (snap) => {
    const leaderboard = snap.docs.map((d, index) => ({
      rank: index + 1,
      ...d.data(),
    }));
    callback(leaderboard);
  });
}

export async function getThemeBreakdown() {
  const q = query(
    collection(db, SUBMISSIONS),
    where("verdict", "==", "approved")
  );
  const snap = await getDocs(q);

  const breakdown = {};
  snap.docs.forEach((d) => {
    const { theme } = d.data();
    if (theme) breakdown[theme] = (breakdown[theme] || 0) + 1;
  });

  return breakdown;
}

export async function getCSVExportData() {
  const q = query(
    collection(db, SUBMISSIONS),
    where("verdict", "in", ["approved", "rejected"]),
    orderBy("submittedAt", "desc")
  );
  const snap = await getDocs(q);

  const studentIds = [...new Set(snap.docs.map((d) => d.data().studentId))];
  const studentMap = {};

  if (studentIds.length > 0) {
    const studentSnaps = await getDocs(
      query(collection(db, STUDENTS), where("studentId", "in", studentIds.slice(0, 30)))
    );
    studentSnaps.docs.forEach((d) => {
      studentMap[d.data().studentId] = d.data().displayName;
    });
  }

  return snap.docs.map((d) => {
    const s = d.data();
    return {
      date: new Date(s.submittedAt).toLocaleDateString("en-PH"),
      student_name: studentMap[s.studentId] || "Unknown",
      bounty_title: s.bountyTitle,
      theme: s.theme,
      sdg_number: s.sdgNumber,
      sdg_label: s.sdgLabel,
      coins_awarded: s.coinsAwarded,
      verdict: s.verdict,
    };
  });
}

export function downloadCSV(rows) {
  import("papaparse").then(({ default: Papa }) => {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `verde-sustainability-report-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  });
}

export async function exportSustainabilityReport() {
  const rows = await getCSVExportData();
  if (rows.length === 0) throw new Error("No data to export");
  downloadCSV(rows);
  return rows.length;
}
