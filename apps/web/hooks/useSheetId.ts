import { useState, useEffect } from "react";

const STORAGE_KEY = "sheetId";

export function useSheetId() {
    const [sheetId, setSheetId] = useState<string | null>(null);

    useEffect(() => {
        const storedSheetId = localStorage.getItem(STORAGE_KEY);
        if (storedSheetId) {
            setSheetId(storedSheetId);
        }
        console.log("No sheetId");
    }, []);

    const clearSheetId = () => {
        setSheetId(null);
    }

    useEffect(() => {
        if (sheetId) {
            localStorage.setItem(STORAGE_KEY, sheetId);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [sheetId]);

    return [sheetId, setSheetId, clearSheetId] as const;
}