import { google } from 'googleapis';
import schemaDict from 'schema.json';
import { colNumberToLetter } from 'utils/sheets';

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

    return titles.reduce((acc, title, i) => {
      acc[title] = all[i];
      return acc;
    }, {} as Record<string, any>);
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

  async createSheet(sheetTitle: string): Promise<boolean>{
    const sheetsApi = await this.getSheetsApi();
    let created = false;
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
      created = true
    } catch (err: any) {
      created = false;
      if (!err.message?.includes('already exists')) throw err;
    }
    return created;
  }

  async writeValues(
    sheetTitle: string,
    range: string,
    values: any[][]
  ): Promise<void> {
    const sheetsApi = await this.getSheetsApi();

    await sheetsApi.spreadsheets.values.update({
      spreadsheetId: this.sheetId,
      range: `'${sheetTitle}'!${range}`,
      valueInputOption: "RAW",
      requestBody: { values },
    });
  }

  async appendRow(sheetTitle: string, values: any[][]): Promise<void> {
    const sheetsApi = await this.getSheetsApi();

    await sheetsApi.spreadsheets.values.append({
      spreadsheetId: this.sheetId,
      range: sheetTitle,
      valueInputOption: 'RAW',
      requestBody: { values },
    });
  }

  async readValues(
    sheetTitle: string,
    range: string
  ): Promise<any[][]> {
    const sheetsApi = await this.getSheetsApi();

    const response = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: this.sheetId,
      range: `'${sheetTitle}'!${range}`,
    });

    return response.data.values ?? [];
  }

  async buildSchema(): Promise<{ success: boolean; sheets: string[] }> {
    let createdSheets: string[] = [];

    const configTitle = Object.keys(schemaDict)[0];
    const configDict = schemaDict.Configuration;
    const dataDict = schemaDict.Data;

    // Create sheets if they don't exist
    const sheetTitles = [configTitle, ...Object.keys(dataDict)]
    console.log("Creating sheets: ", sheetTitles);
    for (const sheetTitle of sheetTitles) {
      console.log("Creating sheet: ", sheetTitle);
      try {
        const created = await this.createSheet(sheetTitle);
        if (created) {
          createdSheets.push(sheetTitle);
          console.log("Sheet created: ", sheetTitle);
        } else {
          console.log("The sheet was already created: ", sheetTitle);
        }
      } catch(err) {
        throw new Error(`Could not create the sheet: ${sheetTitle}. ${err}`);
      }
    }

    // Write data headers and default values into first two columns
    console.log("Populating data sheets");
    for (const [sheetTitle, headers] of Object.entries(dataDict)) {
      console.log("Populating sheet: ", sheetTitle);
      // dont populate already existing sheets
      if (sheetTitle in createdSheets) {
        console.log("Sheet already present");
        continue;
      }
      // headers in first row
      if(headers.length>0) {
        const endColumn = colNumberToLetter(headers.length);
        await this.writeValues(sheetTitle, `A1:${endColumn}1`, [headers]);
        console.log("Sheet populated: ", sheetTitle);
      }
    }

    // Write config entries into first column
    let rowIndex = 1;
    // dont populate if config sheet already exists
    console.log("Populating configs");
    if (createdSheets.includes(configTitle)) {
      for (const [attribute, defValue] of Object.entries(configDict)) {
        const row = [attribute, defValue ?? '']; // attribute in col A, default in col B
        await this.writeValues(configTitle, `A${rowIndex}:B${rowIndex}`, [row]);
        rowIndex++;
      }
      console.log("Config sheet populated");
    } else {
      console.log("Config sheet already present");
    }

    return { success: true, sheets: createdSheets };
  }

  async clearSpreadsheet(): Promise<void> {
    const sheetsApi = await this.getSheetsApi();

    // Get all sheet IDs
    const spreadsheet = await sheetsApi.spreadsheets.get({
      spreadsheetId: this.sheetId,
    });

    const sheetIds =
      spreadsheet.data.sheets?.filter(s => s.properties?.title !== "Default")
        .map(s => s.properties?.sheetId).filter(Boolean) || [];

    if (sheetIds.length === 0) return;

    // Batch delete all existing sheets except default one
    const deleteRequests = sheetIds.map(sheetId => ({
      deleteSheet: { sheetId },
    }));

    await sheetsApi.spreadsheets.batchUpdate({
      spreadsheetId: this.sheetId,
      requestBody: { requests: deleteRequests },
    });

  }

}

export default SheetsApi;
