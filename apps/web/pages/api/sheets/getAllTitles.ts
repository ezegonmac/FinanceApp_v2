import type { NextApiRequest, NextApiResponse } from 'next';
import SheetsApi from 'utils/apiClient/server/sheetsApi';

/**
 * API route to fetch all sheet titles from a Google Spreadsheet.
 *
 * Query parameters:
 *   - id: Spreadsheet ID.
 *
 * Returns:
 *   - 200: { data: string[] } where `data` contains all sheet titles
 *   - 400: { error: 'Missing sheet ID' }
 *   - 500: { error: 'Failed to fetch sheet data' }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sheetId = req.query.id as string;
  if (!sheetId) return res.status(400).json({ error: 'Missing sheet ID' });

  try {
    const sheets = new SheetsApi(sheetId);
    const titles = await sheets.getAllTitles();
    res.status(200).json({ data: titles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sheet data' });
  }
}
