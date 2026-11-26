# 👑 Royal Gaming Club - Casino & Card Gaming Platform

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/License-MIT-gold?style=for-the-badge" alt="License" />
</p>

An all-in-one luxury casino and Indian card gaming web platform featuring **5 playable games** integrated into a single high-performance dashboard with realistic sounds, animations, and a reloadable virtual wallet system.

---

## 🎮 Included Games

| Game | Type | Features |
|---|---|---|
| 🐉 **Dragon vs Tiger** | Fast Card Duel | 12s live betting countdown, 2x & 9x payouts, bead road trend tracker |
| 🔴 **Red Green Violet** | Color Prediction | 30s period rounds, Red (2x), Green (2x), Violet (4.5x), Numbers 0-9 (9x), live records |
| 🎴 **Andar Bahar** | Classic Card Game | Opening Joker card, alternating card deal animation, match detector, clear bets option |
| 🃏 **Teen Patti (3 Patti)** | Table Card Game | 3-player AI table, See Cards, Blind, Chaal, Pack, Show with genuine hand ranking |
| 🂠 **Indian Rummy** | 13-Card Points Rummy | Pure/Impure sequence validator, Open/Closed deck, auto-sort, declare handler |

---

## ✨ Key Features

- 💎 **Luxury Gold & Dark Neon Theme**: Premium casino aesthetic built with responsive glassmorphism.
- 📱 **Mobile & Desktop Responsive**: Fully optimized for mobile phone screens and widescreen desktop displays.
- 🪙 **Virtual Wallet & Chip System**:
  - Starting balance of ₹10,000 demo chips.
  - Interactive chip selector (₹10, ₹50, ₹100, ₹500, ₹1,000, ₹5,000).
  - Add Chips modal for instant demo recharges.
  - Persistent state saved via browser `localStorage`.
- 🎡 **Daily Lucky Spin & Win**: Interactive spinning wheel granting bonus chips up to ₹10,000.
- 🔊 **Web Audio API Sound Engine**: Synthesized card flips, chip clinks, countdown ticks, and win/loss fanfares with zero external audio assets required.
- ⚡ **Zero External Heavy Dependencies**: Pure Vanilla JS, CSS3, and HTML5 for instant load times.

---

## 📁 Project Structure

```
gaming-platform/
├── games/
│   ├── andarBahar.js      # Andar Bahar game loop & deal animations
│   ├── colorGame.js       # Red Green Violet prediction engine & history
│   ├── dragonTiger.js     # Dragon vs Tiger betting & card evaluator
│   ├── rummy.js           # 13-card Indian Rummy logic & card sorter
│   └── teenPatti.js       # 3 Patti AI bot behaviors & hand evaluator
├── .gitignore             # Git ignore file for clean repo
├── app.js                 # App state, wallet management, views & modal controller
├── index.html             # Main single-page application entry point
├── package.json           # Node project manifest & start scripts
├── README.md              # Project documentation
├── server.js              # Lightweight Node.js local web server
├── sound.js               # Web Audio API sound synthesizer
└── style.css              # Custom casino theme styles & animations
```

---

## 🚀 Quick Start

### Option 1: Direct Browser Run (No installation required)
Simply double-click `index.html` or open it with any web browser (Chrome, Edge, Safari, Firefox).

### Option 2: Using Node.js Local Server
1. Clone this repository:
   ```bash
   git clone https://github.com/<YOUR-USERNAME>/<REPO-NAME>.git
   cd <REPO-NAME>
   ```
2. Start the local server:
   ```bash
   npm start
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 🌐 Deploy to Free Web Hosting

### Deploy to GitHub Pages:
1. Go to your repository on GitHub.
2. Go to **Settings** -> **Pages**.
3. Under **Branch**, select `main` and root `/` folder, then click **Save**.
4. Your game will be live at `https://<YOUR-USERNAME>.github.io/<REPO-NAME>/`!

### Deploy to Vercel / Netlify:
- Simply drag and drop this folder onto [Vercel](https://vercel.com) or [Netlify](https://netlify.com) for a 1-click live HTTPS deployment!

---

## 📱 Convert to Android App (APK)

This project is built mobile-first and can be packaged into an Android APK using **Capacitor**:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Royal Club" "com.royal.gamingclub"
npx cap add android
npx cap open android
```
Then build the signed APK from Android Studio!

---

## 📄 License
This project is licensed under the MIT License - feel free to use it for personal, hobby, or educational projects.

---
*Disclaimer: This platform uses virtual demo chips for entertainment and simulator purposes only.*
