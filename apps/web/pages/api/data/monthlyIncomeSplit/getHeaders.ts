import type { NextApiRequest, NextApiResponse } from 'next';
import monthlyIncomeSplitApi from '@utils/apiClient/server/monthlyIncomeSplitApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sheetId = req.query.id as string;
  if (!sheetId) return res.status(400).json({ error: 'Missing sheet ID' });

  try {
    const splits = new monthlyIncomeSplitApi(sheetId);
    const headers = await splits.getHeaders();
    res.status(200).json({ data: headers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch monthly income split headers' });
  }
}

