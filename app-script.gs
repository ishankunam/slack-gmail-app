/*
 * PROJECT: slack-email-app
 * FILE:    app-script.gs
 * AUTHOR:  Ishan Kunam
 * ------------------------
 * ------------------------
 * forward new emails labeled "[ Weiser ]" to Slack (i.e., #logs-emails)
 * & format message as rich text
 */

// input webhook details
const WEBHOOK_URL =
  "https://hooks.slack.com/services/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";
const LABEL_NAME = "[ Weiser ]";
const BODY_PREVIEW_CHARS = 400; // character limit for Slack message
