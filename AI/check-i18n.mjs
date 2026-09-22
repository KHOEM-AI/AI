import fs from 'fs';

const typesFile = fs.readFileSync('src/i18n/types.ts', 'utf8');
const keys = [...typesFile.matchAll(/^\s*(\w+)\s*:/gm)].map(m => m[1]);

for (const lang of ['hi', 'ar']) {
  const content = fs.readFileSync(`src/i18n/${lang}.ts`, 'utf8');
  const missing = keys.filter(k => !new RegExp(`\\b${k}\\s*:`).test(content));
  console.log(`\n=== ${lang}.ts missing (${missing.length}) ===`);
  console.log(missing.join(', '));
}
