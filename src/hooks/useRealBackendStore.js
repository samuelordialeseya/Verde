import { useState, useEffect } from "react";
import { formatISO } from "date-fns";
import { subscribeToBountyFeed } from "../services/bounties";
import { subscribeToStudent, getLocalIdentity, createStudentIdentity, subscribeToLeaderboard } from "../services/students";
import { subscribeToTransactions, generateRedemptionToken } from "../services/wallet";
import { submitBountyProof, getStudentSubmissions } from "../services/submissions";

export function useRealBackendStore() {
  const [student, setStudent] = useState({ studentId: null, displayName: "", coinBalance: 0, totalEarned: 0 });
  const [bounties, setBounties] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [pendingRedemption, setPendingRedemption] = useState(null);

  useEffect(() => {
    // 1. Initialize Profile
    const local = getLocalIdentity();
    if (local) {
      setStudent(prev => ({ ...prev, studentId: local.studentId, displayName: local.displayName }));
    }

    // 2. Subscribe to Bounties
    const unsubBounties = subscribeToBountyFeed((feed) => {
      setBounties(feed.bounties);
    });

    // 3. Subscribe to Leaderboard
    const unsubLeaderboard = subscribeToLeaderboard(10, (topStudents) => {
      // Map to fit UI expectation:
      setLeaderboard(topStudents.map(s => ({
        id: s.id,
        displayName: s.displayName,
        totalEarned: s.totalEarned || 0,
        approvedCount: s.totalEarned / 25 // Rough mock for "approvedCount" as UI used it
      })));
    });

    return () => {
      unsubBounties();
      unsubLeaderboard();
    };
  }, []);

  useEffect(() => {
    if (!student.studentId) return;

    // 1. Subscribe to Live Student Balance
    const unsubStudent = subscribeToStudent(student.studentId, (data) => {
      setStudent(prev => ({ ...prev, ...data }));
    });

    // 2. Subscribe to Student Transactions
    const unsubTxns = subscribeToTransactions(student.studentId, (txns) => {
      setTransactions(txns);
    });

    // 3. Fetch submissions manually to check isClaimed (polling or one time is fine here)
    getStudentSubmissions(student.studentId).then(subs => {
      setSubmissions(subs);
    });

    // Check localStorage for any pending QR token state
    try {
      const pending = localStorage.getItem("verde-pending-redemption");
      if (pending) setPendingRedemption(JSON.parse(pending));
    } catch {}

    return () => {
      unsubStudent();
      unsubTxns();
    };
  }, [student.studentId]);

  const setDisplayName = async (name) => {
    const res = await createStudentIdentity(name);
    setStudent(prev => ({ ...prev, studentId: res.studentId, displayName: res.displayName }));
  };

  const isClaimed = (bountyId) => {
    return submissions.some((c) => c.bountyId === bountyId && c.verdict !== "rejected");
  };

  const submitBounty = async (bountyId, fileName) => {
    // Use a blank fake file since we don't have camera UI connected yet
    const placeholderFile = new File(["dummy"], fileName, { type: "image/jpeg" });
    
    // Call Real Backend Endpoint
    const result = await submitBountyProof(student.studentId, bountyId, placeholderFile);
    
    // Re-fetch submissions to accurately update claims limit
    getStudentSubmissions(student.studentId).then(setSubmissions);

    return {
      id: result.submissionId,
      bountyId,
      fileName,
      verdict: result.verdict,
      reason: result.reason,
      confidence: Math.round(result.confidence * 100) || 50,
      missingElements: result.missingElements || [],
    };
  };

  const createRedemptionToken = async (amount) => {
    if (pendingRedemption && pendingRedemption.status === "pending") {
      return { error: "You already have a pending QR token." };
    }
    if (amount < 10) return { error: "Minimum redemption is 10 coins." };
    if (amount > student.coinBalance) return { error: "Insufficient balance." };

    try {
      const tokenId = await generateRedemptionToken(student.studentId, amount);
      const token = {
        id: tokenId,
        studentId: student.studentId,
        displayName: student.displayName,
        amount,
        status: "pending",
        createdAt: formatISO(new Date()),
        expiresAt: Date.now() + 5 * 60 * 1000,
      };
      setPendingRedemption(token);
      localStorage.setItem("verde-pending-redemption", JSON.stringify(token));
      return token;
    } catch (err) {
       return { error: "Failed to create token. " + err.message };
    }
  };

  // Provide exactly what the UI originally destructured
  return {
    studentId: student.studentId,
    displayName: student.displayName,
    coinBalance: student.coinBalance,
    totalEarned: student.totalEarned,
    bounties,
    transactions,
    leaderboard,
    submissions,
    pendingRedemption,
    setDisplayName,
    isClaimed,
    submitBounty,
    createRedemptionToken
  };
}
