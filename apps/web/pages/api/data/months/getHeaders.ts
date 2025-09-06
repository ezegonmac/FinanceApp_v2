import type { NextApiRequest, NextApiResponse } from 'next';
import MonthsApi from 'utils/apiClient/server/monthsApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const sheetId = req.query.id as string;
  if (!sheetId) return res.status(400).json({ error: 'Missing sheet ID' });

  try {
    const months = new MonthsApi(sheetId);
    const headers = await months.getHeaders();
    res.status(200).json({ data: headers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get headers' });
  }
}
