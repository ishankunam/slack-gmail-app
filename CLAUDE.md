# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This repo contains two independent pieces:

1. **A Bun/TypeScript scaffold** (`index.ts`) — currently just the placeholder left by `bun init` (`console.log("Hello via Bun!")`). No dependencies, server, or frontend exist yet.
2. **`script.gs`** — the actual application. A standalone Google Apps Script meant to be pasted into the Apps Script editor (script.google.com) bound to a Gmail account. It is **not** executed by Bun/Node, is not part of the TypeScript project, and is not covered by `tsconfig.json`. Its globals (`GmailApp`, `UrlFetchApp`, `Utilities`, `Logger`) only exist inside the Apps Script runtime, so it can't be run or type-checked locally — the only way to exercise it is inside the Apps Script editor.

## What script.gs does

Scans a Gmail label for unread messages, formats each as a Slack Block Kit payload, POSTs it to a configured incoming webhook, and marks the message read.

- User config constants at the top of the file — `WEBHOOK_URL`, `LABEL` (Gmail label name), `CHANNEL` (Slack channel), `BODY_LENGTH` (truncation limit) — must be filled in before use.
- `format_date` / `bypass_mrkdwn` / `truncate_email` — formatting helpers for the Slack message body (date formatting, mrkdwn-escaping, body truncation with ellipsis).
- `define_JSON(email)` — builds the Block Kit payload (subject, from/to/cc fields, date, truncated body).
- `build_payload(email)` — POSTs the payload via `UrlFetchApp.fetch`; throws on a non-200 response.
- `main()` — entry point. Iterates unread messages in threads under `LABEL`, calls `build_payload` for each, marks it read, and logs a processed count. This is the function to wire up to an Apps Script time-driven trigger.

## Commands

- `bun install` — install dependencies
- `bun run index.ts` — run the Bun entry point (currently just the placeholder)
- `bun run format` — `biome format --write .`
- `bun run lint` — `biome lint --write .`
- `bun run check` — `biome check --write .` (format + lint + organize imports in one pass)

No test suite exists yet. `script.gs` can't be run with `bun test` or any local tool since it depends on Apps Script's Gmail/UrlFetch/Utilities services.

## Style

- Formatting/linting is enforced by Biome (`biome.json`): tab indentation, double-quoted strings, `organizeImports` on.
- `tsconfig.json` is strict (`noUncheckedIndexedAccess`, `noImplicitOverride`, `strict`, etc.) — applies only to the Bun/TS side, not `script.gs`.

## Tooling conventions

Default to using Bun instead of Node.js for anything on the TypeScript side:

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads `.env`, so don't use `dotenv`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile; `Bun.$` over `execa`.

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.
