export default abstract class BaseEntityApi {
  protected sheetId: string;
  protected baseUrl = "/api";
  protected abstract entityName: string;

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

  protected async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  async getHeaders(): Promise<string[]> {
    const json = await this.request<{ data: string[] }>(
      `data/${this.entityName}/getHeaders`
    );
    return json.data;
  }

  async getAll(): Promise<string[][]> {
    const json = await this.request<{ data: string[][] }>(
      `data/${this.entityName}/getAll`
    );
    return json.data;
  }

  async create(data: Record<string, any>): Promise<void> {
    await this.post(`data/${this.entityName}/create`, data);
  }
}
