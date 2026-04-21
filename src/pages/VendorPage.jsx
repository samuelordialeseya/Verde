import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BarcodeFormat, BrowserMultiFormatReader, DecodeHintType } from "@zxing/library";
import { format } from "date-fns";
import { useAppStore } from "../context/appStore";
import PhoneFrame from "../components/PhoneFrame";

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00A15E" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00A15E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001 1.51H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function TopNav() {
  return (
    <header className="flex items-center justify-between border-b border-[#e6e9eb] px-3.5 py-3">
      <div className="flex items-center gap-2">
        <IconMenu />
        <span className="text-[18px] font-semibold text-[#00A15E]">Verde</span>
      </div>
      <IconGear />
    </header>
  );
}

function IconLeaf({ className = "text-[#0a7e49]" }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5a6.84 6.84 0 002.62 5.38L7 19l-1.56-1.47A4.49 4.49 0 014 15.5C4 13.56 6.2 8.5 17 8z" />
    </svg>
  );
}

function IconUtensils() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5c6570" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 002-2V2M7 2v20M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h0" />
    </svg>
  );
}

function IconScanQr() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden>
      <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h6v6h-6zM7 7h.01M17 7h.01M7 17h.01M17 17h.01" />
    </svg>
  );
}

function IconTicket({ className = "text-[#0a7e49]" }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 7V4h16v3M4 17v3h16v-3M4 12h16" />
      <path d="M4 7a2 2 0 012 2v2a2 2 0 01-2 2M20 7a2 2 0 00-2 2v2a2 2 0 002 2" />
    </svg>
  );
}

function IconClock({ className = "text-[#0a7e49]" }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function IconInfoCircle({ className = "text-[#8b5a2b]" }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function IconBan() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M4.93 4.93l14.14 14.14" />
    </svg>
  );
}

function IconWallet() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" aria-hidden>
      <path d="M21 12V7H5a2 2 0 010-4h14v4" />
      <path d="M3 5v14a2 2 0 002 2h16v-5" />
      <path d="M18 12h.01" />
    </svg>
  );
}

function IconKeyboard({ className = "text-current" }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
    </svg>
  );
}

function IconArrowUpRight({ className = "text-current" }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M7 17L17 7M7 7h10v10" />
    </svg>
  );
}

function QrGlyph({ color }) {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden>
      <rect x="4" y="4" width="11" height="11" rx="1.5" stroke={color} strokeWidth="2.4" />
      <rect x="27" y="4" width="11" height="11" rx="1.5" stroke={color} strokeWidth="2.4" />
      <rect x="4" y="27" width="11" height="11" rx="1.5" stroke={color} strokeWidth="2.4" />
      <rect x="8" y="8" width="3" height="3" rx="0.8" fill={color} />
      <rect x="31" y="8" width="3" height="3" rx="0.8" fill={color} />
      <rect x="8" y="31" width="3" height="3" rx="0.8" fill={color} />
      <rect x="21" y="19" width="3" height="3" rx="0.7" fill={color} />
      <rect x="25" y="19" width="3" height="3" rx="0.7" fill={color} />
      <rect x="21" y="23" width="3" height="3" rx="0.7" fill={color} />
      <rect x="29" y="23" width="3" height="3" rx="0.7" fill={color} />
      <rect x="25" y="27" width="3" height="3" rx="0.7" fill={color} />
      <rect x="29" y="31" width="3" height="3" rx="0.7" fill={color} />
    </svg>
  );
}

