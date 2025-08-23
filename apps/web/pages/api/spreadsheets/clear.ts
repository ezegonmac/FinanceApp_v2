import type { NextApiRequest, NextApiResponse } from "next";
import SheetsApi from "utils/apiClient/server/sheetsApi";

/**
 * API route to clear the whole spreadsheet
 *
 * Query parameters:
 *   - id: Spreadsheet ID.
 *
 * Returns:
 *   - 200: { success: true, message: 'Spreadsheet cleared and reset to Default' }
 *   - 400: { error: 'Missing sheet ID' }
 *   - 500: { error: 'Failed to clear sheet data' }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sheetId = req.query.id as string;
  if (!sheetId) return res.status(400).json({ error: "Missing sheet ID" });

  try {
    const sheetsApi = new SheetsApi(sheetId);
    await sheetsApi.clearSpreadsheet();

    res.status(200).json({ success: true, message: "Spreadsheet cleared and reset to Default" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to clear spreadsheet" });
  }
}
