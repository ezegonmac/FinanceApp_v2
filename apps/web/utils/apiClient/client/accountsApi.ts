
class AccountsApi {
  private sheetId: string;
  private baseUrl = "/api";

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

  async getAll(): Promise<string[][]> {
    const json = await this.request<{ data: string[][] }>("/data/accounts/getAll");
    return json.data;
  }

}

export default AccountsApi;
