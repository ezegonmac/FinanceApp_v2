import type { NextApiRequest, NextApiResponse } from 'next';
import AccountsApi from 'utils/apiClient/server/accountsApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const sheetId = req.query.id as string;
  if (!sheetId) return res.status(400).json({ error: 'Missing sheet ID' });

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing account name' });

  try {
    const accounts = new AccountsApi(sheetId);
    await accounts.create({ name });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create account' });
  }
}
