import type { NextApiRequest, NextApiResponse } from 'next';
import SheetsApi from 'utils/apiClient/server/sheetsApi';
import { parseRawSheetToObject } from 'utils/sheetParser';

/**
 * API route to fetch the configuration sheet from a Google Spreadsheet.
 *
 * Query parameters:
 *   - id: Spreadsheet ID.
 *
 * Returns:
 *   - 200: {
 *       data: {
 *         [columnName: string]: string[]
 *       }
 *     }
 *   - 400: { error: 'Missing sheet ID' }
 *   - 500: { error: 'Failed to fetch sheet data' }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sheetId = req.query.id as string;
  if (!sheetId) return res.status(400).json({ error: 'Missing sheet ID' });

  try {
    const sheetsApi = new SheetsApi(sheetId);

    const configurationTitle = process.env.CONFIGURATION_SHEET_TITLE as string;
    if (!configurationTitle) throw new Error("CONFIGURATION_SHEET_TITLE env variable not set");

    const rawSheetData = await sheetsApi.getSheet(configurationTitle);
    
    // optional: parse first row as keys and remaining rows as values
    const configurationsSheetData = parseRawSheetToObject(rawSheetData);

    res.status(200).json({ data: configurationsSheetData });
  } catch (err) {
    console.error("Failed to fetch configuration sheet:", err);
    res.status(500).json({ error: 'Failed to fetch spreadsheet data' });
  }
}
