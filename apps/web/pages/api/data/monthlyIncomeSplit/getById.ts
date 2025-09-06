import type { NextApiRequest, NextApiResponse } from 'next';
import monthlyIncomeSplitApi from '@utils/apiClient/server/monthlyIncomeSplitApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sheetId = req.query.id as string;
  if (!sheetId) return res.status(400).json({ error: 'Missing sheet ID' });

  const splitId = req.query.splitId as string;
  if (!splitId) return res.status(400).json({ error: 'Missing split ID' });

  try {
    const splits = new monthlyIncomeSplitApi(sheetId);
    const split = await splits.findById(splitId);
    res.status(200).json({ data: split });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch monthly income split data' });
  }
}

