# Color and Light · ទំព័រពណ៌ និងអំពូលភ្លើង

ទំព័រក្នុង AI app សម្រាប់មើលទិន្នន័យពណ៌ និងពន្លឺ ដែលទាញពី repo ដាច់ដោយឡែក KHOEM-AI/khoem-now (color and light data store)។

## អ្វីដែលបានបន្ថែម
- ឯកសារថ្មី: src/ai/colorLight.mjs (API) និង src/components/ColorLightCenter.tsx (UI)
- កែ server.mjs (+2 បន្ទាត់: import និងហៅ registerColorLightApi)
- កែ src/App.tsx (+4 បន្ទាត់: import, state, ប៊ូតុង sidebar, render)
- គ្មានការចម្លងទិន្នន័យចូល AI repo ទេ

## របៀបតភ្ជាប់ AI និង khoem-now

    UI ColorLightCenter (5175)
      -> /api/colorlight/...   (Vite proxy ទៅ 8787)
      -> server.mjs (8787) -> src/ai/colorLight.mjs
      -> អាន JSON ពី ~/khoem-now-github/data

- ទិន្នន័យអានស្រស់រាល់ការស្នើ ដូច្នេះ git pull ក្នុង khoem-now ឃើញភ្លាម មិនបាច់ restart
- ថតលំនាំដើម ~/khoem-now-github អាចប្តូរដោយ COLORLIGHT_DIR
- ថត ~/KSV/khoem-now (ចាស់) និង ~/khoem-now (repo VTH) មិនត្រូវបានប្រើទេ

## ដំឡើង (ម្តង)

    git clone https://github.com/KHOEM-AI/khoem-now.git ~/khoem-now-github

ថតផ្សេង: COLORLIGHT_DIR=/path/to/khoem-now ai

## របៀបប្រើ
1. វាយ ai ដូចធម្មតា
2. បើក localhost:5175 ចុច ☰ រួចចុច 🎨 Color and Light
3. ជ្រើសប្រភេទ (ក្រុមពណ៌ អំពូល ភ្លើងសញ្ញា ឡាស៊ែរ ឆាក ...) ស្វែងរកតាមឈ្មោះ ឬ hex ហើយមើលក្រឡាពណ៌

## API
- GET /api/colorlight : បញ្ជីប្រភេទ (path, name_en, name_km, count)
- GET /api/colorlight/data?path=PATH&q=TEXT&limit=N : ទិន្នន័យមួយប្រភេទ (limit 1-1000 លំនាំដើម 200)

ឧទាហរណ៍:

    curl -s "http://127.0.0.1:8787/api/colorlight/data?path=data/colors/basic.json&q=red"

កំហុស: 404 unknown_dataset (path មិនមានក្នុង index.json) | 503 colorlight_unavailable (រកថតទិន្នន័យមិនឃើញ) | 500 colorlight_failed។
សុវត្ថិភាព: path ត្រូវតែនៅក្នុង data/index.json ប៉ុណ្ណោះ ដូច្នេះអានឯកសារផ្សេងមិនបាន។

## ធ្វើបច្ចុប្បន្នភាពទិន្នន័យ

    cd ~/khoem-now-github && git pull

## ស្ថានភាព និងចន្លោះ
- ឥឡូវមាន 28 ប្រភេទ (color wheel 22,821, css-named 141, សីតុណ្ហភាពពណ៌ 111, ភ្លើងសញ្ញា, ISO 3864, ឡាស៊ែរ, ឆាក ...)
- ឈ្មោះខ្មែរ: ប្រភេទជាច្រើនមិនមានវាល km ទាល់តែសោះ ហើយខ្លះទទេ (ពណ៌មូលដ្ឋាន 8/21 ជាដើម)
- មិនទាន់មាន: ពណ៌ធម្មជាតិ សម្ភារៈ 3D ពណ៌រថយន្ត/ផ្ទះ/សម្លៀកបំពាក់ ពន្លឺតាមពេល/អាកាសធាតុ
- មិនទាន់ភ្ជាប់ទៅវីដេអូ 3D ឬ storyboard (ឥឡូវមានតែទំព័រមើល)
- palettes មិនទាន់បង្ហាញក្រឡាពណ៌

## ត្រឡប់ក្រោយ
- git revert 1fe77cb (commit ដែលបន្ថែមទំព័រ)
- ឬស្តារពី server.mjs.before-colorlight.backup និង src/App.tsx.before-colorlight.backup (ក្នុង Termux មិនបានចូល git)
