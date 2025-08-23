import type { NextApiRequest, NextApiResponse } from 'next';
import AccountsApi from 'utils/apiClient/server/accountsApi';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sheetId = req.query.id as string;
  const accountId = req.query.id as string;
  if (!sheetId) return res.status(400).json({ error: 'Missing sheet ID' });

  try {
    const accounts = new AccountsApi(sheetId);
    const account = await accounts.findById(accountId);
    res.status(200).json({ data: account });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
}
