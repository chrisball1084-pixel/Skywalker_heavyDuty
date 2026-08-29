# Codex Instructions — Skywalker Training

Read `docs/PROJECT.md` before making changes.

## Sources of truth

- Git/code + `docs/PROJECT.md`: technical source of truth.
- Notion Product Hub: product source of truth for new ideas, bugs, open requirements, decisions and current product status.

Do not assume the entire Notion history is relevant. Read only the current sections needed for the task.

## Standard command

When the user says **"Notion Sync durchführen"**, follow the `Notion-Sync-Workflow` in `docs/PROJECT.md`.

## Working rules

- Verify every Notion request against the current code before implementing it.
- Prefer small, isolated changes over broad refactors.
- Preserve existing architecture and user data compatibility unless a change is explicitly required.
- Run relevant tests before marking work complete.
- Add regression tests for important bugs or new logic when practical.
- Update `docs/PROJECT.md` only for durable technical knowledge, not routine changelog entries.
- Update Notion after successful work so Inbox/Open/Current State remain useful to the next agent.
- Put genuine product decisions that require the user into `WAITING FOR ME` instead of guessing.
- Never store API keys, tokens, passwords or other secrets in Git or Notion.
- Respond in German unless the user requests another language.
