import { google } from 'googleapis';

export async function getSheetData(sheetId: string, range: string, accessToken: string) {
  const sheets = google.sheets({ version: 'v4', auth: accessToken });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });
  return response.data.values;
}