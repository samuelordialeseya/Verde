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
    const { photoUrl, bountyTitle, bountyDescription, bountyInstructions, aiVerificationHint } = request.data;

    if (!photoUrl || typeof photoUrl !== "string") {
      throw new HttpsError("invalid-argument", "photoUrl is required");
    }
    if (!aiVerificationHint || typeof aiVerificationHint !== "string") {
      throw new HttpsError("invalid-argument", "aiVerificationHint is required");
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

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = buildVerificationPrompt(bountyTitle, bountyDescription, bountyInstructions, aiVerificationHint);

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

function buildVerificationPrompt(title, description, instructions, hint) {
  return `You are a sustainability action verifier for a university eco-challenge app at Batangas State University in the Philippines.

The student is completing this challenge: "${title}"
Challenge description: "${description}"
What the photo must show: "${instructions}"
Specific verification criteria: "${hint}"

Analyze the submitted image and evaluate:
1. Does the image show clear evidence of completing this specific challenge?
2. Does the image meet the specific visual criteria listed above?
3. Does the image appear to be a genuine real-time photo (not a screenshot, stock photo, or image taken from a screen)?

Signs of a fake photo: perfect studio lighting with no shadows, image appears to be a photo of a phone screen, watermarks present, background is a solid color with no environmental context, or the image looks downloaded rather than captured live.

Important: Be strict about context. A reusable tumbler on a desk proves nothing — it must be in a canteen with food or drink inside. An empty bin proves nothing — the item must be visibly inside the bin opening. An unlit room proves nothing — the light switch must be visible in the OFF position inside a classroom.

Respond ONLY with a valid JSON object. No explanation outside the JSON. No markdown. Raw JSON only:
{
  "verdict": "approved" | "rejected" | "flagged",
  "confidence": 0.0 to 1.0,
  "reason": "one sentence explanation visible to the student",
  "isSuspicious": true | false,
  "missingElements": ["list of specific things missing if rejected — empty array if approved"]
}

Verdict definitions:
- "approved": image clearly and specifically shows the completed challenge with all required context
- "rejected": image does not adequately show the completed challenge (populate missingElements)
- "flagged": image appears fake, is a screenshot, or shows clear dishonesty — route to admin review`;
}

function parseGeminiResponse(rawText) {
  try {
    const parsed = JSON.parse(rawText.trim());

    return {
      verdict: ["approved", "rejected", "flagged"].includes(parsed.verdict) ? parsed.verdict : "flagged",
      confidence: Math.min(1, Math.max(0, parseFloat(parsed.confidence) || 0)),
      reason: String(parsed.reason || "Verification complete"),
      isSuspicious: Boolean(parsed.isSuspicious),
      missingElements: Array.isArray(parsed.missingElements) ? parsed.missingElements.map(String) : [],
    };
  } catch {
    return {
      verdict: "flagged",
      confidence: 0.5,
      reason: "AI could not analyze the photo clearly. Sent for manual review.",
      isSuspicious: false,
      missingElements: [],
    };
  }
}
