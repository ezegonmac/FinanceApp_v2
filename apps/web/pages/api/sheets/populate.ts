import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

/**
 * API route to prepopulate a Google Spreadsheet with predefined sheets and values.
 *
 * Query parameters:
 *   - id: Spreadsheet ID (required)
 *
 * Returns:
 *   - 200: { success: true, sheets: string[] } with the names of populated sheets
 *   - 400: { error: 'Missing sheet ID' } if no spreadsheet ID is provided
 *   - 500: { error: 'Failed to populate sheet' } for other failures
 */

const configSheetTitle = process.env.CONFIGURATION_SHEET_TITLE as string;
const sheetsDictionary: Record<string, string[]> = {
  configSheetTitle: ['email', 'theme'],
  'Accounts': ['id', 'name'],
  'Sales': ['id', 'name'],
};

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

    const gSheetsApi = google.sheets({ version: 'v4', auth });

    // Loop through the dictionary
    for (const [sheetTitle, values] of Object.entries(sheetsDictionary)) {
      // Add new sheet (skip if it already exists)
      try {
        await gSheetsApi.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: { title: sheetTitle },
                },
              },
            ],
          },
        });
      } catch (err) {
        // If sheet exists, ignore error
        if (!err.message.includes('already exists')) throw err;
      }

      // Write values into the sheet (starting at A1)
      await gSheetsApi.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `'${sheetTitle}'!A1:${String.fromCharCode(64 + values.length)}1`, // e.g., A1:D1
        valueInputOption: 'RAW',
        requestBody: { values: [values] }, // wrap the array in another array to make a single row
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to populate sheet' });
  }
}
