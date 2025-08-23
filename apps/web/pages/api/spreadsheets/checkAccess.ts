import type { NextApiRequest, NextApiResponse } from 'next';
import SheetsApi from 'utils/apiClient/server/sheetsApi';

/**
 * API route to check if the service account has access to a given Google Sheet.
 *
 * Query parameters:
 *   - id: Spreadsheet ID.
 *
 * Returns:
 *   - 200: { access: true } if the service account can access the sheet
 *   - 403: { access: false } if access is denied
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sheetId = req.query.id as string;
  if (!sheetId) return res.status(400).json({ error: 'Missing sheet ID' });

  try {
    const sheetsApi = new SheetsApi(sheetId);
    const hasAccess = await sheetsApi.checkAccess();

    if (hasAccess) {
      res.status(200).json({ access: true });
    } else {
      res.status(403).json({ access: false });
    }
  } catch (err) {
    console.error('Error checking sheet access:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
