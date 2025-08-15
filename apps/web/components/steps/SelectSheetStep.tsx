import Step from "./stepWrapper";
import SheetSelector from "../SheetSelector";

export function SelectSheetStep({ sheetId, setSheetId, clearSheetId }) {
    return (
        <Step title="Add your sheet ID">
            <SheetSelector sheetId={sheetId} setSheetId={setSheetId} clearSheetId={clearSheetId} />
        </Step>
    );
}