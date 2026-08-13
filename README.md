# 👑 រចនាសម្ព័ន្ធគម្រោងពេញលេញ (Full Project Tree)

👑 KHOEM_AI / AI
├── .gitignore
├── pnpm-lock.yaml
├── README.md
├── 📁 AI/
│   ├── .env
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

# 📑 ការពិពណ៌នាឯកសារ និងថតនីមួយៗ (Detailed File Descriptions)
📌 ១. ឯកសារដើម (Root Level Configurations)
.gitignore: កំណត់បញ្ជីឈ្មោះ File/Folder ណាដែលត្រូវរំលង មិនបាច់ Push ឡើង GitHub (ដូចជា node_modules ឬ .env)។
pnpm-lock.yaml: រក្សាទុកកំណែទម្រង់ (Version) ដកស្រង់របស់ Library ទាំងអស់ឲ្យដូចគ្នា ពេលដំឡើងតាមរយៈ pnpm Package Manager។
README.md: ឯកសារណែនាំទូទៅពីគម្រោង របៀបដំឡើង និងរបៀបរត់កម្មវិធី។

# 📁 ២. ថត AI/ (Backend / AI Environment)
.env: រក្សាទុកកូដសម្ងាត់ ឬកំណត់រចនាសម្ព័ន្ធសម្ងាត់ (Environment Variables / API Keys)។
requirements.txt: បញ្ជីឈ្មោះ Python Packages សម្រាប់ដំឡើង backend services លើ Python។

# 📁 ៣. ថត artifacts/components/ (Core Global Components)
error-boundary.tsx: React Component សម្រាប់ចាប់កំហុស (Catch Errors) ក្នុងកម្មវិធី ការពារកុំឲ្យ App ដួល (Crash) អេក្រង់ខ្មៅ។

