import { google } from 'googleapis';
import SheetsApi from './sheetsApi';

class AccountsApi {
    private sheetId: string;

    constructor(sheetId: string) {
        if (!sheetId) throw new Error("No sheet ID provided");
        this.sheetId = sheetId;
    }

    private async getAccountsApi() {
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

    async getAll(): Promise<string[][]> {
        const sheetApi = new SheetsApi(this.sheetId);
        const data = await sheetApi.getSheet("Accounts");
        return data;
    }

}

export default AccountsApi;