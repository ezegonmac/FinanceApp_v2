// pages/api/sheets/getSheet.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { parseRawSheetToObject } from 'utils/sheetParser';

/**
 * API route to fetch a single sheet from a Google Spreadsheet,
 * by its title, and structure it as an object where the first row
 * contains keys and each key maps to the list of values in that column.
 *
 * Query parameters:
 *   - id: Spreadsheet ID
 *   - title: Sheet title
 *
 * Returns:
 *   - 200: { data: { [columnName: string]: string[] } }
 *   - 400: { error: 'Missing sheet ID or title' }
 *   - 500: { error: 'Failed to fetch sheet data' }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const sheetId = req.query.id as string;
  const title = req.query.title as string;

  if (!sheetId) {
    return res.status(400).json({ error: 'Missing sheet ID' });
  }
  if (!title) {
    return res.status(400).json({ error: 'Missing sheet title' });
  }

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

    const sheetsApi = google.sheets({ version: 'v4', auth });

    const sheetResponse = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: title,
    });

    const rawData = sheetResponse.data.values || [];
    const structuredData = parseRawSheetToObject(rawData);

    res.status(200).json({ data: structuredData });
  } catch (err) {
    console.error('Failed to fetch sheet data:', err);
    res.status(500).json({ error: 'Failed to fetch sheet data' });
  }
}
