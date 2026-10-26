# Khmer replies: how data flows

Order: knowledge exact -> KHOEM_AI API (`/api/khmer?exact=1`, default http://127.0.0.1:8790)
-> local fallback `khmerReply()` in `src/ai/khmer.mjs`.

## What lives here (src/ai/khmer.mjs)
- Fallback entries (same shape: `["key|alias", "answer"]`) used when the API is down.
- 3 computed entries (time/date) whose answers are functions. They cannot move to KHOEM_AI.
- Learned answers, honorific handling (`បង`), greeting logic, `khmerSentence` generator.
- Normalization is `fold` (NFC, lowercase, `្ដ` -> `្ត`), different from KHOEM_AI `norm`.

## Rules
- New static Q&A -> add to KHOEM_AI (`localization/src/khmer/data.extra.*.ts`), not here.
- Behaviour/logic/computed answers -> here.
- Do not copy the same entry into both repos.
- The file is ~4MB: never open it whole in an editor; use grep or scripts.
- Related: `src/ai/khoemApi.mjs`, `khoem.mjs`, `languageRegistry.mjs`.
