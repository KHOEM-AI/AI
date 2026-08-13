# 👑 KHOEM_AI - TV AI International

<p align="center">
  <b>A Modern, Next-Gen Live TV & AI Interactive Platform</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
</p>

---

## 📁 Complete Repository Structure

```text
👑 KHOEM_AI / AI
├── .gitignore
├── pnpm-lock.yaml
├── README.md
├── 📁 AI/
│   ├── 📁 templates/
│   │   ├── aitv.html
│   │   └── index.html
│   ├── .env
│   ├── app.py
│   └── requirements.txt
└── 📁 artifacts/
    ├── 📁 components/
    │   └── error-boundary.tsx
    │
    ├── 📁 mockup-sandbox/
    │   ├── .gitignore
    │   ├── accordion.tsx
    │   ├── alert-dialog.tsx
    │   ├── alert.tsx
    │   ├── avatar.tsx
    │   ├── breadcrumb.tsx
    │   ├── button-group.tsx
    │   ├── calendar.tsx
    │   ├── card.tsx
    │   ├── carousel.tsx
    │   ├── chart.tsx
    │   ├── checkbox.tsx
    │   ├── command.tsx
    │   ├── context-menu.tsx
    │   ├── dialog.tsx
    │   ├── drawer.tsx
    │   ├── dropdown-menu.tsx
    │   ├── form.tsx
    │   ├── hover-card.tsx
    │   ├── input-otp.tsx
    │   ├── input.tsx
    │   ├── label.tsx
    │   ├── menubar.tsx
    │   ├── navigation-menu.tsx
    │   ├── pagination.tsx
    │   ├── popover.tsx
    │   ├── progress.tsx
    │   ├── radio-group.tsx
    │   ├── resizable.tsx
    │   ├── scroll-area.tsx
    │   ├── select.tsx
    │   ├── separator.tsx
    │   ├── sidebar.tsx
    │   ├── skeleton.tsx
    │   ├── slider.tsx
    │   ├── switch.tsx
    │   ├── table.tsx
    │   ├── tabs.tsx
    │   ├── textarea.tsx
    │   ├── toast.tsx
    │   ├── toaster.tsx
    │   ├── toggle-group.tsx
    │   └── toggle.tsx
    │
    └── 📁 tv-ai-international/
        ├── App.tsx
        ├── artifact.toml
        ├── aspect-ratio.tsx
        ├── badge.tsx
        ├── button.tsx
        ├── collapsible.tsx
        ├── components.json
        ├── favicon.svg
        ├── index.css
        ├── index.html
        ├── input-group.tsx
        ├── kbd.tsx
        ├── main.tsx
        ├── not-found.tsx
        ├── package.json
        ├── robots.txt
        ├── separator.tsx
        ├── sonner.tsx
        ├── spinner.tsx
        ├── tooltip.tsx
        ├── tsconfig.json
        ├── use-mobile.tsx
        ├── use-toast.ts
        ├── utils.ts
        └── vite.config.ts

📑 Detailed File & Directory Descriptions
1. Root Directory (/)
.gitignore: កំណត់បញ្ជីឯកសារដែលត្រូវរំលង មិន Push ឡើង GitHub។
pnpm-lock.yaml: រក្សាកំណែទម្រង់ (Version) របស់ Packages ឲ្យថេរ។
README.md: ឯកសារព័ត៌មានទូទៅ និងការណែនាំពីគម្រោង។
2. Backend Core (AI/)
templates/aitv.html: ទំព័រ HTML សម្រាប់បង្ហាញមុខងារ AI TV។
templates/index.html: ទំព័រដើម HTML របស់ Flask Web Server។
.env: រក្សាទុកកូដសម្ងាត់ API Keys (Gemini/OpenAI)។
app.py: កម្មវិធី Python Flask Backend សម្រាប់ដំណើរការ AI Service។
requirements.txt: បញ្ជី Python Libraries សម្រាប់ដំឡើង។
3. Core Components (artifacts/components/)
error-boundary.tsx: ចាប់កំហុសស្វ័យប្រវត្តិកុំឲ្យ React App ដួល (Crash)។
4. UI Design System (artifacts/mockup-sandbox/)
ផ្ទុក ៤២ សមាសភាគ (Shadcn UI Components) សម្រាប់បង្កើតចំណុចប្រទាក់អ្នកប្រើប្រាស់ (UI Display)។
5. Main Broadcast App (artifacts/tv-ai-international/)
App.tsx: អេក្រង់ចម្បងនៃកម្មវិធីផ្សាយទូរទស្សន៍ផ្ទាល់ (Live TV Dashboard)។
main.tsx: ចំណុចចាប់ផ្តើមដំណើរការ React App។
vite.config.ts: ការកំណត់រចនាសម្ព័ន្ធរបស់ Vite Bundler។
package.json: កំណត់ Library និង Scripts សម្រាប់រត់ Frontend (pnpm dev)។
🚀 Quick Start Guide
1. Run Python Backend Service
