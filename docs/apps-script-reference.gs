/**
 * Reference Google Apps Script — NOT deployed automatically.
 *
 * Deploy manually:
 *   1. Open the target Google Sheet.
 *   2. Extensions > Apps Script, paste this file's contents.
 *   3. Deploy > New deployment > type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone (the Cloudflare Function is the only
 *        caller, and it never exposes this URL to the browser).
 *   4. Copy the deployment URL into the Cloudflare Pages env var
 *      GOOGLE_SHEETS_WEBHOOK_URL.
 *
 * Expects a JSON POST body of the form:
 *   { "timestamp": "...", "location": "...", "metric": "...", "referral": "..." }
 *
 * Appends one row per event, in this fixed column order:
 *   Timestamp | Location | Engagement Metric | Referral Source
 */
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    data.timestamp,
    data.location,
    data.metric,
    data.referral
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
