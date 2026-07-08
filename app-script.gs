/*
 * PROJECT: slack-email-app
 * FILE:    app-script.gs
 * AUTHOR:  Ishan Kunam
 * ------------------------
 * ------------------------
 * forward new emails labeled "[ Weiser ]" to Slack (i.e., #logs-emails)
 * & format message as rich text
 */
/** biome-ignore-all lint/correctness/noUnusedVariables: still in dev */

/* input webhook details */
const WEBHOOK_URL =
	"https://hooks.slack.com/services/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";
const GMAIL_LABEL = "[ Weiser ]";
const SLACK_CHANNEL = "#logs-email";
const BODY_PREVIEW_CHARS = 400; // character limit for Slack message

/*
 * ----------------
 * helper functions
 * ----------------
 */

/* format date object as "MONTH DAY, YEAR | TIME" (e.g., July 6, 2026 | 4:00 PM) */
function format_date(date) {
	return Utilities.formatDate(
		date,
		sessionStorage.getScriptTimeZone(),
		"MMMM d, yyyy | h:mm a",
	);
} // format_date()

/* ensure special characters in an email bypass Slack's mrkdwn formatting syntax */
function bypass_mrkdwn(text) {
	return text
		.replace(/&/g, "&amp;") // ampersand (&)
		.replace(/</g, "&lt;") // less than (<)
		.replace(/>/g, "&gt;"); // greater than (>)
}
