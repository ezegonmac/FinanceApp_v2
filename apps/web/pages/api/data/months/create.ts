import type { NextApiRequest, NextApiResponse } from 'next';
import MonthsApi from 'utils/apiClient/server/monthsApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const sheetId = req.query.id as string;
  if (!sheetId) return res.status(400).json({ error: 'Missing sheet ID' });

  const { month, year } = req.body;
  if (!month) return res.status(400).json({ error: 'Missing month' });
  if (!year) return res.status(400).json({ error: 'Missing year' });

  try {
    const months = new MonthsApi(sheetId);
    await months.create({ month, year });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create month' });
  }
}
