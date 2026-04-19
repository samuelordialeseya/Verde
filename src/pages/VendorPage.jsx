import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { BrowserMultiFormatReader } from "@zxing/library";
import { useAppStore } from "../context/appStore";

function VendorPage() {
  const { id } = useParams();
  const { consumeRedemptionToken } = useAppStore();
  const [manualToken, setManualToken] = useState("");
  const [status, setStatus] = useState("Ready to scan");
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    codeReaderRef.current = reader;

    async function run() {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!devices.length || !videoRef.current) return;
        reader.decodeFromVideoDevice(devices[0].deviceId, videoRef.current, (result) => {
          if (result) {
            const response = consumeRedemptionToken(result.getText());
            setStatus(response.ok ? `✅ ${response.message}` : `❌ ${response.message}`);
          }
        });
      } catch {
        setStatus("Camera unavailable. Use manual token input.");
      }
    }
    run();
    return () => reader.reset();
  }, [consumeRedemptionToken]);

  const submitManual = () => {
    const response = consumeRedemptionToken(manualToken.trim());
    setStatus(response.ok ? `✅ ${response.message}` : `❌ ${response.message}`);
  };

  return (
    <main className="min-h-screen bg-zinc-100 p-6">
      <div className="mx-auto max-w-xl space-y-4 rounded-2xl bg-white p-5 shadow-card">
        <h1 className="text-2xl font-semibold text-verde-700">Vendor Scanner</h1>
        <p className="text-sm text-zinc-600">Vendor ID: {id}</p>
        <video ref={videoRef} className="h-64 w-full rounded-xl bg-zinc-900 object-cover" />
        <div className="rounded-xl bg-zinc-100 p-3 text-sm">{status}</div>
        <div className="space-y-2">
          <label className="text-sm text-zinc-600">Manual token</label>
          <input value={manualToken} onChange={(e) => setManualToken(e.target.value)} className="w-full rounded-xl border border-zinc-200 px-3 py-2" placeholder="rdm-xxxx" />
          <button onClick={submitManual} className="w-full rounded-xl bg-verde-600 py-2 text-sm font-semibold text-white">Redeem</button>
        </div>
      </div>
    </main>
  );
}

export default VendorPage;
