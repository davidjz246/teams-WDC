# 🏆 Wadi Degla Attendance & Overtime Tracker

A professional, standalone attendance and overtime calculation system for **Wadi Degla Clubs**.

---

## 🚀 How to Run on ANY Laptop (3 Options)

### 🥇 Option 1: Standalone Single File (Recommended for Sharing)
* **File:** `AttendanceTracker-Standalone.html`
* **How to use:** Simply **double-click** `AttendanceTracker-Standalone.html`.
* **Compatibility:** Works on **100% of devices** (Windows, Mac, Linux, iPhone, Android) with **ZERO installation** and **NO server** needed. You can email or send this file via Microsoft Teams or WhatsApp to anyone.

---

### 🥈 Option 2: Windows 1-Click Launcher (Desktop App Mode)
* **File:** `Run-AttendanceTracker.bat` (or `start.bat`)
* **How to use:** Double-click `Run-AttendanceTracker.bat`.
* **Compatibility:**
  * If **Node.js** is installed, it runs via Node.js HTTP server.
  * If **Node.js is NOT installed**, it automatically runs using native built-in Windows PowerShell.
  * Automatically detects your local Wi-Fi IP address so you can share the link with colleagues on your office network.

---

### 🥉 Option 3: Share Over Local Wi-Fi / LAN Network
When running `Run-AttendanceTracker.bat`, anyone connected to the same Wi-Fi or office network can open:
```
http://<YOUR-IP-ADDRESS>:3000
```
*(The exact link is automatically displayed in the launcher console)*

---

### 🌍 Option 4: Share Worldwide via Internet Link
* **File:** `share-online.bat`
* Double-click `share-online.bat` to generate a temporary secure public HTTPS link accessible by anyone in the world.

---

## 🛠️ For Developers & Rebuilding

To rebuild or run in development mode:
```bash
npm install
npm run dev
```

To build production bundle:
```bash
npm run build
```

