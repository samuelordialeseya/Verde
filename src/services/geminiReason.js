/**
 * Fetches a single-sentence explanation from Gemini (when VITE_GEMINI_API_KEY is set).
 * Falls back to baseReason on missing key, network error, or CORS failure.
 */
export async function fetchGeminiVerdictSentence({ ecoMissionTitle, verdict, confidence, baseReason }) {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key || typeof key !== "string") return baseReason;

  const verdictLabel =
    verdict === "approved" ? "approved" : verdict === "rejected" ? "rejected" : "flagged for human review";

  const prompt = `You are Verde, a campus sustainability app. In exactly ONE short sentence (max 22 words), explain to a student why their EcoMission photo submission was ${verdictLabel}. Confidence: ${confidence}%. EcoMission: "${ecoMissionTitle}". Internal note (do not quote verbatim): ${baseReason}. Sound friendly and specific; no quotes in your answer.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 96, temperature: 0.35 },
      }),
    });
    if (!res.ok) return baseReason;
    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("")?.trim() || "";
    const oneLine = text.replace(/\s+/g, " ").trim();
    return oneLine || baseReason;
  } catch {
    return baseReason;
  }
}
