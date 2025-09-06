import MonthlySplitCard from "../components/MonthlySplitCard";
import { useSheetId } from "../hooks/useSheetId";

export default function MontlySplitPage() {
    const [sheetId, setSheetId, clearSheetId] = useSheetId();

    return (
        <div style={{fontFamily: 'sans-serif'}}>
            <h1>Montly Split</h1>
            {sheetId ? (
                <MonthlySplitCard sheetId={sheetId}/>
            ) : (
                <p>Loading sheet...</p>
            )}
        </div>
    );
}
