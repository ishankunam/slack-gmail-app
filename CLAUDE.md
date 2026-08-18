# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

The entire application is **`script.js`** — a standalone Google Apps Script meant to be pasted into the Apps Script editor (script.google.com) bound to a Gmail account. It is **not** executed by Bun/Node and is not covered by `tsconfig.json`. Its globals (`GmailApp`, `UrlFetchApp`, `Utilities`, `Session`, `Logger`) only exist inside the Apps Script runtime, so it can't be run or type-checked locally — the only way to exercise it is inside the Apps Script editor.

Bun/TypeScript (`package.json`, `tsconfig.json`, Biome) is set up in this repo only for tooling (formatting/linting) — there's no local Bun entry point or build. Unlike the old `script.gs` name, `script.js` *is* picked up by Biome (`.js` is a recognized extension), and it currently passes `bunx biome check .` with no issues.

## What script.js does

Scans one or more Gmail labels for unread messages, formats each as a Slack Block Kit payload, POSTs it to that route's configured incoming webhook, and marks the message read — supporting multiple label → Slack channel routes from a single script.

- `ROUTES` — an array of `{ label, channel, webhook }` objects, one per route (Gmail label name, Slack channel display name, and that route's Slack Incoming Webhook URL); must be filled in before use. `BODY_LENGTH` (truncation limit, applies to all routes) is the other user config constant.
- `format_date` / `bypass_mrkdwn` / `truncate_email` — formatting helpers for the Slack message body (date formatting, mrkdwn-escaping, body truncation with ellipsis).
- `define_JSON(email, route)` — builds the Block Kit payload (subject, from/to/cc fields, date, truncated body) for a given route.
- `build_payload(email, route)` — POSTs the payload via `UrlFetchApp.fetch` to `route.webhook`; throws on a non-200 response.
- `process_route(route)` — resolves `route.label` to a Gmail label, iterates its unread messages, calls `build_payload` for each, marks it read, and returns the count processed (logs and returns `0` if the label doesn't exist).
- `main()` — entry point. Calls `process_route` for every entry in `ROUTES` and logs the total processed count across all routes. This is the function to wire up to an Apps Script time-driven trigger.

## Commands

- `bun install` — install dependencies
- `bun run format` — `biome format --write .`
- `bun run lint` — `biome lint --write .`
- `bun run check` — `biome check --write .` (format + lint + organize imports in one pass)

No test suite exists yet. `script.js` can't be run with `bun test` or any local tool since it depends on Apps Script's Gmail/UrlFetch/Utilities services.

## Style

- Formatting/linting is enforced by Biome (`biome.json`): tab indentation, double-quoted strings, `organizeImports` on. This now includes `script.js` itself.
- `tsconfig.json` is strict (`noUncheckedIndexedAccess`, `noImplicitOverride`, `strict`, etc.) — applies only to the Bun/TS side; `script.js` isn't type-checked by it since there's no local build step that runs against Apps Script's globals.

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
