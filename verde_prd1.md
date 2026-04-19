# Verde — Product Requirements Document v2.0
### Complete Context for AI-Assisted Development

---

## 0. Read This First

This document is written for an AI coding assistant (Claude Code) that will help build Verde from scratch. Read every section before writing any code. Every decision in this PRD exists for a reason — the hackathon rubric, the demo environment, the 7-day timeline, and the real-world context of BatStateU all shape what gets built and what does not.

This is a **prototype for a hackathon demo.** The primary users during the demo are the developers themselves. Optimize for a smooth, impressive demo over production-grade security.

Do not add features not listed here. Do not simplify features listed here. When in doubt, ask.

---

## 1. What Is Verde

Verde is a web application built for Batangas State University (BatStateU) that solves the university's campus sustainability engagement problem by turning everyday eco-actions into a gamified, verified micro-economy.

**For students:** A feed of daily eco-challenges (bounties). Students complete a challenge, submit photo proof, and an AI instantly verifies the action and awards Verde Coins. Coins are redeemable for real discounts at campus vendors.

**For administrators:** A live dashboard that aggregates all verified student actions, tags them to UN Sustainable Development Goals (SDGs), and shows participation data — eliminating manual tracking.

Verde's core mechanism: the barrier to participation is as low as possible (5 seconds, one photo) and the reward is immediate and tangible (real peso-equivalent discounts). This is the direct solution to the low participation and minimal incentives problem defined in the hackathon brief.

---

## 2. Why This Is Being Built (Full Context)

### 2a. The Hackathon

Verde is being built for a university hackathon with a 7-day development window. The team is vibe-coding this — moving fast, prioritizing demo quality, and shipping a working prototype over a perfect product.

The judging rubric is:

| Criterion | Weight |
|---|---|
| Technical Implementation | 20% |
| Innovation and Creativity | 20% |
| Impact and Relevance to SDGs | 20% |
| Business Aspect | 20% |
| User Experience and Design | 10% |
| Pitch and Presentation | 10% |

Every feature in this PRD exists to score points on one or more of these criteria.

### 2b. The Problem — Area 11: Engagement and Behavioral Change

The hackathon problem domain is Area 11. The four specific pain points defined in the brief are:

- **Low participation in conservation efforts** — students don't join sustainability programs
- **Limited awareness of sustainable practices** — nobody reads policy documents or rulebooks
- **Lack of structured student programs** — sustainability governance is manual and unorganized
- **Minimal incentives for behavior change** — there is no reason for a student to change their habits

Verde maps directly to all four:

| Area 11 Pain Point | How Verde Solves It |
|---|---|
| Minimal incentives | Verde Coins = real peso discounts at the cafeteria — immediate, tangible reward |
| Low participation | Submitting a photo takes 5 seconds — lowest possible barrier to entry |
| Lack of structured programs | Admin bounty system = structured, scheduled, categorized eco-challenges |
| Limited awareness | The bounty feed surfaces sustainability actions daily in an app students actually open |

### 2c. BatStateU's Real Sustainability Context (Supporting Business Argument)

This is not a hypothetical — BatStateU has real sustainability infrastructure Verde complements:

- BatStateU ranked **300th out of 1,477 universities** in the 2024 UI GreenMetric World University Rankings. One key scoring category is student involvement. Verde directly feeds this metric as a secondary benefit.
- BatStateU established the **Center for Sustainable Development (CSD)** with the goal of supporting the UN's 17 SDGs.
- BatStateU has designated **Sustainability Development Officers (SDOs)** in every campus to track SDG-aligned programs — people who currently do this manually.
- BatStateU holds **ISO 9001:2015 certification**, meaning they already operate in a culture of documented processes.

**Important framing note:** The university administration angle is a *bonus selling point* for the Business Aspect criterion — not the core problem being solved. The core problem is always Area 11: student engagement and behavioral change.

### 2d. What Are SDGs

The UN Sustainable Development Goals (SDGs) are 17 global goals adopted in 2015. BatStateU has officially pledged to support all 17. Verde's eco-actions map primarily to:

- **SDG 11** — Sustainable Cities and Communities (campus waste, green spaces)
- **SDG 12** — Responsible Consumption and Production (reusable containers, reducing plastic)
- **SDG 13** — Climate Action (energy saving, unplugging devices, turning off lights)

