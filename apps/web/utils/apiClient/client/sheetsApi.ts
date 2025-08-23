
class SheetsApi {
  private sheetId: string;
  private baseUrl = "/api/sheets";

  constructor(sheetId: string) {
    if (!sheetId) throw new Error("No sheet ID provided");
    this.sheetId = sheetId;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const url = endpoint.includes('?') 
      ? `${this.baseUrl}/${endpoint}&id=${encodeURIComponent(this.sheetId)}`
      : `${this.baseUrl}/${endpoint}?id=${encodeURIComponent(this.sheetId)}`;

    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Request to ${endpoint} failed: ${text}`);
    }

    try {
      return await res.json();
    } catch (err) {
      throw new Error(`Failed to parse JSON from ${endpoint}`);
    }
  }

  async checkAccess(): Promise<boolean> {
    const json = await this.request<{ access: boolean }>("checkAccess");
    return Boolean(json.access);
  }

  async getSpreadsheet(): Promise<string[][]> {
    const json = await this.request<{ data: string[][] }>("getSpreadsheet");
    return json.data;
  }

  async getSheet(sheetTitle: string): Promise<string[][]> {
    const json = await this.request<{ data: string[][] }>(`getSheet?title=${encodeURIComponent(sheetTitle)}`);
    return json.data;
  }

  async getAllData(): Promise<string[][]> {
    const json = await this.request<{ data: string[][] }>("getAllData");
    return json.data;
  }

  async getAllConfigurations(): Promise<string[][]> {
    const json = await this.request<{ data: string[][] }>("getAllConfigurations");
    return json.data;
  }

  async getAllTitles(): Promise<string[]> {
    const json = await this.request<{ data: string[] }>("getAllTitles");
    return json.data;
  }

  async buildSchema(): Promise<boolean> {
    const json = await this.request<{ success: boolean }>("buildSchema");
    return Boolean(json.success);
  }
}

export default SheetsApi;