function QrTile({ success = true }) {
  return (
    <div className="relative mx-auto h-[124px] w-[124px] rounded-[22px] bg-white shadow-[0_16px_50px_rgba(15,35,32,0.08)]">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <QrGlyph color={success ? "#006f3f" : "#a32020"} />
      </div>
      <div className={`absolute -bottom-2 -right-2 grid h-9 w-9 place-items-center rounded-full ${success ? "bg-[#5df494]" : "bg-[#ffd8d8]"}`}>
        {success ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f7a46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a32020" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        )}
      </div>
    </div>
  );
}

function AppShell({ children }) {
  return (
    <main className="min-h-screen bg-[#1a1d23] p-4 font-sans text-zinc-900">
      <div className="mx-auto flex max-w-[1200px] justify-center">
        <PhoneFrame>{children}</PhoneFrame>
      </div>
    </main>
  );
}

export default function VendorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { consumeRedemptionToken, pendingRedemption } = useAppStore();
  const [viewState, setViewState] = useState("idle");
  const [resultData, setResultData] = useState(null);
  const [showManualCard, setShowManualCard] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [isScannerStarting, setIsScannerStarting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  const vendorName = id === "1" ? "Main Canteen" : id === "2" ? "Print Shop" : `Vendor ${id}`;

  const handleScan = (tokenText) => {
    // Extract rdm- ID if it's embedded in a string, otherwise use raw text
    const rdmMatch = tokenText.match(/rdm-[a-z0-9]+/i);
    const parsedToken = rdmMatch ? rdmMatch[0] : tokenText.trim();
    
    console.log("Scanned Token:", parsedToken); // Add log for debugging
    const res = consumeRedemptionToken(parsedToken);
    setResultData(res);
    setViewState(res.ok ? "success" : "error");
    codeReaderRef.current?.reset();
  };

  const loadVideoDevices = async () => {
    try {
      // Prompt permission first so labels/devices are available in Chromium.
      const warmupStream = await navigator.mediaDevices.getUserMedia({ video: true });
      warmupStream.getTracks().forEach((track) => track.stop());
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      setAvailableCameras(devices);
      if (!devices.length) {
        setSelectedCameraId("");
        return devices;
      }
      if (selectedCameraId && devices.some((d) => d.deviceId === selectedCameraId)) {
        return devices;
      }
      const rearDevice =
        devices.find((d) => /back|rear|environment/i.test(d.label)) ||
        devices.find((d) => /camera 0|camera1|cam 0/i.test(d.label)) ||
        devices[0];
      setSelectedCameraId(rearDevice.deviceId);
      return devices;
    } catch {
      setAvailableCameras([]);
      setSelectedCameraId("");
      return [];
    }
  };

  const startScanner = async (preferredDeviceId) => {
    if (viewState !== "scan" || !videoRef.current) return;
    setIsScannerStarting(true);
    setCameraError("");
    setCameraReady(false);
    codeReaderRef.current?.reset();

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints);
    codeReaderRef.current = reader;
    try {
      const devices = await loadVideoDevices();
      if (devices.length) {
        const nextDeviceId =
          preferredDeviceId ||
          selectedCameraId ||
          devices.find((d) => /back|rear|environment/i.test(d.label))?.deviceId ||
          devices[0].deviceId;
        setSelectedCameraId(nextDeviceId);
        await reader.decodeFromConstraints(
          {
            video: {
              deviceId: { exact: nextDeviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current,
          (result) => {
            if (result) handleScan(result.getText());
          }
        );
        setCameraReady(true);
      } else {
        // Fallback for browsers that fail to enumerate but still allow camera streams.
        try {
          await reader.decodeFromConstraints(
            {
              video: {
                facingMode: { ideal: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            },
            videoRef.current,
            (result) => {
              if (result) handleScan(result.getText());
            }
          );
          setCameraReady(true);
        } catch {
          await reader.decodeFromConstraints(
            {
              video: {
                facingMode: { ideal: "user" },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            },
            videoRef.current,
            (result) => {
              if (result) handleScan(result.getText());
            }
          );
          setCameraReady(true);
        }
      }
    } catch (error) {
      if (window.isSecureContext === false) {
        setCameraError("Camera requires HTTPS or localhost. Use manual entry for now.");
      } else {
        setCameraError("Unable to access camera. Check browser and Windows camera permissions, then retry.");
      }
    } finally {
      setIsScannerStarting(false);
    }
  };

  useEffect(() => {
    if (viewState !== "scan") {
      codeReaderRef.current?.reset();
      setCameraReady(false);
      return;
    }
    loadVideoDevices();
    startScanner();
    return () => codeReaderRef.current?.reset();
  }, [viewState]);

  const handleManualEntry = () => {
    setShowManualCard(true);
    setManualToken(pendingRedemption?.id || "");
  };

  const submitManualToken = () => {
    if (!manualToken.trim()) return;
    handleScan(manualToken.trim());
    setShowManualCard(false);
  };

  if (viewState === "success" && resultData) {
    const token = resultData.token;
    const discountPeso = Math.floor((token?.amount || 50) / 10);
    return (
      <AppShell>
        <TopNav />
        <div className="px-3.5 pt-8 pb-5">
          <QrTile success />
          <div className="mt-14 text-center">
            <p className="text-[9px] font-semibold tracking-[0.18em] text-[#4d7e68] uppercase">Action Completed</p>
            <h1 className="mt-2 text-[20px] leading-[0.95] font-semibold tracking-[-0.02em] text-[#151a1f]">Redemption<br />Successful</h1>
            <p className="mt-3 text-[14px] leading-5 text-[#5e666f]">Successfully processed <span className="font-semibold text-[#0a7e49]">{token?.amount || 50} coins</span><br />for this transaction.</p>
          </div>

          <article className="mt-7 flex overflow-hidden rounded-[20px] bg-[#f1f3f4] shadow-sm">
            <div className="w-[6px] shrink-0 bg-[#0a6b42]" aria-hidden />
            <div className="min-w-0 flex-1 p-3.5">
              <div className="flex items-start justify-between">
                <p className="text-[8px] font-semibold tracking-[0.14em] text-[#6f7780] uppercase">Redemption Details</p>
                <IconTicket />
              </div>
              <p className="mt-1 text-[31px] leading-none font-semibold tracking-[-0.02em] text-[#1d242b]">₱{discountPeso} Discount Applied</p>
              <p className="mt-2 text-[11px] leading-4 text-[#606972]">Student: {token?.displayName || "Julian Rivers"} ({token?.studentId || "VER-2023-8821"}).<br />Valid for all storewide items.</p>
            </div>
          </article>

          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-2xl bg-[#f6f9fb] p-3.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm text-zinc-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-wider text-[#9ba6b1] uppercase">Timestamp</div>
                <div className="mt-0.5 text-[12px] font-semibold text-[#1f2932]">{format(new Date(token?.redeemedAt || Date.now()), "MMM d, yyyy - HH:mm")}</div>
                <div className="text-[10px] text-[#5e666f]">Ref ID: #{token?.id || "VRD-992104-X"}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 rounded-2xl bg-[#f6f9fb] p-3.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm text-[#007f43]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8a8 8 0 0 1-8 8Z"/><path d="M12 14.74V22"/></svg>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-wider text-[#9ba6b1] uppercase">Sustainability</div>
                <div className="mt-0.5 text-[12px] font-semibold text-[#1f2932]">Circular economy impact</div>
                <div className="text-[10px] text-[#5e666f]">Eco-credentials verified</div>
              </div>
            </div>
          </div>

          <button onClick={() => setViewState("scan")} className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#007f43] text-[12px] font-semibold text-white">Scan Next →</button>
          <button onClick={() => setViewState("idle")} className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#dfe5e8] text-[12px] font-semibold text-[#5f6b75]">Close</button>
          <button className="mt-4 block w-full text-center text-[12px] font-semibold text-[#58606a]">Report a Technical Issue</button>
        </div>
      </AppShell>
    );
  }

  if (viewState === "error" && resultData) {
    const token = resultData.token;
    const errorType = resultData.errorType;
    const heading = errorType === "already_redeemed" ? "Already Redeemed" : errorType === "expired" ? "Expired Code" : errorType === "low_balance" ? "Low Balance" : "Scan Failed";
    const detailTitle = errorType === "already_redeemed" ? "Single-Use Limit" : errorType === "expired" ? "Time Window Closed" : "Balance Requirement";
    return (
      <AppShell>
        <TopNav />
        <div className="px-3.5 pt-8 pb-5">
          <QrTile success={false} />
          <div className="mt-14 text-center">
            <p className="text-[9px] font-semibold tracking-[0.18em] text-[#a25555] uppercase">Action Failed</p>
            <h1 className="mt-2 text-[20px] leading-[0.95] font-semibold tracking-[-0.02em] text-[#151a1f]">{heading}</h1>
            <p className="mt-3 text-[12px] leading-5 text-[#5e666f]">
              {errorType === "already_redeemed" ? <>This QR code was processed on<br /><span className="font-semibold text-[#272f37]">{format(new Date(token?.redeemedAt || Date.now()), "MMM d, HH:mm")}</span>. It cannot be used again.</> : (resultData.message || "This code cannot be processed.")}
            </p>
          </div>

          <article className="mt-7 flex overflow-hidden rounded-[20px] bg-[#F2F4F4] shadow-sm">
            <div className="w-[6px] shrink-0 bg-[#7a4f1e]" aria-hidden />
            <div className="min-w-0 flex-1 p-3.5">
              <div className="flex items-start justify-between">
                <p className="text-[8px] font-semibold tracking-[0.14em] text-[#6f7780] uppercase">Detailed Reason</p>
                <IconInfoCircle />
              </div>
              <p className="mt-1 text-[14px] leading-none font-semibold tracking-[-0.02em] text-[#1d242b]">{detailTitle}</p>
              <p className="mt-2 text-[11px] leading-4 text-[#606972]">Sustainability rewards are restricted to one scan per unique transaction to maintain ecosystem balance.</p>
            </div>
          </article>

          <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto pb-2">
            <div className="min-w-[49%] shrink-0 rounded-xl border border-[#eceff1] bg-white p-3">
              <div className="mb-2 grid h-8 w-8 place-items-center rounded-full bg-[#fee2e2]">
                <IconBan />
              </div>
              <p className="text-[12px] font-semibold text-[#1f2937]">Expired Code</p>
              <p className="mt-2 text-[11px] leading-4 text-[#6b7280]">The temporary reward window may be closed.</p>
            </div>
            <div className="min-w-[49%] shrink-0 rounded-xl border border-[#eceff1] bg-white p-3">
              <div className="mb-2 grid h-8 w-8 place-items-center rounded-full bg-[#ffedd5]">
                <IconWallet />
              </div>
              <p className="text-[12px] font-semibold text-[#1f2937]">Low Balance</p>
              <p className="mt-2 text-[11px] leading-4 text-[#6b7280]">User needs more points to redeem this code.</p>
            </div>
          </div>

          <button onClick={() => setViewState("scan")} className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#00A15E] text-[12px] font-semibold text-white">Try Scanning Again →</button>
          <button onClick={() => setViewState("idle")} className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#dfe5e8] text-[12px] font-semibold text-[#5f6b75]">Close</button>
          <button className="mt-4 block w-full text-center text-[12px] font-semibold text-[#58606a]">Report a Technical Issue</button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopNav />
      <div className="px-3.5 pt-5 pb-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#70f39f] px-2 py-1 text-[9px] font-semibold tracking-[0.12em] text-[#0a7e49] uppercase">Official Partner</span>
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold tracking-[0.12em] text-[#6f7780] uppercase"><span className="h-1.5 w-1.5 rounded-full bg-[#0a7e49]" />Live Session</span>
          </div>
          <button onClick={() => setViewState("idle")} className="text-zinc-400 hover:text-zinc-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <h1 className="text-[28px] leading-[1.05] font-bold tracking-[-0.02em] text-[#151a1f]">{vendorName}</h1>
        <p className="mt-0.5 flex items-center gap-1.5 text-[25px] leading-[1.05] font-semibold tracking-[-0.02em]">
          <span className="font-bold text-[#00A15E]">Verde</span>
          <span className="font-semibold text-[#2b333b]">Partner</span>
        </p>
        <p className="mt-3 text-[13px] leading-6 text-[#5e666f]">Verify sustainability credentials and reward students in real-time.</p>

        <section className="relative mt-7 h-[145px] overflow-hidden rounded-[24px] border border-[#e8ebee] bg-[#8e8f84]">
          {viewState === "scan" ? (
            <>
              <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover opacity-100" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_18%,rgba(255,255,200,0.45)_0,rgba(255,255,200,0)_28%),linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.25))]" />
              <div className="absolute inset-x-3 bottom-4 flex items-center gap-3 rounded-full border border-white/25 bg-black/35 px-4 py-2.5 backdrop-blur-sm">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15">
                  <IconScanQr />
                </span>
                <p className="text-[12px] leading-4 text-white">
                  {isScannerStarting
                    ? "Starting camera scanner..."
                    : cameraReady
                      ? "Position student QR code within the frame"
                      : "Camera not ready. Tap retry or use manual entry."}
                </p>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-800 text-white p-4 text-center">
              <IconScanQr />
              <button 
                onClick={() => setViewState("scan")}
                className="mt-3 rounded-full bg-[#00A15E] px-6 py-2 text-[12px] font-bold"
              >
                Open Camera Scanner
              </button>
            </div>
          )}
          {viewState === "scan" && cameraError && (
            <div className="absolute inset-x-3 top-3 rounded-xl border border-[#fecaca] bg-[#fee2e2]/90 px-3 py-2 text-[10px] font-semibold text-[#991b1b]">
              {cameraError}
            </div>
          )}
          {viewState === "scan" && !!availableCameras.length && (
            <div className="absolute inset-x-3 top-3 z-10 flex items-center gap-2">
              <select
                value={selectedCameraId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setSelectedCameraId(nextId);
                  startScanner(nextId);
                }}
                className="h-7 min-w-0 flex-1 rounded-full border border-white/60 bg-white/90 px-3 text-[10px] font-semibold text-[#1f2937]"
              >
                {availableCameras.map((cam, index) => (
                  <option key={cam.deviceId} value={cam.deviceId}>
                    {cam.label || `Camera ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
          {viewState === "scan" && !cameraReady && (
            <button
              type="button"
              onClick={() => startScanner(selectedCameraId)}
              className={`absolute right-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold tracking-[0.08em] text-[#0a7e49] uppercase ${
                availableCameras.length ? "top-11" : "top-3"
              }`}
            >
              Retry Camera
            </button>
          )}
        </section>

        <article className="mt-7 flex overflow-hidden rounded-[24px] border border-[#eef1f4] bg-white shadow-sm">
          <div className="w-[6px] shrink-0 bg-[#0a6b42]" aria-hidden />
          <div className="min-w-0 flex-1 p-3.5">
            <p className="text-[8px] font-semibold tracking-[0.16em] text-[#6f7780] uppercase">Today's Impact</p>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-[40px] leading-none font-semibold tracking-[-0.03em] text-[#0a7e49]">124</span>
              <span className="pb-1.5 text-[12px] text-[#4f5962]">Scans</span>
            </div>
            <div className="mt-2 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e8edf0]">
                    <IconLeaf className="text-[#5c6570]" />
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-[#1b222a]">Reusable Bottle</p>
                    <p className="text-[9px] tracking-[0.09em] text-[#98a2aa] uppercase">3 mins ago</p>
                  </div>
                </div>
                <p className="text-[16px] leading-none font-semibold text-[#0a7e49]">+5pts</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e8edf0]">
                    <IconUtensils />
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-[#1b222a]">Meat-free Meal</p>
                    <p className="text-[9px] tracking-[0.09em] text-[#98a2aa] uppercase">12 mins ago</p>
                  </div>
                </div>
                <p className="text-[16px] leading-none font-semibold text-[#0a7e49]">+12pts</p>
              </div>
            </div>
          </div>
        </article>

        <article className="relative mt-5 overflow-hidden rounded-[24px] bg-[#007f43] p-4 text-white">
          <div className="mb-3 flex items-start justify-between">
            <span className="grid h-7 w-7 place-items-center rounded-full border border-[#6cf2a1] text-[#6cf2a1]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            <span className="text-[8px] font-semibold tracking-[0.14em] text-[#9deec0] uppercase">Hardware Status</span>
          </div>
          <p className="text-[17px] leading-[1.08] font-semibold">Scanner Hub is active and synchronized.</p>
          <button
            type="button"
            onClick={handleManualEntry}
            className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-full bg-[#66f39c] text-[10px] font-semibold tracking-[0.1em] text-[#0b6f40] uppercase"
          >
            <IconKeyboard className="text-[#0b6f40]" />
            Manual Entry
            <IconArrowUpRight className="text-[#0b6f40]" />
          </button>
        </article>

        {showManualCard && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4">
            <div className="w-full max-w-[260px] rounded-2xl bg-white p-4 shadow-xl">
              <h3 className="text-[13px] font-semibold text-[#1f2937]">Manual Token Entry</h3>
              <p className="mt-1 text-[11px] text-[#6b7280]">Paste or type the QR token.</p>
              <input
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="rdm-xxxxxxxx"
                className="mt-3 w-full rounded-xl border border-[#d9dfe4] px-3 py-2 text-[12px] outline-none focus:border-[#0a7e49]"
                onKeyDown={(e) => e.key === "Enter" && submitManualToken()}
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setShowManualCard(false)}
                  className="h-9 flex-1 rounded-xl border border-[#d9dfe4] text-[11px] font-semibold text-[#5f6770]"
                >
                  Cancel
                </button>
                <button
                  onClick={submitManualToken}
                  className="h-9 flex-1 rounded-xl bg-[#00A15E] text-[11px] font-semibold text-white"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
