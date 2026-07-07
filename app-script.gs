/*
 * PROJECT: slack-email-app
 * FILE:    app-script.gs
 * AUTHOR:  Ishan Kunam
 * ------------------------
 * ------------------------
 * forward new emails labeled "[ Weiser ]" to Slack (i.e., #logs-emails)
 * & format message as rich text
 */

/* input webhook details */
const WEBHOOK_URL =
  "https://hooks.slack.com/services/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";
const LABEL_NAME = "[ Weiser ]"; // Gmail label
const BODY_PREVIEW_CHARS = 400; // character limit for Slack message

/* check for unread emails w/ label "[ Weiser ]" & forward to Slack */
function check_for_mail() {
  const label = GmailApp.getUserLabelByName(LABEL_NAME);

  if (!label) {
    Logger.log(
      'Label "' +
        LABEL_NAME +
        '" not found. Check LABEL_NAME matches your Gmail filter.',
    );

    return;
  } // if... label mismatch

  const threads = label.getThreads(); // get label-associated email threads

  threads.forEach((thread) => {const messages = thread.getMessages();});

  } // check_for_mail()

//////////////////////////////////////////
function checkForNewEmails() {
  const label = GmailApp.getUserLabelByName(GMAIL_LABEL);
  if (!label) {
    console.log('Label "' + GMAIL_LABEL + '" not found. Check GMAIL_LABEL matches your Gmail filter.');
    return;
  }
 
  const threads = label.getThreads(0, 20); // cap per run to stay well under quota
  let postedCount = 0;
 
  threads.forEach(function (thread) {
    if (!thread.isUnread()) return;
 
    const messages = thread.getMessages();
    const message = messages[messages.length - 1]; // most recent message in thread
 
    try {
      const payload = buildSlackPayload(message);
      postToSlack(payload);
      postedCount++;
    } catch (err) {
      console.log('Failed to post message "' + message.getSubject() + '": ' + err);
      return; // leave unread so it retries next run
    }
 
    thread.markRead();
  });
 
  console.log('Posted ' + postedCount + ' new email(s) to Slack.');
}
