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
const BODY_LENGTH = 400; // character limit for Slack message

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
} // bypass_mrkdwn()

/* truncate email body to max length & append an ellipsis */
function truncate_email(body, max_length) {
	if (!body) return "_(no body content)_"; // if... no body

	const cleaned = body.replace(/\r\n/g, "\n").trim();
	if (cleaned.length <= max_length) return bypass_mrkdwn(cleaned); // if... body <= max length

	const truncated = cleaned.substring(0, max_length);
	const last_space = truncated.lastIndexOf(" ");
	const clean = last_space > 0 ? truncated.substring(0, last_space) : truncated;

	return `${bypass_mrkdwn(clean)}...`;
} // truncate_email()

/* define JSON for Slack Block Kit */
function define_JSON(message) {
	// call Gmail getter functions
	const subject = message.getSubject() || "(no subject)";
	const from = message.getFrom() || "—";
	const to = message.getTo() || "—";
	const cc = message.getCc() || "";

	// call our helper functions
	const date = format_date(message.getDate());
	const body = truncate_email(message.getPlainBody(), BODY_LENGTH);

	// build Block Kit field grid
	const fields = [
		{ type: "mrkdwn", text: `*From:*\n${escapeMrkdwn(from)}` },
		{ type: "mrkdwn", text: `*To:*\n${escapeMrkdwn(to)}` },
	];
	if (cc) {
		fields.push({ type: "mrkdwn", text: `*CC:*\n${escapeMrkdwn(cc)}` });
	} // if... there is a CC recipient
	fields.push({ type: "mrkdwn", text: `*Date:*\n${date}` });

	// assemble the blocks in their expected order
	const block = [
		{
			type: "section", // Subject
			text: {
				type: "mrkdwn",
				text: `*${escapeMrkdwn(subject)}*`,
			},
		},
		{
			type: "section", // From, To, CC, Date
			fields: fields,
		},
		{ type: "divider" }, // ---
		{
			type: "section", // Body
			text: {
				type: "mrkdwn",
				text: body,
			},
		},
	];

	return {
		channel: SLACK_CHANNEL,
		unfurl_links: false,
		text: subject, // fallback text for notifications
		blocks: blocks,
	};
} // define_JSON()

/*
 * -------------
 * main function
 * -------------
 */
function main() {} // main()
