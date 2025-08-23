
class AccountsApi {
  private sheetId: string;
  private baseUrl = "/api";

  constructor(sheetId: string) {
    if (!sheetId) throw new Error("No sheet ID provided");
    this.sheetId = sheetId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.includes('?') 
      ? `${this.baseUrl}/${endpoint}&id=${encodeURIComponent(this.sheetId)}`
      : `${this.baseUrl}/${endpoint}?id=${encodeURIComponent(this.sheetId)}`;

    const res = await fetch(url, options);

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

  private async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  async getAll(): Promise<string[][]> {
    const json = await this.request<{ data: string[][] }>("data/accounts/getAll");
    return json.data;
  }

  async create(name: string): Promise<void> {
    await this.post("data/accounts/create", { name });
  }

}

export default AccountsApi;
