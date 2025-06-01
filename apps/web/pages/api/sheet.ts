import { getSheetData } from "@/packages/api/googleSheets";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const accessToken = req.headers.authorization?.split('Bearer ')[1];
  if (!accessToken) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const data = await getSheetData("YOUR_SHEET_ID", "Sheet1!A1:D10", accessToken);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sheet data' });
  }
}