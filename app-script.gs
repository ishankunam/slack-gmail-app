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

/* format a date object as "MONTH DAY, YEAR | TIME" (e.g., July 6, 2026 | 4:00 PM)*/
function format_date(date) {
	return Utilities.formatDate(
		date,
		sessionStorage.getScriptTimeZone(),
		"MMMM d, yyyy | h:mm a",
	);
} // format_date()

//////////////////////////////////////////
/**
 * Entry point. Run manually once to authorize, then attach a
 * time-driven trigger to call this automatically.
 */
function main() {
	const label = GmailApp.getUserLabelByName(GMAIL_LABEL);
	if (!label) {
		Logger.log(
			`Label "${GMAIL_LABEL}" not found. Check the Gmail filter setup.`,
		);
		return;
	}

	const threads = label.getThreads();
	let processedCount = 0;

	threads.forEach((thread) => {
		thread.getMessages().forEach((message) => {
			if (!message.isUnread()) return;

			try {
				postMessageToSlack(message);
				message.markRead();
				processedCount++;
			} catch (err) {
				Logger.log(`Failed to post message "${message.getSubject()}": ${err}`);
			}
		});
	});

	Logger.log(`Processed ${processedCount} new message(s).`);
}

/**
 * Builds a Slack Block Kit payload for a single Gmail message and
 * posts it to the configured webhook.
 */
function postMessageToSlack(message) {
	const payload = buildSlackPayload(message);

	const options = {
		method: "post",
		contentType: "application/json",
		payload: JSON.stringify(payload),
		muteHttpExceptions: true,
	};

	const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
	const responseCode = response.getResponseCode();

	if (responseCode !== 200) {
		throw new Error(
			`Slack webhook returned ${responseCode}: ${response.getContentText()}`,
		);
	}
}

/**
 * Assembles the Block Kit JSON for a message: subject as the
 * header line, a From/To/CC/Date field grid, a divider, then a
 * truncated plain-text body preview.
 */
function buildSlackPayload(message) {
	const subject = message.getSubject() || "(no subject)";
	const from = message.getFrom() || "—";
	const to = message.getTo() || "—";
	const cc = message.getCc() || "";
	const date = formatDate(message.getDate());
	const bodyPreview = truncateBody(message.getPlainBody(), BODY_PREVIEW_LENGTH);

	const fields = [
		{ type: "mrkdwn", text: `*From:*\n${escapeMrkdwn(from)}` },
		{ type: "mrkdwn", text: `*To:*\n${escapeMrkdwn(to)}` },
	];

	if (cc) {
		fields.push({ type: "mrkdwn", text: `*CC:*\n${escapeMrkdwn(cc)}` });
	}
	fields.push({ type: "mrkdwn", text: `*Date:*\n${date}` });

	const blocks = [
		{
			type: "section",
			text: {
				type: "mrkdwn",
				text: `*${escapeMrkdwn(subject)}*`,
			},
		},
		{
			type: "section",
			fields: fields,
		},
		{ type: "divider" },
		{
			type: "section",
			text: {
				type: "mrkdwn",
				text: bodyPreview,
			},
		},
	];

	return {
		channel: SLACK_CHANNEL,
		unfurl_links: false,
		text: subject, // fallback text for notifications/screen readers
		blocks: blocks,
	};
}

/**
 * Trims the plain-text body to a max length, breaking cleanly at a
 * word boundary and appending an ellipsis if truncated.
 */
function truncateBody(body, maxLength) {
	if (!body) return "_(no body content)_";

	const cleaned = body.replace(/\r\n/g, "\n").trim();
	if (cleaned.length <= maxLength) return escapeMrkdwn(cleaned);

	const truncated = cleaned.substring(0, maxLength);
	const lastSpace = truncated.lastIndexOf(" ");
	const clean = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;

	return escapeMrkdwn(clean) + "…";
}

/**
 * Escapes Slack mrkdwn special characters so email content doesn't
 * break formatting or get interpreted as markup.
 */
function escapeMrkdwn(text) {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}
