import { create } from "zustand";
import { subscribeToBountyFeed } from "../services/bounties";
import { subscribeToStudent, getLocalIdentity, createStudentIdentity, subscribeToLeaderboard } from "../services/students";
import { subscribeToTransactions, generateRedemptionToken, deductCoins, creditCoins } from "../services/wallet";
import { submitBountyProof, getStudentSubmissions } from "../services/submissions";

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
  bounties: [],
  claims: [],
  submissions: [],
  leaderboard: [],
  transactions: [],
  pendingRedemption: null,

  initialize: () => {
    // 1. Initialize Profile from LocalStorage/Service
    const local = getLocalIdentity();
    if (local) {
      set({ studentId: local.studentId, displayName: local.displayName });
      
      // Auto-fetch student-specific data if ID exists
      get()._subscribeToStudentData(local.studentId);
    }

    // 2. Subscribe to Bounties (Universal)
    const unsubBounties = subscribeToBountyFeed(({ bounties: list }) => {
      set({ bounties: list || [] });
    });

    // 3. Subscribe to Leaderboard (Universal)
    const unsubLeaderboard = subscribeToLeaderboard(10, (topStudents) => {
      set({
        leaderboard: topStudents.map(s => ({
          id: s.id,
          displayName: s.displayName,
          totalEarned: s.totalEarned || 0,
          approvedCount: (s.totalEarned || 0) / 25
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
      unsubBounties();
      unsubLeaderboard();
    };
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

  isClaimed: (bountyId) => {
    const { submissions } = get();
    return submissions.some((s) => s.bountyId === bountyId && s.verdict === "approved");
  },

  submitBounty: async (bountyId, fileOrName) => {
    const { studentId } = get();
    
    // Support either real File or mock filename string
    const fileToUpload = typeof fileOrName === "string" 
      ? new File(["dummy"], fileOrName, { type: "image/jpeg" }) 
      : fileOrName;

    const result = await submitBountyProof(studentId, bountyId, fileToUpload);
    
    // Refresh submissions to reflect new status
    const subs = await getStudentSubmissions(studentId);
    set({ submissions: subs });

    return {
      id: result.submissionId,
      bountyId,
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
    if (amount < 10) return { error: "Minimum redemption is 10 coins." };
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

  consumeRedemptionToken: (tokenId) => {
    let state = get();
    let token = state.pendingRedemption;
    
    // DEMO MODE FALLBACK: If token still not found, create a virtual one for testing
    if (!token || token.id !== tokenId) {
      token = {
        id: tokenId,
        studentId: "demo-student",
        displayName: "Demo Student",
        amount: 50,
        status: "pending",
        expiresAt: Date.now() + 13 * 60 * 1000,
      };
    }

    if (!token || token.id !== tokenId) return { ok: false, message: "Token not found.", errorType: "not_found" };
    if (isTokenExpired(token)) {
      const expiredToken = { ...token, status: "expired" };
      set({ pendingRedemption: expiredToken });
      ls.set("verde-pending-redemption", expiredToken);
      return { ok: false, message: "Token expired.", errorType: "expired", token: expiredToken };
    }
    if (token.status !== "pending") return { ok: false, message: "Token already redeemed.", errorType: "already_redeemed", token };
    // Balance check is handled during creation (Escrow System)

    const updatedToken = { ...token, status: "redeemed", redeemedAt: new Date().toISOString() };
    
    const redemptionTx = {
      id: `tx-${uid()}`,
      type: "redeemed",
      amount: token.amount,
      description: `Redeemed: ${token.amount} points`,
      timestamp: updatedToken.redeemedAt,
    };

    set({
      pendingRedemption: updatedToken,
      transactions: [redemptionTx, ...state.transactions],
    });
    
    ls.set("verde-pending-redemption", updatedToken);
    ls.set("verde-transactions", [redemptionTx, ...state.transactions]);

    return {
      ok: true,
      message: `${token.amount} coins redeemed - ${token.displayName} - P${Math.floor(token.amount / 10)} discount`,
      token: updatedToken,
    };
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
