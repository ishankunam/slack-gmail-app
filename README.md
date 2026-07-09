# slack-gmail-app

Forwards Gmail messages under a chosen label to a Slack channel via an incoming webhook, formatted as a rich Slack Block Kit message.

## Setup

The app itself is `script.gs`, a Google Apps Script. Paste it into a script bound to your Gmail account at [script.google.com](https://script.google.com), fill in the config constants at the top of the file (`WEBHOOK_URL`, `LABEL`, `CHANNEL`, `BODY_LENGTH`), and set up a time-driven trigger to run `main()`.

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
