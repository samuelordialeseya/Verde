import { useEffect, useMemo, useState } from "react";
import { QRCode } from "react-qr-code";
import { format, formatDistanceToNowStrict } from "date-fns";
import PhoneFrame from "../components/PhoneFrame";
import BottomNav from "../components/BottomNav";
import NameModal from "../components/NameModal";
import { useAppStore } from "../context/appStore";
import { fetchGeminiVerdictSentence } from "../services/geminiReason";

const tabs = ["All", "Canteen", "Energy", "Waste"];

const hasGeminiKey = true;

function getThemeStyles(theme) {
  const t = (theme || "").toLowerCase();
  if (t === "canteen") return { stripe: "bg-[#f28c28]", pill: "bg-[#ffe8d4] text-[#c45c12]" };
  if (t === "energy") return { stripe: "bg-[#1aa8a0]", pill: "bg-[#dff8f5] text-[#0b7f77]" };
  if (t === "waste") return { stripe: "bg-[#4a90d9]", pill: "bg-[#e3f0ff] text-[#2563ad]" };
  return { stripe: "bg-zinc-300", pill: "bg-zinc-100 text-zinc-600" };
}

function ActivityIcon({ tx }) {
  if (tx.type === "redeemed") {
    return (
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e8f7ee] text-[18px]" aria-hidden>
        🏪
      </span>
    );
  }
  if (/waste|sort|segregat/i.test(tx.description)) {
    return (
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e6fff0] text-[18px]" aria-hidden>
        ♻️
      </span>
    );
  }
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e6fff0] text-[18px]" aria-hidden>
      🍃
    </span>
  );
}

function BountyCard({ theme, children }) {
  const ts = getThemeStyles(theme);
  return (
    <article className="flex overflow-hidden rounded-3xl border border-[#edf1f3] bg-white shadow-[0_6px_18px_rgba(13,28,45,0.06)]">
      <div className={`w-1.5 shrink-0 rounded-l-[inherit] ${ts.stripe}`} aria-hidden />
      <div className="min-w-0 flex-1 p-3">{children}</div>
    </article>
  );
}

