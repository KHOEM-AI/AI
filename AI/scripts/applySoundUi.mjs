// Run from ~/ai-project/AI:  node scripts/applySoundUi.mjs
// Adds <SoundLibrary /> to IqaiCenter.tsx (backup: IqaiCenter.tsx.bak-sound). Safe to run twice.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'components', 'IqaiCenter.tsx');
let src = await fs.readFile(file, 'utf8');
if (src.includes('<SoundLibrary')) { console.log('skip: already applied'); process.exit(0); }
const importRe = /^(import type \{ IqaiEmotion \} from ["']\.\.\/api\/client["'];)$/m;
const useRe = /^([ \t]*)(\{busy && <div>)/m;
if (!importRe.test(src) || !useRe.test(src)) { console.error('FAILED: anchors not found in IqaiCenter.tsx'); process.exit(1); }
await fs.writeFile(file + '.bak-sound', src);
src = src.replace(importRe, '$1\nimport SoundLibrary from "./SoundLibrary";').replace(useRe, '$1<SoundLibrary />\n\n$1$2');
await fs.writeFile(file, src);
console.log('patched IqaiCenter.tsx');
