import AccountsTable from "../components/AccountsTable";
import { useSheetId } from "../hooks/useSheetId";

export default function AccountsPage() {
    const [sheetId, setSheetId, clearSheetId] = useSheetId();

    return (
        <div style={{fontFamily: 'sans-serif'}}>
            <h1>Accounts</h1>
            {sheetId ? (
                <AccountsTable sheetId={sheetId}/>
            ) : (
                <p>Loading sheet...</p>
            )}
        </div>
    );
}
