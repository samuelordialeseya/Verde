# Verde 🌿
**Empowering Campus Sustainability through AI-Driven Eco-Incentives**

Verde is a digital sustainability hub designed for university campuses. It leverages AI (Google Cloud Vision API) to verify student eco-actions in real-time, rewarding them with "Leaves" (digital currency) that can be redeemed for discounts at campus vendors.

## 🚀 Key Features
- **AI Verification**: Real-time automated proof-of-action using Google Cloud Vision API.
- **EcoMissions**: Dynamic sustainability challenges (e.g., "Bring Your Own Tumbler", "Waste Segregation").
- **Liquid Glass Interface**: A premium, Apple-inspired UI designed for high engagement.
- **Admin Dashboard**: Comprehensive sustainability metrics, SDG tracking, and a manual review queue for ambiguous cases.
- **Vendor Integration**: Seamless QR-based redemption system for campus merchants.

## 🛠 Tech Stack
- **Frontend**: React + Vite + Vanilla CSS
- **Backend**: Firebase (Firestore, Functions, Hosting, Storage)
- **AI**: Google Cloud Vision API (LABEL_DETECTION, OBJECT_LOCALIZATION, OCR)
- **Design**: "Liquid Glass" design system with deep blurs and iridescence.

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
