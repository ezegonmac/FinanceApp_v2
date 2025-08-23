import type { NextApiRequest, NextApiResponse } from 'next';
import SheetsApi from 'utils/apiClient/server/sheetsApi';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sheetId = req.query.id as string;
  if (!sheetId) return res.status(400).json({ error: 'Missing sheet ID' });

  try {
    const sheets = new SheetsApi(sheetId);
    const result = await sheets.populate(sheetsDictionary);
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to populate sheet' });
  }
}
