import { google } from "googleapis";

/**
 * API route to check if the service account has access to a given Google Sheet.
 * 
 * Query parameters:
 *   - id: spreadsheet ID.
 * 
 * Returns:
 *   - 200: { access: true } if the service account can access the sheet
 *   - 403: { access: false } if access is denied
 */
export default async function handler(req, res) {
    const sheetId = (req.query.id as string);

    const auth = new google.auth.GoogleAuth({
    credentials: {
        type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID,
    },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    try {
        await sheets.spreadsheets.get({ spreadsheetId: sheetId });
        res.status(200).json({ access: true });
    } catch {
        res.status(403).json({ access: false });
    }
}