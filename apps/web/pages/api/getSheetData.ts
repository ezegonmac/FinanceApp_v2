import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

/**
 * API route to fetch all sheets from a Google Spreadsheet using a Service Account,
 * and structure them so that the first row contains keys,
 * and each key maps to the list of values in that column.
 *
 * Query parameters:
 *   - id: Spreadsheet ID.
 *
 * Returns:
 *   - 200: {
 *       data: {
 *         [sheetName: string]: {
 *           [columnName: string]: string[]
 *         }
 *       }
 *     }
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

    const sheetsApi = google.sheets({ version: 'v4', auth });

    // Get metadata (all sheet names)
    const spreadsheet = await sheetsApi.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    const sheetNames = spreadsheet.data.sheets?.map(
      (s) => s.properties?.title
    ) || [];

    const allData: Record<string, Record<string, string[]>> = {};

    for (const name of sheetNames) {
      const sheetData = await sheetsApi.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: name,
      });

      const rows = sheetData.data.values || [];
      if (rows.length === 0) {
        allData[name] = {};
        continue;
      }

      const headers = rows[0];
      const sheetObj: Record<string, string[]> = {};

      headers.forEach((header, colIndex) => {
        const columnValues = rows
          .slice(1) // skip header row
          .map(row => row[colIndex] || '') // empty if missing
          .filter(v => v !== ''); // optional: skip empty strings

        sheetObj[header] = columnValues;
      });

      allData[name] = sheetObj;
    }

    res.status(200).json({ data: allData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sheet data' });
  }
}
