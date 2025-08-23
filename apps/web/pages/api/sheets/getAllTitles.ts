import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

/**
 * API route to fetch all the sheet titles from a Google Spreadsheet.
 *
 * Query parameters:
 *   - id: Spreadsheet ID.
 *
 * Returns:
 *   - 200: { data: string[] } where `data` contains all sheet titles
 *   - 400: { error: 'Missing sheet ID' }
 *   - 500: { error: 'Failed to fetch sheet data' }
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
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const googleSheetsApi = google.sheets({ version: 'v4', auth });

    // get spreadsheet metadata
    const spreadsheet = await googleSheetsApi.spreadsheets.get({
      spreadsheetId: sheetId,
    });
    
    // Extract sheet titles safely
    const sheetTitles =
      spreadsheet.data.sheets
        ?.map((s) => s.properties?.title)
        .filter((t): t is string => Boolean(t)) || [];
    
    res.status(200).json({ data: sheetTitles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sheet data' });
  }
}
