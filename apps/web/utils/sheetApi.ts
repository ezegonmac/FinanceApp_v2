export async function checkSheetAccess(sheetId: string | null): Promise<{ access: boolean; error?: string }> {
  if (!sheetId) return { access: false, error: "No sheet ID provided" };

  try {
    const res = await fetch(`/api/checkSheetAccess?id=${encodeURIComponent(sheetId)}`);
    if (!res.ok) {
      const text = await res.text();
      console.error("Access check failed: ", text);
      return { access: false, error: `Access check failed` };
    }
    const json = await res.json();
    return { access: Boolean(json.access) };
  } catch (err) {
    console.error("Error checking sheet access:", err);
    return { access: false, error: "Error trying to check access" };
  }
}

export async function loadSheetData(sheetId: string | null, token: string | null): Promise<{ data?: any; error?: string }> {
  if (!sheetId) return { error: "No sheet ID provided" };
  if (!token) return { error: "No access token" };

  try {
    const res = await fetch(`/api/sheet?id=${encodeURIComponent(sheetId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Failed to load sheet: ", text);
      return { error: `Failed to load sheet` };
    }

    const json = await res.json();
    return { data: json.data };
  } catch (err) {
    console.error("Error loading sheet data:", err);
    return { error: "Error trying to load sheet" };
  }
}
