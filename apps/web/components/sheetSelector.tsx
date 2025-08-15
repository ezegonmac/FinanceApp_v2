import { useState } from "react";

export default function SheetSelector({ sheetId, setSheetId, clearSheetId }) {
    const [inputValue, setInputValue] = useState(sheetId ?? process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID ?? "");

    const [isSaved, setIsSaved] = useState<boolean>(false);

    const handleSaveSheetId = () => {
        setSheetId(inputValue);
        setIsSaved(true);
    };

    const handleClearSheetId = () => {
        clearSheetId();
        setIsSaved(false);
    }

    return (
        <>
            {!isSaved && 
            <>
                <input
                    type="text"
                    style={{ width: "30em" }}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter Google Sheet ID"
                /> &nbsp;
                <button onClick={handleSaveSheetId}>Save ID</button> &nbsp;
            </>
            }
            
            {isSaved && 
            <>
                <p>Sheet ID: <span style={{color: 'green'}}>{sheetId}</span></p>
                <button onClick={handleClearSheetId}>Clear ID</button>
            </>
            }
        </> 
    )
}