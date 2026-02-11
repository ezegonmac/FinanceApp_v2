
class AccountsApi {

  private async request<T>(action: string): Promise<T> {
    const url = `/accounts/${action}`
    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Request to ${url} failed: ${text}`);
    }

    try {
      return await res.json();
    } catch (err) {
      throw new Error(`Failed to parse JSON from ${url}`);
    }
  }

  async getAll(): Promise<string> {
    const json = await this.request<string>("getAll");
    return json;
  }
}

export default AccountsApi;
