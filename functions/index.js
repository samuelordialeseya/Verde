const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fetch = require("node-fetch");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.verifyEcoAction = onCall(
  {
    timeoutSeconds: 30,
    region: "asia-southeast1",
  },
  async (request) => {
    const { photoUrl, hint } = request.data;

    if (!photoUrl || typeof photoUrl !== "string") {
      throw new HttpsError("invalid-argument", "photoUrl is required");
    }
    if (!hint || typeof hint !== "string") {
      throw new HttpsError("invalid-argument", "hint is required");
    }

    let imageBase64;
    try {
      const response = await fetch(photoUrl);
      if (!response.ok) throw new Error("Failed to fetch image");

      const buffer = await response.buffer();
      imageBase64 = buffer.toString("base64");
    } catch (err) {
      throw new HttpsError("internal", `Image fetch failed: ${err.message}`);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = buildVerificationPrompt(hint);

    let geminiResponse;
    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: "image/jpeg",
          },
        },
      ]);

      geminiResponse = result.response.text();
    } catch (err) {
      throw new HttpsError("internal", `Gemini API error: ${err.message}`);
    }

    return parseGeminiResponse(geminiResponse);
  }
);

function buildVerificationPrompt(hint) {
  return `You are an eco-action verification assistant for a university sustainability app called Verde.

A student submitted this photo as proof of completing an eco-action.
The eco-action hint is: "${hint}"

Analyze the photo and determine:
1. Does the photo clearly show evidence of the described eco-action?
2. Is the photo genuine (not a stock image, screenshot, or AI-generated)?
3. How confident are you?

Respond ONLY in this exact JSON format — no other text:
{
  "approved": true or false,
  "confidence": 0.0 to 1.0,
  "reason": "One sentence explanation visible in the student's app"
}

Guidelines:
- confidence >= 0.75 = auto-approved
- confidence < 0.40 = auto-rejected
- between 0.40 and 0.75 = flagged for manual review
- Be lenient for clear, genuine eco-actions
- Reject if photo is obviously unrelated or a stock photo
- The reason should be encouraging even when rejecting`;
}

function parseGeminiResponse(rawText) {
  try {
    const cleaned = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return {
      approved: Boolean(parsed.approved),
      confidence: Math.min(1, Math.max(0, parseFloat(parsed.confidence) || 0)),
      reason: String(parsed.reason || "Verification complete"),
    };
  } catch {
    return {
      approved: false,
      confidence: 0.5,
      reason: "AI could not analyze the photo clearly. Sent for manual review.",
    };
  }
}
