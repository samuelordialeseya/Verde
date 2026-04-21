import { formatISO } from "date-fns";
import { create } from "zustand";
import { demoTransactions, initialBounties, leaderboardSeed } from "../data/seedData";

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

const uid = () => Math.random().toString(36).slice(2, 10);
const isTokenExpired = (token) => Boolean(token?.expiresAt && Date.now() > token.expiresAt);

export const useAppStore = create((set, get) => ({
  studentId: null,
  displayName: "",
  coinBalance: 420,
  totalEarned: 890,
  bounties: initialBounties,
  claims: [],
  submissions: [],
  leaderboard: leaderboardSeed,
  transactions: demoTransactions,
  pendingRedemption: null,

  initialize: () => {
    const profile = ls.get("verde-profile", null);
    const claims = ls.get("verde-claims", []);
    const submissions = ls.get("verde-submissions", []);
    const transactions = ls.get("verde-transactions", demoTransactions);
    const wallet = ls.get("verde-wallet", { coinBalance: 420, totalEarned: 890 });
    const pending = ls.get("verde-pending-redemption", null);
    if (profile) {
      set({
        studentId: profile.studentId,
        displayName: profile.displayName,
        claims,
        submissions,
        transactions,
        coinBalance: wallet.coinBalance,
        totalEarned: wallet.totalEarned,
        pendingRedemption: pending,
      });
    } else {
      const next = {
        studentId: `st-${uid()}`,
        displayName: "",
      };
      ls.set("verde-profile", next);
      set({ studentId: next.studentId, claims, submissions, transactions, pendingRedemption: pending });
    }
  },

  setDisplayName: (displayName) => {
    const { studentId } = get();
    ls.set("verde-profile", { studentId, displayName });
    set({ displayName });
  },

  isClaimed: (bountyId) => {
    const { studentId, claims } = get();
    return claims.some((c) => c.studentId === studentId && c.bountyId === bountyId);
  },

  submitBounty: (bountyId, fileName) => {
    const state = get();
    if (state.isClaimed(bountyId)) {
      return { verdict: "rejected", reason: "Already completed for this bounty lifetime.", confidence: 100 };
    }
    const bounty = state.bounties.find((b) => b.id === bountyId);
    const roll = Math.random();
    const verdict = roll > 0.2 ? "approved" : roll > 0.1 ? "rejected" : "flagged";
    const confidence = verdict === "approved" ? 94 : verdict === "flagged" ? 71 : 42;
    const result = {
      id: `sub-${uid()}`,
      bountyId,
      fileName,
      verdict,
      reason:
        verdict === "approved"
          ? "Reusable container with drink visible in canteen setting."
          : verdict === "flagged"
            ? "Needs human review due to partial context."
            : "Missing required action context.",
      missingElements:
        verdict === "rejected" ? ["action in progress", "required setting context"] : [],
      confidence,
      submittedAt: formatISO(new Date()),
    };

    const nextSubmissions = [result, ...state.submissions];
    const updates = { submissions: nextSubmissions };

    if (verdict === "approved") {
      const claim = {
        id: `cl-${uid()}`,
        studentId: state.studentId,
        bountyId,
        submissionId: result.id,
        claimedAt: formatISO(new Date()),
      };
      const tx = {
        id: `tx-${uid()}`,
        type: "earned",
        amount: bounty.coinReward,
        description: `${bounty.title} Bounty`,
        timestamp: formatISO(new Date()),
      };
      const claimCount = bounty.claimCount + 1;
      updates.claims = [claim, ...state.claims];
      updates.coinBalance = state.coinBalance + bounty.coinReward;
      updates.totalEarned = state.totalEarned + bounty.coinReward;
      updates.bounties = state.bounties.map((b) => (b.id === bountyId ? { ...b, claimCount } : b));
      updates.transactions = [tx, ...state.transactions];
    }

    set(updates);
    ls.set("verde-claims", updates.claims || state.claims);
    ls.set("verde-submissions", nextSubmissions);
    ls.set("verde-transactions", updates.transactions || state.transactions);
    ls.set("verde-wallet", {
      coinBalance: updates.coinBalance ?? state.coinBalance,
      totalEarned: updates.totalEarned ?? state.totalEarned,
    });
    return result;
  },

  createRedemptionToken: (amount) => {
    const state = get();
    const pending = state.pendingRedemption;
    if (pending && pending.status === "pending" && !isTokenExpired(pending)) {
      return { error: "You already have a pending QR token." };
    }
    if (amount < 10) return { error: "Minimum redemption is 10 coins." };
    if (amount > state.coinBalance) return { error: "Insufficient balance." };

    const token = {
      id: `rdm-${uid()}`,
      studentId: state.studentId,
      displayName: state.displayName || "Student",
      amount,
      status: "pending",
      createdAt: formatISO(new Date()),
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
    set({ pendingRedemption: token });
    ls.set("verde-pending-redemption", token);
    return token;
  },

  consumeRedemptionToken: (tokenId) => {
    const state = get();
    const token = state.pendingRedemption;
    if (!token || token.id !== tokenId) return { ok: false, message: "Token not found.", errorType: "not_found" };
    if (isTokenExpired(token)) {
      const expiredToken = { ...token, status: "expired" };
      set({ pendingRedemption: expiredToken });
      ls.set("verde-pending-redemption", expiredToken);
      return { ok: false, message: "Token expired.", errorType: "expired", token: expiredToken };
    }
    if (token.status !== "pending") return { ok: false, message: "Token already redeemed.", errorType: "already_redeemed", token };
    if (state.coinBalance < token.amount) return { ok: false, message: "Insufficient student balance.", errorType: "low_balance", token };

    const nextTx = {
      id: `tx-${uid()}`,
      type: "redeemed",
      amount: token.amount,
      description: "Campus Voucher",
      timestamp: formatISO(new Date()),
    };
    const updatedToken = { ...token, status: "redeemed", redeemedAt: formatISO(new Date()) };
    set({
      coinBalance: state.coinBalance - token.amount,
      pendingRedemption: updatedToken,
      transactions: [nextTx, ...state.transactions],
    });
    ls.set("verde-pending-redemption", updatedToken);
    ls.set("verde-transactions", [nextTx, ...state.transactions]);
    ls.set("verde-wallet", { coinBalance: state.coinBalance - token.amount, totalEarned: state.totalEarned });
    return {
      ok: true,
      message: `${token.amount} coins redeemed - ${token.displayName} - P${Math.floor(token.amount / 10)} discount`,
      token: updatedToken,
    };
  },
}));
