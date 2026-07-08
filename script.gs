/*
 * PROJECT: slack-gmail-app
 * FILE:    script.gs
 * AUTHOR:  Ishan Kunam
 * ------------------------
 * ------------------------
 * forward email w/ defined label to Slack channel w/ configured webhook
 * & format message as rich text
 */

/*
 * ------------------------
 * input user configuration
 * ------------------------
 */
const WEBHOOK_URL = "";
const LABEL = ""; // name of Gmail label
const CHANNEL = ""; // name of Slack channel
const BODY_LENGTH = undefined; // character limit for Slack message

/*
 * ----------------
 * helper functions
 * ----------------
 */

/*
 * format date object as "MONTH DAY, YEAR | TIME" (e.g., July 6, 2026 | 4:00 PM)
 */
function format_date(date) {
	return Utilities.formatDate(
		date,
		sessionStorage.getScriptTimeZone(),
		"MMMM d, yyyy | h:mm a",
	);
} // format_date()

/*
 * ensure special characters in an email bypass Slack's mrkdwn formatting syntax
 */
function bypass_mrkdwn(text) {
	return text
		.replace(/&/g, "&amp;") // ampersand (&)
		.replace(/</g, "&lt;") // less than (<)
		.replace(/>/g, "&gt;"); // greater than (>)
} // bypass_mrkdwn()

/*
 * truncate email body to max length & append an ellipsis
 */
function truncate_email(body, max_length) {
	if (!body) return "_(no body content)_";

	const cleaned = body.replace(/\r\n/g, "\n").trim();
	if (cleaned.length <= max_length) return bypass_mrkdwn(cleaned);

	const truncated = cleaned.substring(0, max_length);
	const last_space = truncated.lastIndexOf(" ");
	const clean = last_space > 0 ? truncated.substring(0, last_space) : truncated;

	return `${bypass_mrkdwn(clean)}...`;
} // truncate_email()

/*
 * define JSON for Slack Block Kit
 */
function define_JSON(email) {
	// call Gmail getter functions
	const subject = email.getSubject() || "(no subject)";
	const from = email.getFrom() || "—";
	const to = email.getTo() || "—";
	const cc = email.getCc() || "";

	// call our helper functions
	const date = format_date(email.getDate());
	const body = truncate_email(email.getPlainBody(), BODY_LENGTH);

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
	const blocks = [
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

	// details for final payload
	return {
		channel: CHANNEL,
		unfurl_links: false,
		text: subject, // fallback text for notifications
		blocks: blocks,
	};
} // define_JSON()

/*
 * build JSON payload & post to configured webhook
 */
function build_payload(email) {
	// call helper function to build the payload
	const payload = define_JSON(email);

	// build HTTP POST request
	const options = {
		method: "post",
		contentType: "applications/json",
		payload: JSON.stringify(payload),
		muteHttpExceptions: true,
	};

	// send POST request to Slack webhook URL
	const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
	const response_code = response.getResponseCode();

	if (response_code !== 200) {
		throw new Error(
			`Slack webhook returned ${response_code}: ${response.getContentText()}`,
		);
	} // if... payload is unsuccessful
} // build_payload()

/*
 * -------------
 * main function
 * -------------
 */

// biome-ignore lint/correctness/noUnusedVariables: runs are triggered by Apps Script
function main() {
	const label = GmailApp.getUserLabelByName(LABEL);

	if (!label) {
		Logger.log(`Label "${LABEL}" not found. Check the Gmail filter setup.`);
		return;
	} // if... label not found

	// loop through unread messages in each labeled thread, post to Slack, and mark as read
	const threads = label.getThreads(); // get all threads w/ given label

	let processed_count = 0; // count processed emails

	threads.forEach((thread) => {
		thread.getMessages().forEach((email) => {
			if (!email.isUnread()) return;

			try {
				build_payload(email);
				email.markRead();
				processed_count++;
			} catch (error) {
				Logger.log(`Failed to post message "${email.getSubject()}": ${error}`);
			}
		});
	});

	// send number of processed emails to Apps Script execution log
	Logger.log(`Processed ${processed_count} new email(s).`);
} // main()
