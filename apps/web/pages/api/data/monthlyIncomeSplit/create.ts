import MonthlyIncomeSplitApi from '@utils/apiClient/server/monthlyIncomeSplitApi';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // const sheetId = req.query.id as string;
  const { sheetId } = req.body;
  if (!sheetId) return res.status(400).json({ error: 'Missing sheet ID' });

  const { monthId } = req.body;
  const { month } = req.body;
  const { year } = req.body;
  if (!monthId && !(month && year)) return res.status(400).json({ error: 'Missing monthId or missing month and year' });

  const { fromAccountId } = req.body;
  if (!fromAccountId) return res.status(400).json({ error: 'Missing fromAccountId' });

  const { toAccountId } = req.body;
  if (!toAccountId) return res.status(400).json({ error: 'Missing toAccountId' });

  const { amount } = req.body;
  if (!amount) return res.status(400).json({ error: 'Missing amount' });

  try {
    const splits = new MonthlyIncomeSplitApi(sheetId);
    await splits.create({ 
      monthId,
      month,
      year,
      fromAccountId,
      toAccountId,
      amount
    });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create monthly income split' });
  }
}