When a student completes a bounty, the system logs which SDG that action belongs to. This is how Verde generates meaningful data for the admin dashboard and how it scores on the Impact and Relevance to SDGs rubric criterion.

### 2e. The Business Model

Verde operates as a three-sided economy:

**Universities** benefit from automated student participation data that previously required manual collection. Verde's compliance dashboard saves staff hours and improves GreenMetric scores. A university subscription model (₱5,000–₱10,000/month) replaces existing manual reporting costs.

**Vendors** (cafeterias, print shops) accept Verde Coins for discounts. In exchange they receive guaranteed foot traffic from motivated student spenders. They do not pay Verde cash — their discount contribution funds the coin economy.

**Students** earn real monetary value (peso-equivalent discounts) for 5 seconds of effort. Low barrier drives high participation volume, which drives data volume for the university.

Scale argument: There are **112 State Universities and Colleges (SUCs) in the Philippines**, all with similar sustainability mandates. BatStateU is the pilot.

---

## 3. Authentication — Simplified for Prototype

This is a hackathon prototype. The demo users are the developers themselves. A full authentication system with Google OAuth, role management, and security rules adds days of setup time with minimal demo value.

**Authentication approach: Simple role-based URL routing with no login wall.**

- The app has three separate entry points (routes):
  - `/student` — the student-facing app
  - `/admin` — the admin dashboard
  - `/vendor/:vendorId` — the vendor scanner page
- No login required. Anyone who knows the URL can access that role's view.
- For the demo, the team operates each view simultaneously (student on one tab, admin on another, vendor on a third).
- User identity for the student view is set by a simple "Enter your name" prompt on first visit, stored in localStorage. This is purely for display purposes (leaderboard name, transaction history label).
- A UUID is generated and stored in localStorage as the student's anonymous ID. This is used as the Firestore document key.
- There is no real authentication, no Firebase Auth, no JWT tokens. This is intentional for the prototype.

**What this saves:** 1–2 days of auth setup, Firebase security rules debugging, Google OAuth configuration, and role management complexity.

**What to tell judges if asked:** "Authentication is architected for Google Sign-In with BatStateU Gmail accounts in production. For this prototype we simplified access to focus demo time on the core features."

---

## 4. Users and Roles

There are exactly three user roles accessed via separate routes.

### Role 1: Student (`/student`)
- Sets a display name on first visit (stored in localStorage)
- Browses active bounties organized by theme
- Submits photo proof for a bounty
- Sees AI verification result in real time
- Views coin balance and transaction history
- Generates a QR code to redeem coins at a vendor
- Views leaderboard

### Role 2: Admin (`/admin`)
- Creates, edits, and deactivates bounties (with SDG tag, theme, time limit)
- Views the live sustainability dashboard (verified actions, SDG breakdown, leaderboard)
- Reviews AI-flagged submissions manually (approve or reject)
- Exports sustainability data as CSV

### Role 3: Vendor (`/vendor/:vendorId`)
- Accesses a minimal scanner page (no login)
- Scans a student's QR code using device camera
- Confirms redemption — deducts coins from student balance in real time
- Sees confirmation screen after successful scan

---

## 5. Bounty System (Core Feature)

### 5a. Bounty Structure

Bounties are time-limited eco-challenges created by admins. A student can claim each bounty **once per bounty lifetime** — one approved submission per student per bounty, no per-day resets. Multiple bounties can be active simultaneously, organized into themes.

**Bounty data model:**
```
bounty {
  id: string
  title: string
  description: string
  instructions: string           // specific guidance on what the photo must show
  coinReward: number
  sdgTag: number                 // SDG number (11, 12, or 13 for Verde's scope)
  sdgLabel: string               // e.g., "SDG 12 - Responsible Consumption"
  theme: "canteen" | "energy" | "waste" | "general"
  mediaType: "photo"             // video is out of scope for this prototype
  aiVerificationHint: string     // injected into the Gemini prompt for this bounty
  isActive: boolean
  createdAt: timestamp
  expiresAt: timestamp           // all bounties are time-limited — required field
  claimCount: number             // auto-incremented when a student successfully claims
}
```

