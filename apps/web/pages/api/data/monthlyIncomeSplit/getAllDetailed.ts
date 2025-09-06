import type { NextApiRequest, NextApiResponse } from 'next';
import MonthlyIncomeSplitApi from 'utils/apiClient/server/monthlyIncomeSplitApi';
import AccountsApi from 'utils/apiClient/server/accountsApi';
import MonthsApi from 'utils/apiClient/server/monthsApi';
import { joinObjects } from 'utils/entityUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sheetId = req.query.id as string;
  if (!sheetId) return res.status(400).json({ error: 'Missing sheet ID' });

  try {
    const splitsApi = new MonthlyIncomeSplitApi(sheetId);
    const accountsApi = new AccountsApi(sheetId);
    const monthsApi = new MonthsApi(sheetId);

    const splits = await splitsApi.getAllObjects();
    const accounts = await accountsApi.getAllObjects();
    const months = await monthsApi.getAllObjects();

    const relations = {
        'toAccountId': accounts,
        'fromAccountId': accounts,
        'monthId': months
    }

    const [joinedData, headers] = joinObjects(splits, relations, Object.keys(splits[0] || {}));

    res.status(200).json({ data: joinedData, headers: headers });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch detailed monthly income split data' });
  }
}
