import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import SheetsApi from 'utils/apiClient/sheets';

/**
 * API route to fetch all sheets containing data (not configuration) 
 * from a Google Spreadsheet,
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

    const sheetsApi = new SheetsApi(sheetId);

    let titles: string[] = [];
    try {
      titles = await sheetsApi.getAllTitles();
    } catch (err) {
      console.error("Could not load sheet titles:", err);
    }

    const configurationTitle = process.env.CONFIGURATION_SHEET_TITLE as string;
    const filteredTitles = titles.filter(title => title !== configurationTitle);

    const allData = await Promise.all(
      filteredTitles.map(title => sheetsApi.getSheet(title))
    );

    res.status(200).json({ data: allData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch spreadsheet data' });
  }
}
