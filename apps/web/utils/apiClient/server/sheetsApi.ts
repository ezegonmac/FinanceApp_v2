import { google } from 'googleapis';

class SheetsApi {
  private sheetId: string;

  constructor(sheetId: string) {
    if (!sheetId) throw new Error("No sheet ID provided");
    this.sheetId = sheetId;
  }

  private async getSheetsApi() {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return google.sheets({ version: 'v4', auth });
  }

  async checkAccess(): Promise<boolean> {
    try {
      const sheetsApi = await this.getSheetsApi();
      await sheetsApi.spreadsheets.get({ spreadsheetId: this.sheetId });
      return true;
    } catch {
      return false;
    }
  }

  async getSpreadsheet(): Promise<
    Record<string, Record<string, string[]>>
  > {
    const titles = await this.getAllTitles();
    const all = await Promise.all(titles.map((title) => this.getSheet(title)));

    return Object.assign({}, ...all);
  }

  async getSheet(sheetTitle: string): Promise<string[][]> {
    const sheetsApi = await this.getSheetsApi();
    const sheet = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: this.sheetId,
      range: sheetTitle,
    });
    return sheet.data.values ?? [];
  }

  async getAllData(): Promise<Record<string, string[][]>> {
    const sheetsApi = await this.getSheetsApi();
    const spreadsheet = await sheetsApi.spreadsheets.get({ spreadsheetId: this.sheetId });
    const titles = spreadsheet.data.sheets?.map(s => s.properties?.title).filter((t): t is string => Boolean(t)) || [];

    const data = await Promise.all(
      titles.map(async (title) => {
        const res = await sheetsApi.spreadsheets.values.get({ spreadsheetId: this.sheetId, range: title });
        return [title, res.data.values || []] as const;
      })
    );

    return Object.fromEntries(data);
  }

  async getAllConfigurations(): Promise<string[][]> {
    const configSheetTitle = process.env.CONFIGURATION_SHEET_TITLE;
    return this.getSheet(configSheetTitle);
  }

  async getAllTitles(): Promise<string[]> {
    const sheetsApi = await this.getSheetsApi();
    const spreadsheet = await sheetsApi.spreadsheets.get({
      spreadsheetId: this.sheetId,
    });

    return (
      spreadsheet.data.sheets
        ?.map((s) => s.properties?.title)
        .filter((t): t is string => Boolean(t)) || []
    );
  }

  /**
   * Prepopulates the spreadsheet with predefined sheets and headers.
   */
  async populate(
    sheetsDictionary: Record<string, string[]>
  ): Promise<{ success: boolean; sheets: string[] }> {
    const sheetsApi = await this.getSheetsApi();
    const createdSheets: string[] = [];

    for (const [sheetTitle, values] of Object.entries(sheetsDictionary)) {
      // Try to create sheet
      try {
        await sheetsApi.spreadsheets.batchUpdate({
          spreadsheetId: this.sheetId,
          requestBody: {
            requests: [
              {
                addSheet: { properties: { title: sheetTitle } },
              },
            ],
          },
        });
        createdSheets.push(sheetTitle);
      } catch (err: any) {
        // Ignore if it already exists
        if (!err.message?.includes('already exists')) throw err;
      }

      // Write headers into first row
      await sheetsApi.spreadsheets.values.update({
        spreadsheetId: this.sheetId,
        range: `'${sheetTitle}'!A1:${String.fromCharCode(64 + values.length)}1`,
        valueInputOption: 'RAW',
        requestBody: { values: [values] },
      });
    }

    return { success: true, sheets: createdSheets };
  }
}

export default SheetsApi;
