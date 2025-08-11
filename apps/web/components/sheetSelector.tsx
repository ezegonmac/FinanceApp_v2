import { useSheetId } from "../hooks/useSheetId";
import { useState } from "react";

export default function SheetSelector() {
    const [sheetId, setSheetId] = useSheetId();
    const [inputValue, setInputValue] = useState(sheetId ?? process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID ?? "");

    const handleSaveSheetId = () => {
        setSheetId(sheetId);
        alert("Sheet ID saved!");
    };

    return (
        <>
            <input
                type="text"
                style={{ width: "30em" }}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter Google Sheet ID"
            /> &nbsp;
            <button onClick={handleSaveSheetId}>Save ID</button>
        </> 
    )
}