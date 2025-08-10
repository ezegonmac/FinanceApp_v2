
export async function fetchSheetData(accessToken: string) {
    const res = await fetch("/api/sheet", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch sheet data: ${res.status}`);
    }
    return res.json();
}