function StudentPage() {
  const store = useAppStore();
  const [activeScreen, setActiveScreen] = useState("home");
  const [themeTab, setThemeTab] = useState("All");
  const [selectedBounty, setSelectedBounty] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [result, setResult] = useState(null);

  // Countdown timer logic
  useEffect(() => {
    if (!store.pendingRedemption) return;
    const interval = setInterval(() => {
      const remaining = store.pendingRedemption.expiresAt - Date.now();
      if (remaining <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [store.pendingRedemption]);

  const bounties = useMemo(() => {
    const list = store.bounties || [];
    if (!Array.isArray(list)) return [];
    const base = list.filter((b) => b.isActive);
    return themeTab === "All" ? base : base.filter((b) => b.theme === themeTab.toLowerCase());
  }, [store.bounties, themeTab]);

  const leaderboard = useMemo(() => {
    const list = store.leaderboard || [];
    if (!Array.isArray(list)) return [];
    return list.slice().sort((a, b) => b.totalEarned - a.totalEarned);
  }, [store.leaderboard]);

  const topContributors = useMemo(
    () =>
      leaderboard.slice(0, 3).map((e) => ({
        name: e.displayName,
        points: `${e.totalEarned.toLocaleString()} pts`,
      })),
    [leaderboard]
  );

  const podiumSlots = useMemo(() => {
    if (leaderboard.length < 3) return leaderboard;
    return [leaderboard[1], leaderboard[0], leaderboard[2]];
  }, [leaderboard]);

  const submit = async (bounty) => {
    if (!selectedFile) {
      setError("Please select a photo first.");
      return;
    }
    if (!bounty) {
      setError("Please select a bounty first.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await store.submitBounty(bounty.id, selectedFile);
      if (!response || response.error) {
        setError(response?.error || "Submission failed.");
        setIsSubmitting(false);
        return;
      }

      setResult({ ...response, geminiReason: response.reason, geminiLoading: true });
      setActiveScreen("result");

      // Flavoring the reason with Gemini
      const geminiReason = await fetchGeminiVerdictSentence({
        bountyTitle: bounty.title,
        verdict: response.verdict,
        confidence: response.confidence,
        baseReason: response.reason,
      });

      setResult((prev) =>
        prev && prev.id === response.id ? { ...prev, geminiReason, geminiLoading: false } : prev
      );

      // Cleanup submission state
      setIsSubmitting(false);
      setSelectedFile(null);
      setPreviewUrl(null);

    } catch (err) {
      console.error("Submit failed:", err);
      let msg = err.message;
      if (msg.includes("functions/not-found")) {
        msg = "Cloud Function not found. Please ensure your backend is deployed.";
      } else if (msg.includes("storage/unauthorized") || msg.includes("storage/retry-limit-exceeded")) {
        msg = "Storage permission denied. Please check your storage.rules.";
      } else if (msg.includes("ALREADY_CLAIMED")) {
        msg = "You have already submitted a claim for this bounty.";
      }
      setError("Submission Failed: " + msg);
      setIsSubmitting(false);
    }
  };

  const createQR = async () => {
    if (!selectedVoucher) {
      setError("Please select a voucher first.");
      return;
    }
    const token = await store.createRedemptionToken(selectedVoucher.amount);
    if (token.error) {
      setError(token.error);
    } else {
      setError("");
    }
  };

  const dismissQR = () => {
    store.clearPendingRedemption();
    setSelectedVoucher(null);
    setError("");
  };

  const allBounties = useMemo(() => {
    const list = store.bounties || [];
    return Array.isArray(list) ? list : [];
  }, [store.bounties]);

  const handleNavSelect = (item) => {
    if (item === "Home") setActiveScreen("home");
    if (item === "Bounties") setActiveScreen("bounties");
    if (item === "Wallet") setActiveScreen("wallet");
    if (item === "Rankings") setActiveScreen("leaderboard");
  };

  const isYouRow = (displayName) =>
    (store.displayName && displayName === store.displayName) ||
    (!store.displayName && displayName === "Alex Mercer");

  const captureTips = useMemo(() => {
    const tips = [];
    if (selectedBounty?.instructions) tips.push(selectedBounty.instructions);
    if (selectedBounty?.aiVerificationHint) tips.push(selectedBounty.aiVerificationHint);
    tips.push("Take the photo while doing the action, not after.");
    tips.push("Include campus context (canteen/classroom/bin area) in frame.");
    return tips;
  }, [selectedBounty]);

  return (
    <main className="min-h-screen bg-[#1a1d23] p-0 sm:p-4 font-sans text-zinc-900">
      {!store.displayName && <NameModal onSave={store.setDisplayName} />}
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-start justify-center gap-0 sm:gap-6">
        <PhoneFrame>
          <div className="flex h-screen sm:h-[640px] flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between border-b border-[#edf1f3] px-4 py-3">
            <div className="text-xl font-semibold text-[#00a15e]">☰ Verde</div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#d8f7e7] px-3 py-0.5 text-xs font-semibold text-[#087f46]">
                $ {store.coinBalance}
              </span>
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#0b6679] text-[11px] font-semibold text-white">
                {store.displayName?.[0] || "U"}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {activeScreen === "home" && (
            <div className="space-y-4 px-4 pt-4 pb-3">
              <h1 className="text-[25px] font-semibold leading-[0.95] tracking-[-0.03em] text-[#1b1d22]">
                Good morning,
                <br />
                <span className="text-[#008b4e]">{store.displayName || "Username"}</span>
              </h1>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-[20px] font-semibold leading-none tracking-[-0.02em] text-[#1d2025]">Active Bounties</h2>
                  <span className="rounded-full bg-[#0f8f4d] px-2 py-1 text-[9px] font-semibold text-white">{bounties.length} available</span>
                </div>
                <div className="scrollbar-hide mb-3 flex gap-2 overflow-x-auto pb-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setThemeTab(tab)}
                      className={`rounded-full px-4 py-1.5 text-[10px] font-semibold ${themeTab === tab ? "bg-[#007f43] text-white" : "bg-[#edf1f3] text-[#67727b]"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {bounties.map((b) => {
                    const done = store.isClaimed(b.id);
                    const ts = getThemeStyles(b.theme);
                    return (
                      <BountyCard key={b.id} theme={b.theme}>
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex gap-1 text-[9px] font-semibold">
                            <span className={`rounded-full px-2 py-1 ${ts.pill}`}>{b.theme.toUpperCase()}</span>
                            <span className="rounded-full bg-[#ebeff3] px-2 py-1 text-[#61707a]">SDG {b.sdgTag}</span>
                          </div>
                          <div className="rounded-full border border-[#dce5e1] px-2 py-1 text-[10px] font-semibold text-[#4d6c62]">
                            {formatDistanceToNowStrict(new Date(b.expiresAt))} left
                          </div>
                        </div>
                        <h3 className="text-[16px] font-semibold leading-[1.03] tracking-[-0.02em] text-[#191f26]">{b.title}</h3>
                        <div className="mt-3 flex items-end justify-between">
                          <div>
                            <div className="text-[9px] tracking-[0.22em] text-[#9aa4ab]">REWARD</div>
                            <div className="text-[16px] font-semibold leading-none tracking-[-0.03em] text-[#09854b]">+{b.coinReward} coins</div>
                          </div>
                          {done ? (
                            <div className="rounded-2xl bg-[#ecfaf2] px-4 py-2 text-[10px] font-semibold text-[#058848]">Completed ✓</div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBounty(b);
                                setActiveScreen("submit");
                              }}
                              className="rounded-2xl bg-[#007f43] px-5 py-2 text-[10px] font-semibold text-white"
                            >
                              Complete This →
                            </button>
                          )}
                        </div>
                      </BountyCard>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeScreen === "bounties" && (
            <div className="space-y-3 px-4 pt-4 pb-3">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[20px] font-semibold leading-none tracking-[-0.02em] text-[#1d2025]">All Bounties</h2>
                <span className="rounded-full bg-[#0f8f4d] px-2 py-1 text-[9px] font-semibold text-white">{allBounties.length} total</span>
              </div>
              <div className="space-y-3">
                {allBounties.map((b) => {
                  const done = store.isClaimed(b.id);
                  const isExpired = new Date(b.expiresAt).getTime() < Date.now();
                  const ts = getThemeStyles(b.theme);
                  return (
                    <BountyCard key={b.id} theme={b.theme}>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex gap-1 text-[9px] font-semibold">
                          <span className={`rounded-full px-2 py-1 ${ts.pill}`}>{b.theme.toUpperCase()}</span>
                          <span className="rounded-full bg-[#ebeff3] px-2 py-1 text-[#61707a]">SDG {b.sdgTag}</span>
                        </div>
                        <div className="rounded-full border border-[#dce5e1] px-2 py-1 text-[10px] font-semibold text-[#4d6c62]">
                          {isExpired ? "Expired" : `${formatDistanceToNowStrict(new Date(b.expiresAt))} left`}
                        </div>
                      </div>
                      <h3 className="text-[16px] font-semibold leading-[1.03] tracking-[-0.02em] text-[#191f26]">{b.title}</h3>
                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <div className="text-[9px] tracking-[0.22em] text-[#9aa4ab]">REWARD</div>
                          <div className="text-[16px] font-semibold leading-none tracking-[-0.03em] text-[#09854b]">+{b.coinReward} coins</div>
                        </div>
                        {done ? (
                          <div className="rounded-2xl bg-[#ecfaf2] px-4 py-2 text-[10px] font-semibold text-[#058848]">Completed ✓</div>
                        ) : !b.isActive || isExpired ? (
                          <div className="rounded-2xl bg-[#f0f3f5] px-4 py-2 text-[10px] font-semibold text-[#77828b]">Unavailable</div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBounty(b);
                              setActiveScreen("submit");
                            }}
                            className="rounded-2xl bg-[#007f43] px-5 py-2 text-[10px] font-semibold text-white"
                          >
                            Complete This →
                          </button>
                        )}
                      </div>
                    </BountyCard>
                  );
                })}
              </div>
            </div>
          )}

          {activeScreen === "submit" && (
            <div className="space-y-3 px-4 pt-4 pb-3">
              <article className="rounded-[26px] border border-[#edf1f3] bg-white p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="mb-1 flex gap-1 text-[9px] font-semibold">
                      <span className={`rounded-full px-2 py-1 ${getThemeStyles(selectedBounty?.theme || "canteen").pill}`}>
                        {selectedBounty?.theme?.toUpperCase() || "CANTEEN"}
                      </span>
                      <span className="rounded-full bg-[#eaf0f6] px-2 py-1 text-[#60717d]">SDG {selectedBounty?.sdgTag || 12}</span>
                    </div>
                    <h2 className="text-[26px] font-semibold leading-[0.92] tracking-[-0.03em] text-[#1f242a]">
                      {selectedBounty?.title || "Bring Your Own Tumbler"}
                    </h2>
                  </div>
                  <button type="button" onClick={() => setActiveScreen("home")} className="grid h-6 w-6 place-items-center rounded-full bg-[#edf1f3] text-xs">
                    ×
                  </button>
                </div>
                <p className="text-[12px] leading-5 text-[#69747e]">
                  {selectedBounty?.description ||
                    "Show your reusable cup at the canteen to earn coins and reduce single-use waste across campus."}
                </p>
                <div className="mt-3 rounded-2xl bg-[#eaffe9] px-3 py-2 text-[12px] font-semibold text-[#007f43]">
                  $ Estimated Reward {selectedBounty?.coinReward || 25} coins
                </div>
                <div className="mt-4 text-[12px] font-semibold tracking-[0.12em] text-[#454d56]">EVIDENCE</div>
                <div className="mt-2 rounded-2xl border border-[#dbe7df] bg-[#f3fbf6] p-3">
                  <div className="text-[10px] font-semibold tracking-[0.12em] text-[#2d6c4d]">PHOTO TIPS (FOR APPROVAL)</div>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] leading-4 text-[#3f6653]">
                    {captureTips.map((tip, idx) => (
                      <li key={`${tip}-${idx}`}>{tip}</li>
                    ))}
                  </ul>
                </div>
                {previewUrl ? (
                  <div className="relative mt-2 h-48 overflow-hidden rounded-3xl bg-[#1e2329]">
                    <img src={previewUrl} alt="Evidence Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-[2px]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9M20 20v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Retake
                    </button>
                  </div>
                ) : (
                  <label className="relative mt-2 flex h-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-[#d1d9e0] bg-[#f9fafa] transition-colors hover:bg-[#f0f4f7]">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setSelectedFile(file);
                          setPreviewUrl(URL.createObjectURL(file));
                        }
                      }}
                    />
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8a959d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span className="text-[14px] font-semibold text-[#8a959d]">Tap to Take Photo</span>
                  </label>
                )}
                <div className="mt-3 rounded-2xl bg-[#ebfff3] px-3 py-2 text-[12px] text-[#3a8f60]">AI is analyzing your photo</div>
                <button
                  type="button"
                  onClick={() => submit(selectedBounty || (store.bounties && store.bounties[0]))}
                  disabled={!selectedFile || isSubmitting}
                  className={`mt-3 w-full rounded-2xl py-3 text-[12px] font-semibold transition-colors ${
                    selectedFile && !isSubmitting ? "bg-[#007f43] text-white" : "bg-[#dfe5e8] text-[#7b848c] cursor-not-allowed"
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                       <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                         <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                       </svg>
                       Verifying with Vision AI...
                    </span>
                  ) : "⚙ Submit for AI Verification"}
                </button>
                <div className="mt-2 text-center text-[8px] tracking-[0.2em] text-[#adb5bc]">VERDE BLOCKCHAIN SECURED</div>
              </article>
            </div>
          )}

          {activeScreen === "result" && result && (
            <div className="px-4 pt-8 pb-4">
              <article className="rounded-[30px] border border-[#edf1f3] bg-white p-4 text-center">
                <div className="mx-auto mb-2 grid h-24 w-24 place-items-center rounded-full bg-[#ecfff1] text-[42px] text-[#008f4e]">
                  {result.verdict === "approved" ? "✔" : result.verdict === "flagged" ? "!" : "✕"}
                </div>
                <h2 className="text-[30px] font-semibold leading-none tracking-[-0.02em] text-[#1a2028]">
                  {result.verdict === "approved"
                    ? "Submission Approved!"
                    : result.verdict === "flagged"
                      ? "Under Review"
                      : "Submission Rejected"}
                </h2>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7a82]">
                  {hasGeminiKey ? "Gemini" : "AI insight"}
                </p>
                <p className="mt-2 text-[13px] italic text-[#66727b]">
                  &ldquo;{result.geminiLoading ? "…" : (result.adminNote ? `Admin Feedback: ${result.adminNote}` : (result.geminiReason || result.reason))}&rdquo;
                </p>
                {result.verdict === "rejected" && Array.isArray(result.missingElements) && result.missingElements.length > 0 && (
                  <div className="mt-3 rounded-2xl border border-[#ffd7d7] bg-[#fff4f4] p-3 text-left">
                    <div className="text-[10px] font-semibold tracking-[0.12em] text-[#b42323]">WHAT TO INCLUDE NEXT PHOTO</div>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] text-[#7f2a2a]">
                      {result.missingElements.map((item, idx) => (
                        <li key={`${item}-${idx}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-3 rounded-2xl bg-[#f3f6f6] p-3 text-[12px]">
                  <div className="mb-2 flex justify-between font-semibold text-[#1f2730]">
                    <span>AI CONFIDENCE</span>
                    <span>{result.confidence}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#d7e4de]">
                    <div className="h-2 rounded-full bg-[#57d57c]" style={{ width: `${result.confidence}%` }} />
                  </div>
                </div>
                {result.verdict === "approved" && (
                  <div className="mt-3 rounded-2xl bg-[#007f43] px-3 py-4 text-white">
                    <div className="text-[30px] font-semibold leading-none">+{selectedBounty?.coinReward || 25} Verde Coins</div>
                    <div className="mt-1 text-[9px] tracking-[0.2em] text-[#bde9ce]">TRANSACTION VERIFIED</div>
                  </div>
                )}
                {result.verdict !== "flagged" && (
                  <div className="mt-3 text-[14px] text-[#2b323a]">
                    New balance: <span className="font-semibold">{store.coinBalance} coins</span>
                  </div>
                )}
                {result.verdict === "approved" && (
                  <button
                    type="button"
                    onClick={() => {
                      // Coins are already credited after approval; send user to wallet to use them.
                      setResult(null);
                      setActiveScreen("wallet");
                    }}
                    className="mt-3 w-full rounded-xl bg-[#007f43] py-2.5 text-[14px] font-semibold text-white"
                  >
                    Claim Rewards
                  </button>
                )}
                {result.verdict === "rejected" && (
                  <button type="button" onClick={() => setActiveScreen("submit")} className="mt-3 w-full rounded-xl bg-[#007f43] py-2.5 text-[14px] font-semibold text-white">
                    Retake Photo
                  </button>
                )}
                <button type="button" onClick={() => setActiveScreen("home")} className="mt-2 text-[12px] font-semibold text-[#006f3f]">
                  Back to Bounties
                </button>
              </article>
            </div>
          )}

          {activeScreen === "leaderboard" && (
            <div className="space-y-3 px-4 pt-4 pb-3">
              <h2 className="text-[20px] font-semibold leading-none tracking-[-0.03em] text-[#009451]">Campus Leaderboard</h2>
              <div className="text-xs text-[#65737d]">Oct 2 - Oct 8</div>

              <div className="flex items-end justify-center gap-2 px-1">
                {podiumSlots.map((entry, idx) => {
                  const rank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                  const heights = idx === 1 ? "min-h-[148px] pb-3" : idx === 0 ? "min-h-[118px] pb-2" : "min-h-[102px] pb-2";
                  const border =
                    rank === 1 ? "border-[#22c55e] shadow-[0_0_0_2px_rgba(34,197,94,0.35)]" : rank === 2 ? "border-zinc-300" : "border-[#fdba74]";
                  return (
                    <div
                      key={`${entry.id}-${rank}`}
                      className={`flex w-[30%] max-w-[96px] flex-col items-center rounded-t-2xl border-2 bg-[#f4f6f7] px-1 pt-3 text-center ${heights} ${border}`}
                    >
                      {rank === 1 && <span className="mb-1 text-lg leading-none" aria-hidden>👑</span>}
                      <div
                        className={`relative mb-1 grid h-11 w-11 place-items-center rounded-xl text-[11px] font-semibold text-white ${rank === 1 ? "bg-[#0f766e]" : rank === 2 ? "bg-[#334155]" : "bg-[#ea580c]"
                          }`}
                      >
                        <span>{entry.displayName[0]}</span>
                        <span
                          className={`absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-white text-[9px] font-bold ${rank === 1 ? "bg-[#16a34a]" : rank === 2 ? "bg-zinc-500" : "bg-[#f97316]"
                            }`}
                        >
                          {rank}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-[#1d2730]">{entry.displayName}</div>
                      <div className="text-[12px] font-semibold text-[#00914f]">{entry.totalEarned.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                {leaderboard.slice(3).map((entry, idx) => {
                  const rank = idx + 4;
                  const you = isYouRow(entry.displayName);
                  return (
                    <div
                      key={entry.id}
                      className={`relative flex items-center justify-between rounded-2xl border px-3 py-2 ${you ? "border-[#0aa74f] bg-[#ecfff3]" : "border-[#edf1f3] bg-white"
                        }`}
                    >
                      {you && (
                        <span className="absolute -top-2 right-2 rounded-full bg-[#065f46] px-2 py-0.5 text-[8px] font-bold tracking-wide text-white">
                          YOU
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="text-[14px] font-semibold text-[#1f2830]">{rank}</div>
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-[#d6eaf4] text-[12px] font-semibold">{entry.displayName[0]}</div>
                        <div>
                          <div className="text-[12px] font-semibold">{entry.displayName}</div>
                          <div className="text-[9px] text-[#73808a]">{entry.approvedCount} Bounties Completed</div>
                        </div>
                      </div>
                      <div className="text-right text-[#00914f]">
                        <div className="text-[16px] font-semibold leading-none">{entry.totalEarned.toLocaleString()}</div>
                        <div className="text-[8px] font-semibold tracking-[0.15em] text-[#97a4ad]">COINS</div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {activeScreen === "wallet" && (
            <div className="space-y-3 px-4 pt-4 pb-3">
              <div className="rounded-3xl border border-[#edf1f3] bg-white p-4 text-center">
                <div className="mb-1 text-[50px] font-semibold leading-none text-[#007f43]">{store.coinBalance}</div>
                <div className="text-[12px] text-[#8a959d]">= ₱{Math.floor(store.coinBalance / 10)} equivalent</div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl border border-[#edf1f3] bg-white px-2 py-2">
                    <div className="text-[9px] tracking-[0.12em] text-[#9ba5ac]">EARNED</div>
                    <div className="text-[16px] font-semibold text-[#03884c]">{store.totalEarned} total</div>
                  </div>
                  <div className="rounded-2xl border border-[#edf1f3] bg-white px-2 py-2">
                    <div className="text-[9px] tracking-[0.12em] text-[#9ba5ac]">REDEEMED</div>
                    <div className="text-[16px] font-semibold text-[#303741]">550</div>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-[#edf1f3] bg-white p-4">
                <h3 className="text-[17px] font-semibold leading-none text-[#008a4d]">Redeem Voucher</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="text-[#748089]">Live conversion</span>
                  <span className="font-semibold text-[#008a4d]">₱50 = 10% discount</span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between rounded-2xl bg-[#eaffee] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#c3f7d6] text-[#007f43]">%</div>
                      <div>
                        <div className="text-[12px] font-semibold leading-none text-[#1f2932]">Main Canteen</div>
                        <div className="mt-0.5 text-[10px] font-semibold text-[#2f4f44]">₱50 Discount</div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { setSelectedVoucher({ name: "Main Canteen", amount: 50 }); setError(""); }}
                      className={`text-[11px] font-semibold ${selectedVoucher?.name === "Main Canteen" ? "text-[#007f43]" : "text-[#1f2932]"}`}
                    >
                      {selectedVoucher?.name === "Main Canteen" ? "Selected" : "Select"}
                    </button>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-[#eaffee] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#c3f7d6] text-[#007f43]">%</div>
                      <div>
                        <div className="text-[12px] font-semibold leading-none text-[#1f2932]">Print Shop</div>
                        <div className="mt-0.5 text-[10px] font-semibold text-[#2f4f44]">₱50 Discount</div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { setSelectedVoucher({ name: "Print Shop", amount: 50 }); setError(""); }}
                      className={`text-[11px] font-semibold ${selectedVoucher?.name === "Print Shop" ? "text-[#007f43]" : "text-[#1f2932]"}`}
                    >
                      {selectedVoucher?.name === "Print Shop" ? "Selected" : "Select"}
                    </button>
                  </div>
                </div>
                <button type="button" onClick={createQR} className="mt-3 w-full rounded-2xl bg-[#007f43] py-3 text-[14px] font-semibold leading-none tracking-[-0.02em] text-white">
                  Generate QR Code →
                </button>
                {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
                {store.pendingRedemption && store.pendingRedemption.status === "pending" && (
                  <div className="mt-3 rounded-2xl border border-[#e3e9ed] p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-bold tracking-wider text-[#7e8c9a] uppercase">Your QR Token</div>
                      <button onClick={dismissQR} className="text-[11px] font-semibold text-red-500">Dismiss</button>
                    </div>
                    <div className="text-center text-[16px] text-[#64717b]">{store.displayName || "Student"}</div>
                    <div className="text-center text-[15px] font-semibold leading-none text-[#008a4d]">10% discount</div>
                    <div className="mt-2 grid place-items-center rounded-xl bg-[#f6f9fb] p-3">
                      {store.pendingRedemption.id ? (
                        <QRCode size={130} value={store.pendingRedemption.id} />
                      ) : (
                        <div className="flex h-[130px] w-[130px] items-center justify-center text-xs text-red-500">Error: Missing ID</div>
                      )}
                      <p className="mt-2 text-[10px] font-mono text-zinc-400">{store.pendingRedemption.id || "no-id"}</p>
                    </div>
                    <div className="mt-2 text-center text-[13px] font-semibold text-[#f29a2b]">
                      ◷ Expires in {timeLeft}
                    </div>
                  </div>
                )}
              </div>
              <div className="rounded-3xl border border-[#edf1f3] bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[17px] font-semibold leading-none text-[#252b33]">Recent Activity</h3>
                  <button type="button" className="text-xs font-semibold text-[#4e8b7a]">
                    View All
                  </button>
                </div>
                <div className="space-y-2">
                  {store.transactions.slice(0, 3).map((tx) => (
                    <div
                      key={tx.id}
                      className={`flex items-center justify-between gap-2 rounded-2xl border border-[#edf1f3] bg-white pl-0 pr-3 py-2 ${tx.type === "earned" ? "border-l-4 border-l-[#0f8f4d]" : "border-l-4 border-l-[#cbd5e1]"
                        }`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2 pl-2">
                        <ActivityIcon tx={tx} />
                        <div className="min-w-0">
                          <div className="truncate text-[12px] font-semibold text-[#1f2932]">{tx.description}</div>
                          <div className="text-[9px] text-[#77828b]">{format(new Date(tx.timestamp), "MMM d, h:mm a")}</div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div
                          className={`text-[20px] font-semibold leading-none ${tx.type === "earned" ? "text-[#0d8f4f]" : "text-[#6b7280]"
                            }`}
                        >
                          {tx.type === "earned" ? "+" : "-"}
                          {tx.amount}
                        </div>
                        <div
                          className={`text-[9px] font-semibold tracking-[0.12em] ${tx.type === "earned" ? "text-[#0d8f4f]" : "text-[#6b7280]"
                            }`}
                        >
                          {tx.type === "earned" ? "EARNED" : "REDEEMED"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
            </div>

            <BottomNav
              active={
                activeScreen === "wallet"
                  ? "Wallet"
                  : activeScreen === "leaderboard"
                    ? "Rankings"
                    : activeScreen === "bounties"
                      ? "Bounties"
                      : "Home"
              }
              onSelect={handleNavSelect}
            />
          </div>
        </PhoneFrame>
      </div>
    </main>
  );
}

export default StudentPage;