**Claim tracking (one approved claim per student per bounty):**
```
claim {
  id: string
  studentId: string              // localStorage UUID
  bountyId: string
  submissionId: string
  claimedAt: timestamp
}
```

Before allowing submission, the app checks if a claim record exists for this student + bounty combination. If yes, the bounty shows as "Already Completed ✓" for that student and the submit button is hidden.

### 5b. The Three Bounty Themes

**Theme 1 — Canteen (SDG 12: Responsible Consumption)**

Focus: reducing single-use plastic in the university canteen.

| Bounty | What Student Submits | AI Checks For | Anti-Cheat Logic |
|---|---|---|---|
| "Bring Your Own Tumbler" | Photo of drink in a reusable tumbler/bottle with canteen background visible | Reusable container, liquid inside, canteen setting (tables, food stalls visible) | AI rejects: tumbler on a desk with no canteen context |
| "Zero Plastic Lunch" | Photo of full meal tray with no plastic wrappers or disposable utensils visible | Full tray in frame, no plastic packaging, canteen background | AI rejects: partial tray, or any plastic visible |
| "Reusable Bag at the Campus Store" | Photo of reusable bag with purchased items visibly inside | Reusable bag (not plastic sando bag), items inside bag | AI rejects: empty bag or plastic bag |

**Theme 2 — Energy (SDG 13: Climate Action)**

Focus: reducing unnecessary electricity consumption in classrooms and common areas.

| Bounty | What Student Submits | AI Checks For | Anti-Cheat Logic |
|---|---|---|---|
| "Lights Off in Empty Classroom" | Photo of empty classroom interior with lights OFF and light switch visible in OFF position | Classroom context (chairs, board, projector), lights off, switch in OFF position | AI rejects: dark photo without classroom context, switch not visible |
| "Unplug a Left-Behind Charger" | Photo of hand unplugging (or having just unplugged) a charger from a wall socket | Charger + socket in frame, hand interaction visible | AI rejects: charger photo with no hand, or charger already on floor |
| "Spot a Running Fan in an Empty Room" (report mode) | Photo of running electric fan in a room with no people visible | Fan visibly on (blades or motion), empty room, campus interior | AI rejects: fan in a home setting, or people visible in frame |

**Theme 3 — Waste (SDG 11: Sustainable Cities)**

Focus: correct waste segregation on campus.

| Bounty | What Student Submits | AI Checks For | Anti-Cheat Logic |
|---|---|---|---|
| "Segregate Plastic Correctly" | Photo of plastic waste item visibly **inside** the correct bin opening | Item partially inside bin opening (not just held next to it), correct bin color/label visible | AI rejects: item held next to bin, or item on the ground near bin |
| "Pick Up Litter" | Photo of hand picking up litter from the ground with campus floor visible below | Litter item in hand, floor visible below hand, campus context | AI rejects: just holding trash in the air with no floor context |
| "Use the Recycling Box for Old Papers" | Photo of papers being placed into a recycling box | Papers entering box opening, recycling box visible | AI rejects: papers next to box, or box with no papers |

### 5c. On The Video Bounty Idea (Barcode + Throw)

The idea of requiring students to film a barcode then throw the item to prove it is a new bottle every time is genuinely smart anti-cheat logic and should be noted in the pitch as a planned V2 feature.

**It is out of scope for this prototype** because:
- Gemini Vision video analysis requires frame extraction and sequence verification — significantly more complex than photo verification
- Video uploads on campus wifi are a demo failure risk
- The 7-day timeline does not accommodate this safely

For this prototype, the "Segregate Plastic Correctly" bounty uses the inside-the-bin photo requirement as the anti-cheat mechanism instead. Mention the video idea in the pitch as evidence the team thought deeply about integrity.

### 5d. Anti-Cheat Philosophy

Every bounty follows one rule: **the photo must show an action in progress or its immediate result — never just the subject of the action.**

- ❌ Photo of a tumbler sitting on a table → rejected
- ✅ Photo of a tumbler with drink inside, canteen background → approved
- ❌ Photo of a trash bin → rejected
- ✅ Photo of item visibly inside the bin opening → approved
- ❌ Dark room photo from outside doorway → rejected
- ✅ Dark classroom interior with light switch in OFF position visible → approved

