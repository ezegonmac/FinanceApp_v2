import type { NextApiRequest, NextApiResponse } from 'next';
import MonthsApi from 'utils/apiClient/server/monthsApi';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sheetId = req.query.id as string;
  if (!sheetId) return res.status(400).json({ error: 'Missing sheet ID' });

  const monthId = req.query.monthId as string;
  if (!monthId) return res.status(400).json({ error: 'Missing month ID' });

  try {
    const months = new MonthsApi(sheetId);
    const month = await months.findById(monthId);
    res.status(200).json({ data: month });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch month' });
  }
}
