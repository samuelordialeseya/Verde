# Verde 🌿
**Empowering Campus Sustainability through AI-Driven Eco-Incentives**

Verde is a digital sustainability hub designed for university campuses. It leverages the Google Cloud Vision API to verify student eco-actions in real-time, rewarding them with "Leaves" (digital currency) that can be redeemed for discounts at campus vendors.

## 🚀 Key Features
- **AI Verification**: Real-time automated proof-of-action using Google Cloud Vision API.
- **EcoMissions**: Dynamic sustainability challenges and task-based rewards.
- **Eco-Leaderboard**: Live ranking system to drive engagement and competition.
- **Admin Dashboard**: Comprehensive sustainability metrics and SDG tracking.
- **Vendor Integration**: Secure QR-based redemption system for discounts.

## 🛠 Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: JavaScript (Node.js) via Firebase Cloud Functions
- **Database**: Firebase Firestore (NoSQL)
- **AI**: Google Cloud Vision API (LABEL_DETECTION, OBJECT_LOCALIZATION, OCR)

## 🌍 SDG Alignment
Verde directly contributes to:
- **SDG 11**: Sustainable Cities and Communities
- **SDG 12**: Responsible Consumption and Production
- **SDG 13**: Climate Action

## 📦 Installation & Setup
1. Clone the repository.
2. Install dependencies: `npm install`
3. Create a `.env` file with your Firebase and API configuration (see `.env.example`).
4. Run locally: `npm run dev`
5. Build for production: `npm run build`

## 🔒 Security Note
Environment variables and sensitive API keys are excluded from this repository in accordance with security best practices.

---
*Built for the 2026 Hackathon Competition.*
