# slack-gmail-app

Forwards Gmail messages under chosen labels to Slack channels via incoming webhooks, formatted as rich Slack Block Kit messages.

## Setup

The app itself is `script.js`, a Google Apps Script. Paste it into a script bound to your Gmail account at [script.google.com](https://script.google.com), fill in the `ROUTES` array at the top of the file — one entry per `{ label, channel, webhook }` route, so a single script can forward multiple Gmail labels to different Slack channels — plus `BODY_LENGTH`, then set up a time-driven trigger to run `main()`.

## Development

To install dependencies:

```bash
bun install
```

To format/lint (Biome):

```bash
bun run check
```

This project was created using `bun init` in bun v1.3.14. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
