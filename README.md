<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1a73e8,100:00d9ff&height=120&section=header&text=QuickMail%20Assistant&fontSize=38&fontColor=ffffff&fontAlignY=65&animation=fadeIn" />

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=22&pause=1000&color=1A73E8&center=true&vCenter=true&width=650&height=60&lines=AI-Powered+Gmail+Extension+%F0%9F%9A%80;Generate+Replies+in+One+Click+%E2%9A%A1;Supports+English+%7C+Hindi+%7C+Hinglish+%F0%9F%87%AE%F0%9F%87%B3;Spring+Boot+%2B+Gemini+AI+Backend+%F0%9F%A4%96" alt="Typing SVG" />

<br/>

[![Chrome Extension](https://img.shields.io/badge/Platform-Chrome_Extension-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](#)
[![Gmail](https://img.shields.io/badge/Works_With-Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white)](#)
[![Backend](https://img.shields.io/badge/Backend-Railway_Deployed-6DB33F?style=for-the-badge&logo=railway&logoColor=white)](https://quick-email-ai-production.up.railway.app)
[![AI Powered](https://img.shields.io/badge/AI-Powered-FF6B6B?style=for-the-badge&logo=google&logoColor=white)](#)

</div>

---

## 🧩 What is QuickMail Assistant?

> **QuickMail Assistant** is a Chrome Extension that injects an **AI Reply button directly inside Gmail** — letting you generate professional, human-like email replies and drafts in one click. No tab switching, no copy-pasting.

```
✅ Generate contextual replies from email content
✅ Draft new emails from simple instructions
✅ Supports English, Hindi & Hinglish prompts
✅ Connected to a live deployed backend API
✅ Inserts reply as draft — you always review before sending
✅ Privacy-first — reads email ONLY when you click AI Reply
```

---

## ✨ Features

<div align="center">

| Feature | Description |
|:---|:---|
| ⚡ **One-Click AI Reply** | Click AI Reply → email generated instantly |
| 📝 **New Email Drafting** | Type a simple instruction → full email drafted |
| 🇮🇳 **Multilingual** | Works with English, Hindi & Hinglish prompts |
| 🔗 **Live Backend** | Connected to deployed Railway API |
| 🔒 **Privacy First** | Only activates on user click — no background reading |
| 👁️ **Always Review** | Draft inserted for review — never auto-sent |

</div>

---

## 🚀 How It Works

```
1. Open Gmail
        ↓
2. Open a reply box or compose a new email
        ↓
3. Click the [ AI Reply ] button
        ↓
4. Extension reads email context or your typed instruction
        ↓
5. Sends request to backend API → AI generates reply
        ↓
6. Generated draft inserted into compose box
        ↓
7. You review and send ✅
```

---

## 🏗️ Project Structure

```
QuickMail-Assistant/
│
├── 📄 manifest.json       → Chrome extension config (Manifest V3)
├── ⚙️  background.js      → Sends requests to backend API
├── 💉 content.js          → Injects AI Reply button, reads Gmail context
├── 🎨 content.css         → Button & UI styles
└── 🖼️  icon/              → Extension icons (16, 48, 128px)
```

---

## 🔗 Backend API

**Live Endpoint:**

```
POST https://quick-email-ai-production.up.railway.app/api/email/generate
```

**Request Body:**
```json
{
  "emailContent": "Original email or user instruction",
  "tone": "professional"
}
```

**Response:**
```json
{
  "text": "Generated email reply...",
  "provider": "Gemini",
  "promptTokens": 120,
  "completionTokens": 85,
  "totalTokens": 205
}
```

---

## ⚙️ Installation

### Option 1 — Load Unpacked (Developer Mode)

```bash
1. Open Chrome → go to chrome://extensions
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the QuickMail-Assistant project folder
5. Open Gmail → AI Reply button will appear!
```

### Option 2 — Use With Deployed Backend

The extension is pre-configured with the live backend:

```
https://quick-email-ai-production.up.railway.app/api/email/generate
```

No setup needed — just load the extension and open Gmail.

---

## 🛠️ Tech Stack

**Extension (Frontend)**

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Chrome API](https://img.shields.io/badge/Chrome_API-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

**Backend**

![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Railway](https://img.shields.io/badge/Deployed-Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)

---

## 🔒 Privacy & Data Use

> QuickMail Assistant is built with a **privacy-first** approach.

- 📌 Reads Gmail content **only** when user clicks `AI Reply`
- 🚫 Does **not** read emails in the background automatically
- 🚫 Does **not** auto-send any emails
- 📤 Only sends the required context to backend for generation
- 👁️ Generated content is always inserted as a **draft for review**
- 🔐 No user data is stored by the extension locally

> ⚠️ The backend uses third-party AI providers (Gemini/Groq/OpenRouter). Ensure the backend is configured responsibly before public deployment.

---

## ⚠️ Important Notes

```
⚡ Designed specifically for Gmail (mail.google.com)
🔗 Requires a running backend API for generation
❌ If backend is unavailable — generation requests will fail
👁️ Always review generated content before sending
📋 For Chrome Web Store release — a privacy policy page is required to read 
```

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00d9ff,100:1a73e8&height=80&section=footer&animation=fadeIn" />

**Built with ❤️ by [Bikash Kumar](https://github.com/bikashcode-dev)**

[![GitHub](https://img.shields.io/badge/GitHub-bikashcode--dev-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/bikashcode-dev)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Bikash%20Sah-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/bikash-sah-java)

⭐ *"Build real projects, not just code."*

</div>