# 📁 ៤. ថត artifacts/mockup-sandbox/ (UI Design System & Components Library)
ទីតាំងប្រមូលផ្តុំ Shadcn UI Component ទំនើបៗសម្រាប់យកទៅប្រើប្រាស់ក្នុងការឌីសាញអេក្រង់កម្មវិធី៖
.gitignore: កំណត់ File ត្រូវរំលងសម្រាប់ថត Sandbox។
accordion.tsx: ផ្ទាំងព័ត៌មានអាចចុចពង្រីក/បង្រួមចុះឡើងបាន។
alert-dialog.tsx: ប្រអប់សារអាសន្ន ឬផ្ទាំងសួរបញ្ជាក់ការសម្រេចចិត្ត (Confirmation dialog)។
alert.tsx: បដាបង្ហាញដំណឹង ឬការព្រមាន (Alert Banner)។
avatar.tsx: រូបតំណាងប្រវត្តិរូបអ្នកប្រើប្រាស់ (User Profile Picture)។
breadcrumb.tsx: របារបង្ហាញផ្លូវទីតាំងទំព័រ (Navigation breadcrumb)។
button-group.tsx: ក្រុមប៊ូតុងដែលតម្រៀបជាប់គ្នាជាជួរ។
calendar.tsx: ប្រទិន្នទិន្នន័យសម្រាប់ជ្រើសរើសថ្ងៃខែឆ្នាំ។
card.tsx: ផ្ទាំងប្រអប់ព័ត៌មានជារាងកាត (Card layout)។
carousel.tsx: ផ្ទាំងស្លាយរូបភាព ឬវីដេអូរំកិលទៅឆ្វេងស្ដាំ។
chart.tsx: ក្រាហ្វិក និងដ្យាក្រាមបង្ហាញទិន្នន័យ (Data Charts)។
checkbox.tsx: ប្រអប់គ្រីសជ្រើសរើសជម្រើសច្រើន។
command.tsx: របារស្វែងរកបញ្ជាស្វ័យប្រវត្តិ (Command Palette Search)។
context-menu.tsx: ម៉ឺនុយជម្រើសលេចឡើងពេលចុច Mouse ខាងស្តាំ។
dialog.tsx: ផ្ទាំង Pop-up លេចឡើងលើអេក្រង់ (Modal Window)។
drawer.tsx: ផ្ទាំងម៉ឺនុយរំកិលទាញចេញពីចំហៀង ឬខាងក្រោមអេក្រង់។
dropdown-menu.tsx: ម៉ឺនុយធ្លាក់ចុះពេលចុចលើប៊ូតុង។
form.tsx: ទម្រង់បំពេញទិន្នន័យ (Form Container)។
hover-card.tsx: ប្រអប់បង្ហាញព័ត៌មានបន្ថែមពេលយក Mouse ទៅដាក់លើ។
input-otp.tsx: ប្រអប់វាយបញ្ចូលលេខកូដសម្ងាត់ OTP ៦ខ្ទង់។
input.tsx: ប្រអប់បញ្ចូលអត្ថបទ ឬទិន្នន័យទូទៅ (Text Input)។
label.tsx: អត្ថបទស្លាកឈ្មោះបញ្ជាក់ពីមុខ Input។
menubar.tsx: របារម៉ឺនុយធំនៅផ្នែកខាងលើគេនៃកម្មវិធី។
navigation-menu.tsx: ម៉ឺនុយសម្រាប់ផ្លាស់ប្តូរទំព័រនៅក្នុង App។
pagination.tsx: ប៊ូតុងប្តូរទំព័រទិន្នន័យ (1, 2, 3...)។
popover.tsx: ផ្ទាំងបង្ហាញព័ត៌មានតូចៗលេចឡើងក្បែរប៊ូតុង។
progress.tsx: របារបង្ហាញភាគរយនៃការរត់ ឬដំឡើង (Progress Bar)។
radio-group.tsx: ជម្រើសរាងរង្វង់មូលដែលជ្រើសបានតែមួយ។
resizable.tsx: ផ្ទាំងចំណែកអេក្រង់ដែលអាចទាញពង្រីក/បង្រួមតាមចិត្ត។
scroll-area.tsx: តំបន់ Scroll អត្ថបទដែលមាន Custom Scrollbar ស្អាត។
select.tsx: ប្រអប់ជ្រើសរើស Option ធ្លាក់ចុះ (Select Dropdown)។
separator.tsx: ខ្សែបន្ទាត់ស្តើងសម្រាប់ខណ្ឌចែកផ្នែក UI។
sidebar.tsx: របារម៉ឺនុយចំហៀងនៃកម្មវិធី (Sidebar)។
skeleton.tsx: អេក្រង់តំណាងបណ្តោះអាសន្ន ពេលរង់ចាំ Load ទិន្នន័យ។
slider.tsx: របារទាញសេរ៉េកម្រិត (ដូចជា កម្រិតសំឡេង ឬពន្លឺ)។
switch.tsx: កុងតាក់ចុច បើក/បិទ (Toggle Switch)។
table.tsx: តារាងបង្ហាញទិន្នន័យជារួស និងជួរឈរ។
tabs.tsx: ផ្ទាំងប្តូរ Tab ព័ត៌មាន (Tabs)។
textarea.tsx: ប្រអប់សរសេរអត្ថបទវែងៗ។
toast.tsx: សារជូនដំណឹងខ្លីៗដែលលេចឡើងនៅជ្រុងអេក្រង់។
toaster.tsx: កន្លែងគ្រប់គ្រងការបង្ហាញសារ Toast ទាំងអស់។
toggle-group.tsx: ក្រុមប៊ូតុង Toggle ដែលអាចចុច បើក/បិទ ជាប់គ្នា។
toggle.tsx: ប៊ូតុងចុច Toggle បើក/បិទ 單មួយ។

