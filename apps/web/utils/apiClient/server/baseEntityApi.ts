// utils/apiClient/server/baseSheetApi.ts
import { transpose } from 'utils/sheets';
import SheetsApi from './sheetsApi';

export default abstract class BaseEntityApi {
    protected sheetApi: SheetsApi;
    protected sheetId: string;
    protected sheetName: string;

    constructor(sheetId: string, sheetName: string) {
        this.sheetApi = new SheetsApi(sheetId);
        this.sheetId = sheetId;
        this.sheetName = sheetName;
    }

    async getHeaders(): Promise<string[]> {
        const headers = (await this.sheetApi.readValues(this.sheetName, '1:1'))[0];
        return headers;
    }

    async getAll(): Promise<string[][]> {
        const data = await this.sheetApi.getSheet(this.sheetName);
        data.shift(); // Remove headers
        return data;
    }

    async getAllObjects(): Promise<Object[]> {
        const sheetData = await this.sheetApi.getSheet(this.sheetName);
        const headers = sheetData[0];
        const data = sheetData.slice(1, sheetData.length);
        
        const objects = data.reduce(
            (acc, row) => {

                let object = {};
                for(const [i, header] of headers.entries()) {
                    object[header] = row[i]; 
                }
                acc.push(object);

                return acc;
            },
            [] as Object[],
        );

        return objects;
    }

    async findById(id: string) {
        const data = await this.getAll();
        const transposed = transpose(data);
        const index = transposed['id'].indexOf(id);
        if (index === -1) return null;

        const result: Record<string, string> = {};
        Object.keys(transposed).forEach(key => (result[key] = transposed[key][index]));
        return result;
    }

    async create(data: Record<string, any>): Promise<string[]> {
        const headers = await this.getHeaders();
        const values = headers.map(header => data[header] || '');
        await this.sheetApi.appendRow(this.sheetName, [values]);
        return values;
    }

}
