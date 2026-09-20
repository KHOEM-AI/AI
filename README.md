# AI

Vite + React + TypeScript frontend, ជាមួយ `server.mjs` (Express) ជា backend ដែលភ្ជាប់ទៅ Anthropic API។

## ការដំឡើង (ធ្វើម្ដងគត់ once)

```bash
npm install
cp .env.example .env
```

បន្ទាប់មក បើក `.env` ហើយដាក់ `ANTHROPIC_API_KEY` របស់អ្នកចូល
(ទទួលបាននៅ https://console.anthropic.com)។

## ដំណើរការ (ត្រូវរត់ជារៀងរាល់ដងបើក terminal ថ្មី — recurring)

ត្រូវបើក terminal ពីរផ្ទាំង (backend និង frontend):

```bash
# ផ្ទាំងទី១ — backend
npm run server
```

```bash
# ផ្ទាំងទី២ — frontend
npm run dev
```

បើក http://localhost:5173 ។ Vite នឹងបញ្ជូនសំណើ `/api/chat` ទៅ `server.mjs` នៅ port 8787 ដោយស្វ័យប្រវត្តិ។

## រចនាសម្ព័ន្ធ

- `src/App.tsx` — UI សន្ទនា (Khmer-first)
- `src/App.css` — រចនាប័ទ្ម
- `server.mjs` — backend ដែលហៅ Anthropic API
- `.env` — កន្លែងដាក់ API key (កុំ commit ចូល git)

## ជំហានបន្ត

- ដាក់ API key ចូល `.env` ដើម្បីឱ្យការសន្ទនាដំណើរការពិតប្រាកដ
- ពិនិត្យឈ្មោះ model ថ្មីបំផុតនៅ https://docs.claude.com មុនដាក់ឱ្យប្រើប្រាស់ពិត
- បន្ថែម: រក្សាទុកប្រវត្តិសន្ទនា, streaming responses, authentication
