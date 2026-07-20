<p align="center">
  <img
    src="public/brand-leaf.svg"
    alt="Verde Logo"
    width="72"
    style="background:#ffffff;padding:24px;border-radius:16px;display:inline-block;"
  />
</p>

<h1 align="center">Verde — AI-Powered Campus Sustainability & Rewards Platform</h1>

<p align="center">
  <strong>CICS TechnoFusion Hackathon 2026 — Team Hakatun</strong><br/>
  A campus sustainability app that turns everyday eco-actions into verified rewards
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Google%20Cloud%20Vision-AI-4285F4?logo=googlecloud&logoColor=white" alt="Google Cloud Vision" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

---

## About Verde

Verde is a comprehensive campus sustainability platform built for **Batangas State University (BatStateU)** that solves **Area 11: Engagement and Behavioral Change** by turning everyday eco-actions into a gamified, verified micro-economy.

**For students:** Browse daily eco-challenges (bounties), submit photo proof, get instant AI verification, earn Verde Coins, and redeem them for real campus discounts.

**For administrators:** A live dashboard aggregates verified student actions, tags them to UN Sustainable Development Goals (SDGs), and exports sustainability reports — eliminating manual tracking.

**For vendors:** Scan student QR codes to confirm coin redemptions in real time at campus partners like the canteen and print shop.

Verde's core mechanism: the barrier to participation is as low as possible (5 seconds, one photo) and the reward is immediate and tangible (peso-equivalent discounts).

---

## Why Verde?

- **Real-World Application:** Not a template project — a working prototype with student, admin, and vendor flows
- **AI Verification:** Google Cloud Vision API analyzes photo proof and returns `approved`, `rejected`, or `flagged` verdicts
- **Three-Sided Economy:** Students earn coins, vendors accept redemptions, admins track SDG impact
- **Live Backend:** Firebase Firestore real-time listeners, Cloud Functions, and Storage
- **End-to-End Flow:** Student submission, AI verification, coin rewards, and vendor redemption in one system

---

## Platforms Supported

### Web (Primary Platform)

- **Target:** Modern browsers (Chrome, Safari, Edge, Firefox)
- **Mobile:** Responsive phone-first UI with camera capture support
- **Desktop:** Full admin dashboard and vendor scanner
- **Routes:**
  - `/student` — Student app (bounties, wallet, leaderboard)
  - `/admin` — Admin dashboard (bounty management, flagged queue, CSV export)
  - `/vendor/:vendorId` — Vendor QR scanner (e.g. `/vendor/main-canteen`)

---

## Core Features

### Student Experience

- **Bounty Feed:** Active eco-challenges organized by theme (Canteen, Energy, Waste)
- **Photo Submission:** Camera capture or file upload with pre-submission photo tips
- **AI Verification:** Instant verdict with confidence score and reason
- **Verde Coin Wallet:** Balance tracking, transaction history, peso equivalent display
- **QR Redemption:** Generate time-limited QR codes to redeem coins at vendors
- **Leaderboard:** Campus rankings by total coins earned

### Admin Dashboard

- **Live Activity Panel:** Verified actions, coins awarded, active students (real-time)
- **SDG Breakdown:** Actions grouped by SDG 11, 12, and 13
- **Flagged Submissions Queue:** Manual review for suspicious or unclear AI verdicts
- **Bounty Management:** Create, edit, activate/deactivate bounties with AI verification hints
- **CSV Export:** One-click sustainability report download

### Vendor Scanner

- **QR Code Scanning:** Device camera via `@zxing/library`
- **Real-Time Redemption:** Atomic coin deduction with confirmation screen
- **Error Handling:** Expired, already redeemed, insufficient balance, invalid QR

### AI Photo Verification

- **Provider:** Google Cloud Vision API (label detection, object localization, OCR, safe search)
- **Rule Engine:** Maps Vision signals to bounty-specific criteria
- **Verdicts:**
  - `approved` — Evidence clearly visible, coins credited
  - `rejected` — Missing required elements, student can retake photo
  - `flagged` — Suspicious or ambiguous, routed to admin review
- **Backend:** Firebase Cloud Functions (`verifyEcoAction`, `verifyEcoActionHttp`)

---

## Bounty Themes & SDG Mapping

| Theme | SDG | Example Bounties |
|---|---|---|
| **Canteen** | SDG 12 — Responsible Consumption | Bring Your Own Tumbler, Zero Plastic Lunch |
| **Energy** | SDG 13 — Climate Action | Lights Off in Empty Classroom, Unplug Charger |
| **Waste** | SDG 11 — Sustainable Cities | Segregate Plastic Correctly, Pick Up Litter |

---

## Technical Architecture

### Project Structure

```
Verde/
├── src/
│   ├── pages/              # StudentPage, AdminPage, VendorPage
│   ├── components/         # PhoneFrame, BottomNav, NameModal
│   ├── services/           # bounties, submissions, wallet, students, admin
│   ├── hooks/              # useRealBackendStore
│   ├── lib/                # Firebase client init
│   └── data/               # Seed data
├── functions/
│   └── index.js            # Cloud Functions (Vision API verification)
├── scripts/
│   └── seed.cjs            # Firestore seed script
├── public/                 # Static assets
├── firebase.json           # Firebase project config
├── firestore.rules         # Firestore security rules
├── storage.rules           # Storage security rules
└── vite.config.js          # Vite + dev proxy for Cloud Functions
```

### Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, React Router 7 |
| **State** | Zustand, React Context, Firestore real-time listeners |
| **Backend** | Firebase Firestore, Storage, Cloud Functions v2 |
| **AI** | Google Cloud Vision API |
| **QR** | react-qr-code (generation), @zxing/library (scanning) |
| **Export** | papaparse (CSV) |
| **Dates** | date-fns |

### Firestore Collections

```
/students/{studentId}
/bounties/{bountyId}
/submissions/{submissionId}
/claims/{claimId}
/transactions/{transactionId}
/redemption_tokens/{tokenId}
/vendors/{vendorId}
```

---

## Installation & Setup

### Prerequisites

- **Node.js:** 18+ (20 recommended for Cloud Functions)
- **npm:** 9+
- **Firebase CLI:** `npm install -g firebase-tools`
- **Git:** For cloning the repository

### Clone the Repository

```bash
git clone https://github.com/samuelordialeseya/Verde.git
cd Verde
npm install
cd functions && npm install && cd ..
```

### Setup Environment Variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Setup Cloud Functions Secret

```bash
firebase login
firebase use your_project_id
firebase functions:secrets:set VISION_API_KEY
firebase deploy --only functions
```

**Get API Keys:**

- **Firebase:** [Firebase Console](https://console.firebase.google.com/) → Create project → Add web app
- **Google Cloud Vision:** [Google Cloud Console](https://console.cloud.google.com/) → Enable Cloud Vision API → Create API key

### Seed Demo Data (Optional)

```bash
node scripts/seed.cjs
```

---

## Running the App

### Development

```bash
npm run dev
```

Open:
- Student: `http://localhost:5173/student`
- Admin: `http://localhost:5173/admin`
- Vendor: `http://localhost:5173/vendor/main-canteen`

### Production Build

```bash
npm run build
npm run preview
```

### Deploy to Firebase Hosting

```bash
firebase deploy
```

---

## App Flow

1. **Admin** creates a bounty: "Bring Your Own Tumbler — 50 Coins | SDG 12"
2. **Student** sees the bounty appear in the feed (real-time listener)
3. **Student** taps "Complete This" → camera opens → submits photo
4. **AI result card** — verdict, confidence score, and reason are shown
5. **Coin balance** updates if the submission is approved
6. **Student** opens Wallet → selects amount → generates a QR code
7. **Vendor** scans the QR → redemption is confirmed and coins are deducted
8. **Admin dashboard** reflects the verified action and SDG breakdown
9. **Admin** exports CSV — each verified action becomes one report row

---

## Feature Comparison

| Feature | Student | Admin | Vendor |
|---|:---:|:---:|:---:|
| Bounty browsing | Yes | Yes | — |
| Photo submission | Yes | — | — |
| AI verification | Yes | — | — |
| Coin wallet | Yes | — | — |
| QR redemption | Yes | — | — |
| Leaderboard | Yes | Yes | — |
| Live dashboard | — | Yes | — |
| Bounty management | — | Yes | — |
| Flagged review queue | — | Yes | — |
| CSV export | — | Yes | — |
| QR scanning | — | — | Yes |
| Redemption confirmation | — | — | Yes |

---

## Why This Project Stands Out

### 1. Solves a Real Campus Problem

- Directly addresses BatStateU's sustainability engagement gap (Area 11)
- Maps every action to UN SDGs for institutional reporting
- Complements BatStateU's UI GreenMetric ranking and CSD initiatives

### 2. AI-Powered Verification

- Not mock verification — real Google Cloud Vision API integration
- Rule-based verdict engine aligned with bounty-specific criteria
- Anti-cheat logic: requires action-in-progress photos, not static objects

### 3. Complete Three-Sided Economy

- Students earn tangible rewards (peso-equivalent discounts)
- Vendors gain foot traffic through coin redemptions
- Admins get automated sustainability data without manual encoding

### 4. Production-Grade Architecture

- Firebase real-time sync across all three roles
- Atomic Firestore transactions for coin credits and deductions
- Server-side API key protection via Cloud Functions secrets
- Graceful fallback when AI service is unavailable

---

## Development

### Build Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Lint
npm run lint

# Production build
npm run build

# Preview production build
npm run preview

# Deploy functions only
firebase deploy --only functions

# Deploy everything
firebase deploy
```

### Key Components

| Component | Purpose |
|---|---|
| `StudentPage.jsx` | Student UI — bounties, submit, wallet, leaderboard |
| `AdminPage.jsx` | Admin dashboard — stats, bounties, flagged queue, CSV |
| `VendorPage.jsx` | QR scanner and redemption confirmation |
| `submissions.js` | Photo upload, AI verification call, verdict handling |
| `wallet.js` | Coin balance, redemption tokens, transactions |
| `functions/index.js` | Vision API proxy and rule-based verdict engine |

---

## Team

Built by **Team Hakatun** during the CICS TechnoFusion Hackathon 2026.

| Role | Contributor |
|---|---|
| Backend & AI Verification | Samuel Ordiales |
| Backend | Zairus Jay Opinion |
| Frontend | John Allen Alvarez |
| Frontend & UI | Onikka Mae Buela |
| Backend | Jairus Opinion |

**Repository:** [github.com/samuelordialeseya/Verde](https://github.com/samuelordialeseya/Verde)

---

## License

This project was developed as part of the CICS TechnoFusion Hackathon 2026.

---

<p align="center">
  <strong>Verde</strong><br/>
  Turning everyday eco-actions into verified campus impact. 🌿
</p>
