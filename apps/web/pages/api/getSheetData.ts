import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

/**
 * API route to fetch a range of values from a Google Sheet using a Service Account.
 * 
 * Query parameters:
 *   - id: Spreadsheet ID.
 * 
 * Returns:
 *   - 200: { data: string[][] } containing the sheet values
 *   - 400: { error: 'Missing sheet ID' } if no sheet ID is provided
 *   - 500: { error: 'Failed to fetch sheet data' } for any other errors
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const sheetId = req.query.id as string;
    if (!sheetId) return res.status(400).json({ error: 'Missing sheet ID' });

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE,
                private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
                client_id: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID,
            },
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Fetch spreadsheet metadata to get first sheet title
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: sheetId,
        });
        const firstSheetTitle = spreadsheet.data.sheets?.[0]?.properties?.title;

        // Fetch a range of values (A1:D10 of first sheet)
        const range = `'${firstSheetTitle}'!A1:D10`;
        const sheetData = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range,
        });

        const data = sheetData.data.values;

        res.status(200).json({ data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch sheet data' });
    }
}