The `aiVerificationHint` field on each bounty explicitly tells Gemini what a lazy or fake submission looks like for that specific challenge.

---

## 6. AI Photo Verification (The Killer Feature)

### 6a. How It Works

1. Student taps "Complete This" on a bounty
2. Camera opens (or file picker on desktop)
3. Student captures photo
4. Photo uploads to Firebase Storage — a storage URL is returned
5. App calls the backend proxy (Cloud Function or Express) with: photo URL + bounty data
6. Proxy assembles the Gemini prompt and calls the Gemini Vision API
7. Gemini returns a JSON verdict
8. App displays result card immediately
9. If approved: Firestore transaction credits coins + creates claim record + logs transaction

### 6b. The Gemini Prompt Template

```
You are a sustainability action verifier for a university eco-challenge app at Batangas State University in the Philippines.

The student is completing this challenge: "[BOUNTY_TITLE]"
Challenge description: "[BOUNTY_DESCRIPTION]"
What the photo must show: "[BOUNTY_INSTRUCTIONS]"
Specific verification criteria: "[AI_VERIFICATION_HINT]"

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
- "flagged": image appears fake, is a screenshot, or shows clear dishonesty — route to admin review
```

### 6c. Verdict Handling

| Verdict | Firestore Action | What Student Sees |
|---|---|---|
| `approved` | Coins credited, claim created, transaction logged | Green card: "✅ Approved — [reason] — Confidence: 94%" + coin animation |
| `rejected` | No coins, no claim created (student can resubmit) | Red card: "[reason] — Missing: [missingElements list]" |
| `flagged` | Submission saved with flagged status, coins held | Yellow card: "⚠️ Under Review — Our team will verify this manually" |

**Resubmission rule:** Rejected submissions do not create a claim record. The student can take a new photo and resubmit. The one-claim-per-bounty limit only activates on `approved`. A `flagged` submission locks the bounty for that student until admin resolves it.

### 6d. The Demo Money Shot

The AI result card is the most visually important moment in the entire demo. It must include:
- Large verdict icon (✅ ❌ ⚠️)
- Confidence percentage displayed as a visual progress bar
- The one-sentence reason from Gemini
- If approved: animated coin counter incrementing the student's balance in real time

This makes the invisible AI visible and memorable to judges.

---

## 7. Coin Wallet and Balance

**Student document in Firestore:**
```
student {
  id: string                     // UUID from localStorage
  displayName: string
  coinBalance: number            // current spendable balance
  totalEarned: number            // lifetime total — never decreases — used for leaderboard
  joinedAt: timestamp
}
```

**Transaction log:**
```
transaction {
  id: string
  studentId: string
  type: "earned" | "redeemed"
  amount: number
  description: string
  relatedSubmissionId: string | null
  relatedRedemptionId: string | null
  timestamp: timestamp
}
```

**Rules:**
- Coins credited only after `approved` verdict via atomic Firestore transaction
- Coins deducted only after vendor confirms QR scan via atomic Firestore transaction
- `coinBalance` cannot go below 0
- `totalEarned` only ever increases — leaderboard rank is never penalized by spending coins

---

## 8. QR Code Redemption

### The Full Flow
1. Student opens Wallet → enters coin amount to redeem (minimum: 10 coins)
2. App shows peso equivalent (50 coins = ₱5 discount)
3. App validates: sufficient balance? No pending QR already?
4. Redemption token created in Firestore with 5-minute expiry
5. QR code generated on screen encoding the token ID (UUID)
6. Student shows QR to vendor staff on their phone/laptop
7. Vendor's scanner page reads QR via device camera
8. App fetches and validates token: not expired, not already redeemed, student has balance
9. Atomic Firestore transaction: deduct coins from student, mark token redeemed, log transaction
10. Vendor sees: "✅ 50 coins redeemed — [Student Name] — ₱5 discount applied"
11. Student's wallet updates in real time via Firestore listener

### Redemption Token Data Model
```
redemption_token {
  id: string                     // UUID — encoded in the QR code
  studentId: string
  studentName: string
  coinAmount: number
  status: "pending" | "redeemed" | "expired"
  createdAt: timestamp
  expiresAt: timestamp           // createdAt + 5 minutes
  redeemedAt: timestamp | null
  vendorId: string | null
}
```

