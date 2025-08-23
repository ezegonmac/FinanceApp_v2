import type { NextApiRequest, NextApiResponse } from 'next';
import AccountsApi from 'utils/apiClient/server/accountsApi';

/**
 * API route to fetch all non-configuration sheets from a Google Spreadsheet,
 * and structure them so that the first row contains keys,
 * and each key maps to the list of values in that column.
 *
 * Query parameters:
 *   - id: Spreadsheet ID.
 *
 * Returns:
 *   - 200: { data: ... }
 *   - 400: { error: 'Missing sheet ID' }
 *   - 500: { error: 'Failed to fetch sheet data' }
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sheetId = req.query.id as string;
  if (!sheetId) return res.status(400).json({ error: 'Missing sheet ID' });

  try {
    const accounts = new AccountsApi(sheetId);
    const allData = await accounts.getAll();
    res.status(200).json({ data: allData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch accounts data' });
  }
}

