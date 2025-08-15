import { useState, useEffect } from "react";

const STORAGE_KEY = "sheetId";

export function useSheetId() {
    const [sheetId, setSheetId] = useState<string | null>(() => {
        if (typeof window === "undefined") return null;
        return localStorage.getItem(STORAGE_KEY);
    });

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