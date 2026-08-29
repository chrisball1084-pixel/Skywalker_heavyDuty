# Claude Code Instructions — Skywalker Training

Read `docs/PROJECT.md` before making changes.

## Sources of truth

- Git/code + `docs/PROJECT.md`: technical source of truth.
- Notion Product Hub: product source of truth for new ideas, bugs, open requirements, decisions and current product status.

Do not treat old chat context or the full Notion changelog as required context. Read only what the current task needs.

## Standard command

When the user says **"Notion Sync durchführen"**, follow the `Notion-Sync-Workflow` in `docs/PROJECT.md`.

## Working rules

- Verify every Notion request against the current code before implementing it.
- Prefer small, isolated changes over broad refactors.
- Respect the Heavy-Duty product principles and iOS-PWA constraints documented in `docs/PROJECT.md`.
- Preserve existing user data compatibility unless a migration is explicitly required.
- Run relevant tests before marking work complete and add regression coverage for important bugs or new logic when practical.
- Update `docs/PROJECT.md` only for durable technical knowledge, not routine release notes.
- Update Notion after successful work so Inbox/Open/Current State remain useful to Codex, Claude Code and the user.
- Put genuine product decisions that require the user into `WAITING FOR ME` instead of guessing.
- Never store API keys, tokens, passwords or other secrets in Git or Notion.
- Respond in German unless the user requests another language.
