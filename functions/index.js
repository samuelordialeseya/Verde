const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const fetch = require("node-fetch");
const VISION_API_KEY_SECRET = defineSecret("VISION_API_KEY");

// Global init removed to prevent cold-start crashes. Init happens inside handler.

exports.verifyEcoAction = onCall(
  {
    timeoutSeconds: 30,
    region: "asia-southeast1",
    cors: true,
    secrets: [VISION_API_KEY_SECRET],
  },
  async (request) => {
    return await runVerification(request.data);
  }
);

exports.verifyEcoActionHttp = onRequest(
  {
    timeoutSeconds: 30,
    region: "asia-southeast1",
    secrets: [VISION_API_KEY_SECRET],
  },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const result = await runVerification(req.body || {});
      res.status(200).json(result);
    } catch (err) {
      const message = err?.message || "Verification failed";
      res.status(400).json({ error: message });
    }
  }
);

async function runVerification(data) {
    console.log("--- Starting AI Verification ---");
    const { photoUrl, bountyTitle, bountyDescription, bountyInstructions, aiVerificationHint } = data;

    const apiKey = getVisionApiKey();

    // Verify API Key existence at runtime
    if (!apiKey) {
      console.error("CRITICAL: VISION_API_KEY/GOOGLE_API_KEY is missing from environment variables!");
      throw new HttpsError("failed-precondition", "AI service is not configured (API key missing).");
    }

    if (!photoUrl || typeof photoUrl !== "string") {
      throw new HttpsError("invalid-argument", "photoUrl is required");
    }
    const safeHint = typeof aiVerificationHint === "string" && aiVerificationHint.trim()
      ? aiVerificationHint.trim()
      : "Use the challenge title, description, and instructions as the full criteria.";

    let imageBase64;
    let imageMimeType = "image/jpeg";
    try {
      console.log(`Fetching photo: ${photoUrl.substring(0, 50)}...`);
      const response = await fetch(photoUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const buffer = await response.buffer();
      imageBase64 = buffer.toString("base64");
      const responseType = response.headers.get("content-type");
      if (responseType && responseType.startsWith("image/")) {
        imageMimeType = responseType.split(";")[0];
      }
      console.log("Photo successfully downloaded and converted to Base64");
    } catch (err) {
      console.error("Image Fetch Error:", err);
      throw new HttpsError("internal", `Image fetch failed: ${err.message}`);
    }

    try {
      const visionData = await callVisionApi(apiKey, imageBase64);
      const parsed = buildVisionVerdict({
        title: bountyTitle,
        description: bountyDescription,
        instructions: bountyInstructions,
        hint: safeHint,
        visionData,
      });
      console.log(`Verification Complete (Vision) - Verdict: ${parsed.verdict}`);
      return parsed;
    } catch (err) {
      console.error("Vision API Error:", err);
      return buildAiFailureResult(err);
    }
}

function buildAiFailureResult(err) {
  const raw = String(err?.message || "");
  const lower = raw.toLowerCase();
  const isQuotaError = raw.includes("429") || lower.includes("quota") || lower.includes("too many requests");
  const isUnavailable = raw.includes("404") || lower.includes("not found") || lower.includes("permission");
  const isInvalidKey = lower.includes("api key not valid") || lower.includes("invalid api key");
  const isExpiredKey = lower.includes("api key expired");

  let reason = "AI verification is temporarily unavailable. Sent for manual review.";
  if (isQuotaError) {
    reason = "AI verification quota is exhausted right now. Sent for manual review.";
  } else if (isExpiredKey) {
    reason = "Vision API key is expired. Update the backend secret and redeploy.";
  } else if (isInvalidKey) {
    reason = "Vision API key is invalid for this project. Update backend secret.";
  } else if (isUnavailable) {
    reason = "AI verification service is currently unavailable. Sent for manual review.";
  }

  return {
    verdict: "flagged",
    confidence: 0,
    reason,
    isSuspicious: false,
    missingElements: [],
  };
}

async function callVisionApi(apiKey, imageBase64) {
  const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
  const body = {
    requests: [
      {
        image: { content: imageBase64 },
        features: [
          { type: "LABEL_DETECTION", maxResults: 20 },
          { type: "OBJECT_LOCALIZATION", maxResults: 20 },
          { type: "TEXT_DETECTION", maxResults: 1 },
          { type: "SAFE_SEARCH_DETECTION" },
        ],
      },
    ],
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = payload?.error?.message || `Vision API error (${response.status})`;
    throw new Error(details);
  }

  return payload?.responses?.[0] || {};
}

function buildVisionVerdict({ title, description, instructions, hint, visionData }) {
  const labels = (visionData.labelAnnotations || []).map((x) => String(x.description || "").toLowerCase());
  const objects = (visionData.localizedObjectAnnotations || []).map((x) => String(x.name || "").toLowerCase());
  const textBlob = String(visionData.fullTextAnnotation?.text || "").toLowerCase();
  const joinedSignals = `${title || ""} ${description || ""} ${instructions || ""} ${hint || ""}`.toLowerCase();

  const missingElements = [];
  const suspiciousHits = [];

  const signalSet = new Set([...labels, ...objects]);
  const hasAny = (keywords) => keywords.some((k) => signalSet.has(k));
  const hasText = (keywords) => keywords.some((k) => textBlob.includes(k));

  if (hasText(["screenshot", "facebook", "instagram", "youtube", "tiktok"])) {
    suspiciousHits.push("image appears to contain screen/app text");
  }

  if (joinedSignals.includes("canteen")) {
    if (!hasAny(["tableware", "drink", "cup", "bottle", "food"])) {
      missingElements.push("canteen-related food or drink context");
    }
  }
  if (joinedSignals.includes("tumbler") || joinedSignals.includes("reusable")) {
    if (!hasAny(["bottle", "cup", "drinkware"])) {
      missingElements.push("reusable tumbler/cup");
    }
  }
  if (joinedSignals.includes("plastic")) {
    if (!hasAny(["plastic", "bottle", "waste"])) {
      missingElements.push("visible plastic waste item");
    }
  }
  if (joinedSignals.includes("bin") || joinedSignals.includes("recycling")) {
    if (!hasAny(["recycling bin", "waste container", "trash can"])) {
      missingElements.push("waste/recycling bin");
    }
  }
  if (joinedSignals.includes("classroom") || joinedSignals.includes("lights")) {
    if (!hasAny(["classroom", "school", "chair", "desk"])) {
      missingElements.push("classroom context");
    }
  }
  if (joinedSignals.includes("charger") || joinedSignals.includes("socket") || joinedSignals.includes("unplug")) {
    if (!hasAny(["electronic device", "charger", "plug"])) {
      missingElements.push("charger and socket interaction");
    }
  }

  const isSuspicious = suspiciousHits.length > 0;
  const confidenceBase = Math.min(1, Math.max(0.1, (labels.length + objects.length) / 20));

  if (isSuspicious) {
    return {
      verdict: "flagged",
      confidence: Math.min(0.85, confidenceBase),
      reason: "Photo appears suspicious for auto-verification and was sent for manual review.",
      isSuspicious: true,
      missingElements,
    };
  }

  if (missingElements.length > 0) {
    return {
      verdict: "rejected",
      confidence: Math.min(0.8, confidenceBase),
      reason: "Photo does not clearly show all required bounty evidence.",
      isSuspicious: false,
      missingElements,
    };
  }

  return {
    verdict: "approved",
    confidence: Math.max(0.6, confidenceBase),
    reason: "Photo contains the expected visual evidence for this bounty.",
    isSuspicious: false,
    missingElements: [],
  };
}

function getVisionApiKey() {
  const secretValue = VISION_API_KEY_SECRET.value();
  if (secretValue) return secretValue;
  if (process.env.VISION_API_KEY) return process.env.VISION_API_KEY;
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (process.env.GEMINI_KEY) return process.env.GEMINI_KEY;
  return null;
}
