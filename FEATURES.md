# Verde: Feature & Technical Documentation 🌿

This document provides a detailed breakdown of the features, underlying logic, and technical implementation of the Verde platform for the 2026 Hackathon judges.

---

## 1. AI Eco-Action Verification
**What it is:** The core engine that validates student actions using computer vision.
*   **How it works:** When a student submits a photo for an EcoMission (e.g., a photo of a reusable tumbler), the image is uploaded to Firebase Storage. The URL is then sent to a Firebase Cloud Function.
*   **Logic:**
    1.  **Detection**: The Cloud Function calls the **Google Cloud Vision API** to perform `LABEL_DETECTION` (identifying general objects) and `OBJECT_LOCALIZATION` (finding specific items).
    2.  **Heuristics**: A custom algorithm (`buildVisionVerdict`) compares the API results against the mission's requirements (e.g., if the mission is "Tumbler", it looks for labels like "bottle" or "cup").
    3.  **Confidence Scoring**: The system calculates a confidence score based on the number of relevant labels found.
    4.  **Auto-Verdict**: 
        *   **Approved**: High confidence match.
        *   **Rejected**: Clear mismatch (e.g., no plastic found for a recycling mission).
        *   **Flagged**: Low confidence or suspicious image (sends to Admin for review).

## 2. Dynamic EcoMissions
**What it is:** A task-based system where students complete specific sustainability challenges.
*   **How it works:** Administrators can create missions with specific rewards (Leaves), descriptions, and SDG tags.
*   **Logic:** Missions are stored in a Firestore collection (`ecoMissions`). The student interface fetches these in real-time. The system prevents duplicate claims for the same mission by checking the `claims` collection before allowing a submission.

## 3. "Leaves" Digital Currency & Wallet
**What it is:** A gamified incentive system to reward sustainable behavior.
*   **How it works:** Students earn "Leaves" for every approved EcoMission.
*   **Logic:**
    1.  **Escrow**: When a student requests a discount, the required Leaves are "escrowed" (deducted and held in a `redemption_tokens` document).
    2.  **Transaction History**: Every earn/spend action is logged in a `transactions` collection for transparency and auditing.

## 4. QR-Based Vendor Redemption
**What it is:** A secure way for campus vendors to process student discounts.
*   **How it works:** 
    1.  A student generates a QR code for a specific amount of Leaves.
    2.  The vendor scans the QR code using the **Vendor Interface**.
    3.  The backend verifies the token's validity, expiration, and status.
*   **Logic:** Once scanned, the token status changes to `redeemed`. This ensures a single-use policy, preventing students from using the same discount twice.

## 5. Admin Sustainability Dashboard
**What it is:** A command center for university officials to track campus-wide impact.
*   **How it works:** Aggregates real-time data from all student submissions and transactions.
*   **Logic:**
    1.  **Metric Calculation**: Calculates "Waste Diverted" by multiplying approved "Waste/Canteen" missions by a standard weight (e.g., 0.05kg per action).
    2.  **SDG Tracking**: Maps every mission to specific Sustainable Development Goals (SDGs 11, 12, 13) to provide audit-ready reporting.
    3.  **Human-in-the-Loop**: Provides a manual review queue for "Flagged" AI submissions, ensuring 100% data integrity.

## 6. Live Eco-Leaderboard
**What it is:** A social feature to drive healthy competition among students.
*   **How it works:** Ranks students based on their total earned Leaves.
*   **Logic:** Uses a Firestore listener on the `students` collection, sorted by `totalEarned`. The UI displays a podium for the top 3 and a scrollable ranking for the rest of the campus.

---

## 🛠 Technical Specifications
- **Framework**: React + Vite
- **Styling**: Tailwind CSS + Custom CSS (Hybrid Design)
- **Backend**: JavaScript (Node.js) via Firebase Cloud Functions.
- **Database**: Firebase Firestore (NoSQL).
- **Storage**: Firebase Storage (for proof-of-action media).
- **Authentication**: Firebase Auth.
