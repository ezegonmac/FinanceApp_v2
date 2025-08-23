import type { NextApiRequest, NextApiResponse } from 'next';
import AccountsApi from 'utils/apiClient/server/accountsApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const sheetId = req.query.id as string;
  if (!sheetId) return res.status(400).json({ error: 'Missing sheet ID' });

  try {
    const accounts = new AccountsApi(sheetId);
    const headers = await accounts.getHeaders();
    res.status(200).json({ data: headers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get headers' });
  }
}
