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

export async function loadSheetData(sheetId: string | null): Promise<{ data: String[][] | null; error?: string }> {
    if (!sheetId) return { data: null, error: "No sheet ID provided" };

    try {
        const res = await fetch(`/api/getSheetData?id=${encodeURIComponent(sheetId)}`);
        if (!res.ok) {
            const text = await res.text();
            console.error("Load failed: ", text);
            return { data: null, error: `Load failed` };
        }
        const json = await res.json();
        return { data: json.data };
    } catch (err) {
        console.error("Error loading sheet data:", err);
        return { data: null, error: "Error loading sheet data" };
    }
}

export async function populateSpreadsheet(sheetId: string | null): Promise<{ success: boolean | null; error?: string }> {
    if (!sheetId) return { success: false, error: "No sheet ID provided" };

    try {
        const res = await fetch(`/api/populateSpreadsheet?id=${encodeURIComponent(sheetId)}`);
        if (!res.ok) {
            const text = await res.text();
            console.error("Populate failed: ", text);
            return { success: false, error: `Populate failed` };
        }
        const json = await res.json();
        return { success: json.success };
    } catch (err) {
        console.error("Error populating spreadsheet data:", err);
        return { success: false, error: "Error populating spreadsheet data" };
    }
}
