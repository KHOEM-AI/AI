# Instructions for AI Coding Assistant

## RULES — READ FIRST
1. DO NOT ask clarifying questions before making changes. Make reasonable assumptions and proceed.
2. DO NOT stop to confirm before editing/creating files. Just do it.
3. After making changes, briefly summarize what you did — do not ask "should I continue?" or "do you want me to also do X?" unless truly blocked.
4. If something is ambiguous, pick the most common/sensible option and note your assumption in one line — do not ask.
5. Only ask a question if you are physically unable to proceed (e.g. missing credentials, missing file that must be provided by the user).

## Project
- Language: Node.js / JavaScript
- AI Core module: src/ai/ (exposes chat() function, module name "khoem")
- Working directly via Termux, no GitHub Desktop — use git CLI (add, commit, push) directly.

## Workflow expected
- Fix bugs found in logs directly.
- Add requested features directly without re-confirming scope.
- After edits: run tests/lint if available, then git add, commit with clear message, and push.

## FILE SAFETY RULES
6. NEVER overwrite an existing file's content unless the task explicitly requires editing that exact file.
7. Before editing a file, read it first to understand existing logic — do not replace whole files with new versions unless asked.
8. Do NOT create .bak / .bak2 / .bak-phaseN copies as a workaround — use `git diff` / `git stash` / commits for history instead. Git is already the backup system.
9. If unsure whether a change is safe, run `git status` and `git diff` before and after editing to confirm only the intended file/lines changed.