# 📁 ៥. ថត artifacts/tv-ai-international/ (Main Live TV Application)
ថតចម្បងដែលផ្ទុកកូដដំណើរការ App ផ្សាយទូរទស្សន៍ផ្ទាល់ TV AI International៖
App.tsx: Component ធំចម្បងដែលប្រមូលផ្ដុំទូរទស្សន៍ ការផ្សាយ HLS Live និង UI ទាំងអស់។
artifact.toml: ឯកសារ Configuration សម្រាប់ Artifact System Engine។
aspect-ratio.tsx: កំណត់សមាមាត្រអេក្រង់វីដេអូ (16:9) កុំឲ្យយារ ឬលាតខូចរាង។
badge.tsx: ស្លាកសញ្ញាតូចៗ (ដូចជា បង្ហាញពាក្យ 🔴 LIVE, OFFLINE)។
button.tsx: ប៊ូតុងចុច UI ពិសេសរបស់ App TV។
collapsible.tsx: ផ្ទាំងបញ្ជាដែលអាចលាក់/បង្ហាញបាន (Accordion/Collapsible style)។
components.json: កំណត់ Configuration របស់ Shadcn UI Framework។
favicon.svg: រូប Logo តូចដែលបង្ហាញលើ Browser Tab។
index.css: ឯកសារ CSS ដើម សម្រាប់ Styling ជាមួយ Tailwind CSS។
index.html: ទំព័រដើម HTML ដំបូងបង្អស់ដែល React រត់ចូល។
input-group.tsx: ប្រអប់បញ្ចូលទិន្នន័យដែលមានភ្ជាប់ Icon ក្បែរនោះ។
kbd.tsx: UI សម្រាប់បង្ហាញប៊ូតុង Shortcut លើក្តារចុច (Keyboard Shortcuts)។
main.tsx: កន្លែងចាប់ផ្តើមរត់កូដ React DOM ចូលទៅក្នុង index.html។
not-found.tsx: ទំព័របង្ហាញសារ Error 404 (ពេលរកទំព័រមិនឃើញ)។
package.json: បញ្ជីឈ្មោះ Libraries, Packages និង Scripts សម្រាប់ Run App (npm run dev)។
robots.txt: ឯកសារណែនាំ Search Engine (SEO)។
separator.tsx: បន្ទាត់ខណ្ឌប្រអប់ Control Panel។
sonner.tsx: Library សារជូនដំណឹង Toast ស្អាតៗ និងមាន Animation ស្រទន់។
spinner.tsx: សញ្ញារង្វង់វិល (Loading Spinner) ពេលកំពុងភ្ជាប់សេវាទូរទស្សន៍។
tooltip.tsx: សារពន្យល់តូចៗពេលយក Mouse ទៅចង្អុលលើប៊ូតុង។
tsconfig.json: ការកំណត់រចនាសម្ព័ន្ធរបស់ TypeScript Engine។
use-mobile.tsx: Custom Hook សម្រាប់តេស្តមើលថាអ្នកប្រើយកទូរស័ព្ទ ឬ កុំព្យូទ័រមកបើក App។
use-toast.ts: Custom Hook សម្រាប់ហៅមុខងារសារ Toast មកប្រើក្នុង App។
utils.ts: Helper Functions (សម្រាប់បូកបញ្ចូល Classnames CSS)។
vite.config.ts: ឯកសារកំណត់រចនាសម្ព័ន្ធ Build System របស់ Vite bundler។

# 📊 ៦. សរុបសេចក្តីនៃគម្រោង (Project Summary)
គម្រោង KHOEM_AI / AI នេះត្រូវបានបែងចែកជា ៣ ផ្នែកសំខាន់ៗ ច្បាស់លាស់៖
** backend/Environment (AI/)**: សម្រាប់ផ្ទុកបរិស្ថាន Python សម្រាប់ប្រព័ន្ធ AI ឬ Backend Service។
UI Design System (artifacts/mockup-sandbox/): ជាបណ្ណាល័យប្រមូលផ្ដុំ Component ផ្លូវការ (មាន ៤៤ ឯកសារ UI) ដែលត្រៀមជាស្រេចសម្រាប់យកទៅប្រើប្រាស់គ្រប់ទម្រង់។
Main Application (artifacts/tv-ai-international/): ជាកម្មវិធីចម្បងដែលដើរដោយ React + TypeScript + Vite + Tailwind CSS សម្រាប់បង្ហាញទូរទស្សន៍អន្តរជាតិ Live, មានប្រព័ន្ធ Adjust ពន្លឺ/សំឡេង, Rotate អេក្រង់, HLS Streaming, និង State Persistence សំរាប់ចងចាំការកំណត់របស់អ្នកប្រើប្រាស់។

# KHOEM-AI THANK YOU