### Rules
- Single-use: once redeemed, status = "redeemed", further scans show error
- 5-minute expiry: enforced on scan, not just client-side
- Student cannot generate a new QR while one is pending
- All balance changes are atomic Firestore transactions — no partial states

---

## 9. Live Leaderboard

- Ranked by `totalEarned` (not current balance — spending coins does not drop your rank)
- Shows: rank number, display name, total coins earned, number of approved submissions
- Top 10 visible on student home feed and admin dashboard
- Updates via Firestore real-time listener — no page refresh needed

---

## 10. Admin Dashboard

### Panel 1 — Live Activity (real-time)
- Total verified actions today
- Total coins awarded today
- Number of unique students active today

### Panel 2 — SDG Breakdown
- Verified action count grouped by SDG tag
- "SDG 12: 142 | SDG 11: 89 | SDG 13: 34"
- This is Verde's direct contribution to BatStateU's GreenMetric student participation data

### Panel 3 — All-Time Stats
- Total verified actions (lifetime)
- Total unique participating students
- Most completed bounty by claim count

### Panel 4 — Flagged Submissions Queue
- List of all submissions with `verdict: "flagged"`
- Shows: student name, bounty title, submitted photo, AI reason, confidence score
- Admin actions: Approve (credits coins, converts submission to approved) | Reject (no coins, student notified via UI)

### Panel 5 — Bounty Management
- Full list of all bounties with active status, claim count, expiry time remaining
- Create new bounty form: all fields including aiVerificationHint
- Toggle active/inactive per bounty
- Expired bounties auto-show as inactive

### Panel 6 — CSV Export
- Single button: "Export Sustainability Report"
- Generates CSV client-side using papaparse
- Columns: date, student name, bounty title, theme, SDG number, SDG label, coins awarded, verdict
- **The pitch moment:** "Every action students took today is now one row in BatStateU's sustainability report. No paper forms. No manual encoding. Just Verde."

---

## 11. Vendor Scanner Page

Route: `/vendor/:vendorId`

Contents:
- Vendor name header (e.g., "Main Canteen — Verde Partner 🌿")
- Live camera viewfinder scanning for QR codes (html5-qrcode or @zxing/library)
- On valid scan + successful redemption: confirmation card with student name, coins redeemed, peso equivalent, timestamp
- On error: specific error message — "QR Code Expired", "Already Redeemed", "Insufficient Balance", "Invalid QR Code"

Vendor documents are pre-seeded in Firestore. No vendor login or account creation UI needed.

---

## 12. Pre-Loaded Demo Bounties

These five bounties must be seeded before the presentation:

| Title | Theme | SDG | Coins | Purpose |
|---|---|---|---|---|
| Bring Your Own Tumbler | Canteen | SDG 12 | 50 | **Live demo bounty** — complete this on stage |
| Lights Off in Empty Classroom | Energy | SDG 13 | 40 | **Live demo bounty** — find a classroom on stage |
| Segregate Plastic Correctly | Waste | SDG 11 | 30 | **Live demo bounty** — throw bottle in bin |
| Zero Plastic Lunch | Canteen | SDG 12 | 60 | Pre-seeded as completed by demo students |
| Unplug a Left-Behind Charger | Energy | SDG 13 | 35 | Pre-seeded as completed by demo students |

---

## 13. What Is NOT In Scope

Do not build any of the following. Explicitly out of scope for the 7-day prototype:

- Firebase Authentication or Google Sign-In of any kind
- Push notifications
- Social features (sharing, friend lists, following, commenting)
- Video submission (V2 feature)
- Barcode/QR scanning on physical items (V2 feature)
- Multi-tier coin rewards or dynamic pricing
- Email or SMS notifications
- Mobile native app — web only, phone browser must work
- Offline mode
- Admin user management UI (no role assignment screens)
- Vendor account creation UI (vendors are pre-seeded)
- Per-vendor redemption analytics
- Student profile editing beyond display name

---

## 14. Tech Stack

### Frontend
- **React** with **Vite**
- **Tailwind CSS**
- **React Router** — three routes: `/student`, `/admin`, `/vendor/:id`
- **react-qr-code** — QR generation on student wallet page
- **html5-qrcode** or **@zxing/library** — QR scanning on vendor page
- **papaparse** — CSV export on admin dashboard
- **date-fns** — countdown timers, date formatting
- **React Context** or **Zustand** — global state for student identity and coin balance

