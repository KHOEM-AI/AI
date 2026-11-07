# AI translate (free text) · បកប្រែអត្ថបទសេរីដោយ AI

`POST /api/ai-translate` body `{ "text": "...", "to": "km" | "en" | "zh" }` -> `{ ok, data: { text, to, model, usage } }`

- ប្រើ Anthropic API តាម `ANTHROPIC_API_KEY` ក្នុង `.env` (អានលើ server ប៉ុណ្ណោះ មិនទៅ browser)
- ម៉ូដែលលំនាំដើម `claude-haiku-5-5` ដូរដោយ `TRANSLATE_MODEL` ក្នុង `.env`
- ដែនកំណត់៖ 2,000 តួអក្សរ · 20 ដង/នាទី · 300 ដង/ថ្ងៃ (រាប់ក្នុង memory ហើយចាប់ផ្ដើមរាប់ឡើងវិញពេល server ចាប់ផ្ដើមថ្មី)
- ចម្លើយវែងលើស 2048 token នឹងបរាជ័យ (មិនបកកាត់ដោយស្ងាត់)
- ហៅម្ដងអស់លុយបន្តិច ហើយអត្ថបទដែលផ្ញើទៅ Anthropic ចេញពីម៉ាស៊ីន
- server ស្តាប់តែ 127.0.0.1 ហើយ route នេះគ្មាន guard (ពេលបើកចេញក្រៅត្រូវបន្ថែម guard)
- កូដ៖ `src/ai/translateApi.mjs` · តេស្ត៖ `src/ai/__tests__/translateApi.test.mjs`
- AI អាចបកខុស ត្រូវពិនិត្យលទ្ធផល
