import { create } from "zustand";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { subscribeToEcoMissionFeed } from "../services/bounties";
import { subscribeToStudent, getLocalIdentity, createStudentIdentity, subscribeToLeaderboard } from "../services/students";
import { subscribeToTransactions, generateRedemptionToken, deductCoins, creditCoins, processRedemption, getRedemptionToken } from "../services/wallet";
import { submitEcoMissionProof, getStudentSubmissions } from "../services/submissions";

const ls = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

const uid = () => Math.random().toString(36).substring(2, 9);
const isTokenExpired = (token) => Boolean(token?.expiresAt && Date.now() > token.expiresAt);

export const useAppStore = create((set, get) => ({
  studentId: null,
  displayName: "",
  coinBalance: 0,
  totalEarned: 0,
  ecoMissions: [],
  claims: [],
  submissions: [],
  allSubmissions: [],
  leaderboard: [],
  transactions: [],
  pendingRedemption: null,

  initialize: () => {
    // 1. Initialize Profile from LocalStorage/Service
    const local = getLocalIdentity();
    if (local) {
      set({ studentId: local.studentId, displayName: local.displayName });
      
      // Ensure the identity exists in Firestore (handle DB resets/stale sessions)
      createStudentIdentity(local.displayName).catch(console.error);

      // Auto-fetch student-specific data
      get()._subscribeToStudentData(local.studentId);
    }

    // 2. Subscribe to EcoMissions (Universal)
    const unsubEcoMissions = subscribeToEcoMissionFeed(({ ecoMissions: list }) => {
      set({ ecoMissions: list || [] });
    });

    // 3. Subscribe to Leaderboard (Universal)
    const unsubLeaderboard = subscribeToLeaderboard(10, (topStudents) => {
      set({
        leaderboard: topStudents.map(s => ({
          id: s.id,
          displayName: s.displayName,
          points: s.totalEarned || 0,
          totalEarned: s.totalEarned || 0,
          photoURL: s.photoURL || null,
          approvedCount: s.approvedCount || Math.floor((s.totalEarned || 0) / 100),
          submissionsCount: s.submissionCount || Math.floor((s.totalEarned || 0) / 100)
        }))
      });
    });

    // Handle Cross-tab sync for UI items like pending redemption
    window.addEventListener("storage", (e) => {
      console.log("Storage Sync Event:", e.key);
      if (e.key === "verde-pending-redemption") {
        const val = JSON.parse(e.newValue);
        set({ pendingRedemption: val });
        // If it was just redeemed, maybe show a success state
        if (val?.status === "redeemed") {
          console.log("🎉 Token was redeemed in another tab!");
        }
      }
      if (e.key === "verde-wallet") {
        const wallet = JSON.parse(e.newValue);
        if (wallet) set({ coinBalance: wallet.coinBalance });
      }
      if (e.key === "verde-transactions") {
        const localTxns = JSON.parse(e.newValue) || [];
        const currentTxns = get().transactions;
        // Merge strategy: keep unique IDs, prioritize local for demo
        const merged = [...localTxns, ...currentTxns.filter(t => !localTxns.find(lt => lt.id === t.id))];
        set({ transactions: merged.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)) });
      }
    });

    return () => {
      unsubEcoMissions();
      unsubLeaderboard();
    };
  },

  adminInitialize: () => {
    // Subscribe to ALL submissions for the admin dashboard
    const unsubAllSubmissions = onSnapshot(
      query(collection(db, "submissions"), orderBy("submittedAt", "desc")),
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        set({ allSubmissions: list });
      }
    );

    // Subscribe to ALL claims (if needed for global stats)
    const unsubAllClaims = onSnapshot(collection(db, "claims"), (snap) => {
      set({ claims: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
    });

    return () => {
      unsubAllSubmissions();
      unsubAllClaims();
    };
  },

  approveSubmission: async (submissionId, note) => {
    try {
      const { adminApproveSubmission } = await import("../services/submissions");
      await adminApproveSubmission(submissionId, note);
    } catch (err) {
      console.error("Failed to approve:", err);
      throw err;
    }
  },

  rejectSubmission: async (submissionId, note) => {
    try {
      const { adminRejectSubmission } = await import("../services/submissions");
      await adminRejectSubmission(submissionId, note);
    } catch (err) {
      console.error("Failed to reject:", err);
      throw err;
    }
  },

  _subscribeToStudentData: (studentId) => {
    if (!studentId) return;

    // 1. Live Student Data
    const unsubStudent = subscribeToStudent(studentId, (data) => {
      if (data) set({ ...data });
    });

    // 2. Live Transactions
    const unsubTxns = subscribeToTransactions(studentId, (fbTxns) => {
      const localTxns = ls.get("verde-transactions", []);
      // Merge Firebase transactions with local "demo" transactions
      const merged = [...localTxns, ...fbTxns.filter(t => !localTxns.find(lt => lt.id === t.id))];
      set({ transactions: merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) });
    });

    // 3. Initial Submissions load
    getStudentSubmissions(studentId).then(subs => {
      set({ submissions: subs });
    });

    // Check for local QR state
    const pending = ls.get("verde-pending-redemption", null);
    if (pending) set({ pendingRedemption: pending });
  },

  setDisplayName: async (displayName) => {
    const res = await createStudentIdentity(displayName);
    set({ studentId: res.studentId, displayName: res.displayName });
    get()._subscribeToStudentData(res.studentId);
  },

  isClaimed: (ecoMissionId) => {
    const { submissions } = get();
    return submissions.some((s) => s.ecoMissionId === ecoMissionId && s.verdict === "approved");
  },

  submitEcoMission: async (ecoMissionId, fileOrName) => {
    const { studentId } = get();
    
    // Support either real File or mock filename string
    const fileToUpload = typeof fileOrName === "string" 
      ? new File(["dummy"], fileOrName, { type: "image/jpeg" }) 
      : fileOrName;

    const result = await submitEcoMissionProof(studentId, ecoMissionId, fileToUpload);
    
    // Refresh submissions to reflect new status
    const subs = await getStudentSubmissions(studentId);
    set({ submissions: subs });

    return {
      id: result.submissionId,
      ecoMissionId,
      fileName: fileToUpload.name,
      verdict: result.verdict,
      reason: result.reason,
      confidence: Math.round(result.confidence * 100) || 50,
      missingElements: result.missingElements || [],
    };
  },

  createRedemptionToken: async (amount) => {
    const { studentId, displayName, pendingRedemption, coinBalance } = get();
    if (pendingRedemption && pendingRedemption.status === "pending" && !isTokenExpired(pendingRedemption)) {
      return { error: "You already have a pending QR token." };
    }
    if (amount < 10) return { error: "Minimum redemption is 10 Leaves." };
    if (amount > coinBalance) return { error: "Insufficient balance." };

    try {
      const tokenId = await generateRedemptionToken(studentId, amount);
      console.log("Real Firebase Token Generated:", tokenId);

      // Perform REAL Firebase Escrow: Deduct coins from DB immediately
      await deductCoins(studentId, amount, tokenId);

      const token = {
        id: tokenId,
        studentId,
        displayName: displayName || "Student",
        amount,
        status: "pending",
        createdAt: new Date().toISOString(),
        expiresAt: Date.now() + 13 * 60 * 1000,
      };

      set({ pendingRedemption: token });
      ls.set("verde-pending-redemption", token);
      return token;
    } catch (err) {
      return { error: "Failed to create token. " + err.message };
    }
  },

  consumeRedemptionToken: async (tokenId, vendorId = "generic-vendor") => {
    try {
      const token = await getRedemptionToken(tokenId);
      
      if (!token) return { ok: false, message: "Token not found.", errorType: "not_found" };
      
      if (new Date(token.expiresAt) < new Date()) {
        return { ok: false, message: "Token expired.", errorType: "expired", token };
      }
      
      if (token.isRedeemed) {
        return { ok: false, message: "Token already redeemed.", errorType: "already_redeemed", token };
      }

      const result = await processRedemption(tokenId, vendorId);
      
      const updatedToken = { 
        ...token, 
        status: "redeemed", 
        isRedeemed: true,
        redeemedAt: result.redeemedAt 
      };

      // If we are the student who owns the token, update local state
      const { studentId } = get();
      if (token.studentId === studentId) {
        set({ pendingRedemption: updatedToken });
        ls.set("verde-pending-redemption", updatedToken);
      }

      return {
        ok: true,
        message: `${token.coinsToRedeem} coins redeemed - ${token.displayName} - P${result.pesoEquivalent} discount`,
        token: updatedToken,
      };
    } catch (err) {
      console.error("Redemption error:", err);
      return { ok: false, message: err.message, errorType: "system_error" };
    }
  },

  clearPendingRedemption: () => {
    const state = get();
    const token = state.pendingRedemption;
    console.log("Dismissing Token:", token);
    
    let nextState = { pendingRedemption: null };

    // If it was pending (escrowed), refund the coins in Firestore
    if (token && token.status === "pending") {
      creditCoins(state.studentId, `refund-${token.id}`, token.amount, {
        type: "earned",
        label: "Voucher Refund (Dismissed)"
      });
    }

    set({ pendingRedemption: null });
    ls.set("verde-pending-redemption", null);
  },
}));