### Backend / Database
- **Firebase Firestore** — all collections
- **Firebase Storage** — submitted photos
- **Firestore real-time listeners** — coin balance, leaderboard, dashboard panels, bounty feed (all live, no page refresh)

### AI
- **Google Gemini Vision API** (gemini-1.5-flash — fast response time, has free tier)
- **Option A (preferred):** Firebase Cloud Functions — `onCall` function proxies Gemini call server-side
- **Option B (fallback):** Express.js server on Railway or Render as proxy
- API key must never be in the client bundle (never use VITE_ prefix for GEMINI_API_KEY)

### Deployment
- **Vercel** — React frontend, deploy from Day 1
- **Firebase** — all backend services

### Environment Variables
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
GEMINI_API_KEY                    // server-side only
```

---

## 15. Firestore Collections

```
/students/{studentId}             // anonymous UUID from localStorage
/bounties/{bountyId}
/submissions/{submissionId}
/claims/{claimId}                 // one per student per bounty (approved only)
/transactions/{transactionId}
/redemption_tokens/{tokenId}
/vendors/{vendorId}               // pre-seeded
```

---

## 16. Demo Flow — 10 Steps (Optimize Everything For This)

1. **Admin tab** — creates bounty live: "Bring Your Own Tumbler — 50 Coins | SDG 12 | Expires in 24 hours"
2. **Student tab** — bounty appears instantly in feed (real-time listener)
3. **Student taps "Complete This"** — camera opens — photo of tumbler with drink inside, canteen background
4. **AI result card** — "✅ Approved — Reusable container with beverage detected in canteen setting — Confidence: 91%"
5. **Coin balance** — animates from 0 to 50 in real time
6. **Student opens Wallet** — enters 50 coins — QR code appears on screen
7. **Vendor tab (separate device)** — scans QR — "✅ 50 coins redeemed — [Name] — ₱5 discount applied"
8. **Admin dashboard** — 1 verified action today | SDG 12: 1 action | leaderboard updated
9. **Admin clicks Export CSV** — file downloads — opens to show the verified action as a row
10. **Pitch line:** "That row is BatStateU's sustainability report entry. Automatic. Zero manual work."

---

## 17. Seeded Demo Data

Run `scripts/seed.js` before the presentation to populate Firebase:

- 50 student records with Filipino display names and varied coin balances
- 200 approved submissions distributed across the 5 pre-loaded bounties
- SDG distribution: ~100 SDG 12, ~65 SDG 11, ~35 SDG 13
- Top 10 leaderboard with realistic data
- 2 pre-configured vendors: "Main Canteen" (`/vendor/main-canteen`) and "Engineering Print Shop" (`/vendor/eng-print`)

---

## 18. Day-by-Day Build Order

**Day 1:** Firebase project setup. React + Vite + Tailwind. Three-route structure. localStorage student identity (name + UUID). Deploy blank to Vercel — have a live URL by end of day.

**Day 2:** Bounty system. Admin creates bounties (all fields). Student bounty feed with real-time updates. Claim checking (Already Completed state). Theme filtering.

**Day 3:** Camera integration. Gemini API proxy (Cloud Function or Express). Full AI verification flow: photo → upload → Gemini → verdict display → coins credited. This is the hardest day — start early.

**Day 4:** Coin wallet. QR code generation. Vendor scanner page. Atomic coin deduction on redemption. Transaction history. Real-time balance via Firestore listener.

**Day 5:** Admin dashboard — all panels, real-time stats, SDG breakdown, flagged queue, bounty management, CSV export. Run seed script. Confirm dashboard looks alive with data.

**Day 6:** Full UI polish — mobile-first layout on every screen, loading states, error states, empty states, bounty expiry countdown timers, AI result confidence bar animation. Final seed data pass.

**Day 7:** Demo rehearsal only. Zero new code. Run the 10-step demo flow 10 times as a full team. Fix only demo-blocking bugs.

---

*Verde PRD v2.0 — BatStateU Hackathon — 7-Day Sprint — Area 11: Engagement and Behavioral Change*
