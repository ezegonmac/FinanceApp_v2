import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

/**
 * API route to fetch a range of values from a Google Sheet.
 * 
 * Header:
 *   - Authorization: Bearer token (Google OAuth access token).
 * 
 * Query parameters:
 *   - id: Spreadsheet ID.
 * 
 * Returns:
 *   - 200: { data: string[][] } containing the sheet values
 *   - 400: { error: 'Missing sheet ID' } if no sheet ID is provided
 *   - 401: { error: 'Unauthorized' } if no access token is provided
 *   - 500: { error: 'Failed to fetch sheet data' } for any other errors
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const sheetId = (req.query.id as string);
    if (!sheetId) return res.status(400).json({ error: 'Missing sheet ID' });

    const accessToken = req.headers.authorization?.split('Bearer ')[1];
    if (!accessToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: sheetId,
        });
        const firstSheetTitle = spreadsheet.data.sheets?.[0]?.properties?.title;

        const range = `'${firstSheetTitle}'!A1:D10`;
        const sheetData = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range,
        });
        
        const data = sheetData.data.values;
        
        res.status(200).json({ data });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch sheet data' });
    }
}
