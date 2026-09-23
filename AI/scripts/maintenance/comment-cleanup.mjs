import fs from 'fs';

const edits = {
  'src/ai/status.mjs': [
    ['// ចំនួន request ដែលកំពុងដំណើរការពិតប្រាកដ (សម្រាប់ ACTIVE)',
     '// Actual count of requests currently in progress (used for ACTIVE)'],
    ['// មិនបង្ហាញ path ឬ stack ក្នុង error',
     '// Do not expose file path or stack trace in error output'],
  ],
  'src/ai/permission.mjs': [
    ['// Phase 14 (spec 4.9): ប្រើដើម្បីស្គាល់ថា policy/permission បានផ្លាស់ប្តូរ',
     '// Phase 14 (spec 4.9): used to detect that policy/permission has changed'],
    ['// ក្រោយពេល approval ស្នើសុំរួច។ Bump ដោយដៃបើ REGISTRY ខាងក្រោមផ្លាស់ប្តូរ។',
     '// after an approval request is made. Bump manually if the REGISTRY below changes.'],
    ['// Phase 14 (spec 4.13): mock ត្រឹមតែសាកល្បង pipeline — គ្មានផលប៉ះពាល់ពិត',
     '// Phase 14 (spec 4.13): mock only to test the pipeline — no real effect'],
  ],
  'src/ai/approvals.mjs': [
    ['const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 នាទី',
     'const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes'],
    ['// spec 4.6: អ្នកស្នើសុំ មិនអាចជាអ្នកសម្រេចចិត្តលើសំណើររបស់ខ្លួនឯងបានទេ',
     '// spec 4.6: the requester cannot also be the approver of their own request'],
    ['// spec 4.9: policy/permission ត្រូវតែដូចពេលស្នើសុំ បើមិនដូច — ចាស់ (stale)',
     '// spec 4.9: policy/permission must match what it was at request time — otherwise it is stale'],
  ],
  'src/config/timeouts.mjs': [
    ['// module ដែលមានហើយ តែនៅកំពុងបន្ថែម capability (បង្ហាញ DEVELOPING)',
     '// module that exists but is still gaining capability (shown as DEVELOPING)'],
  ],
};

let changed = 0;
for (const [file, pairs] of Object.entries(edits)) {
  let text = fs.readFileSync(file, 'utf8');
  for (const [from, to] of pairs) {
    if (!text.includes(from)) {
      console.log(`NOT FOUND in ${file}: ${from.slice(0, 40)}...`);
      continue;
    }
    text = text.split(from).join(to);
    changed++;
  }
  fs.writeFileSync(file, text, 'utf8');
  console.log(`updated ${file}`);
}
console.log(`Done — ${changed} lines replaced.`);
