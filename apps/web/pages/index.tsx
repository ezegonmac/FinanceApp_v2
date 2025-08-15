import { useState } from "react";
import { useSheetId } from "../hooks/useSheetId";
import { CreateSheetStep } from "../components/steps/createSheetStep";
import { SelectSheetStep } from "../components/steps/SelectSheetStep";
import { AllowServiceAccountStep } from "../components/steps/AllowServiceAccountStep";
import { LoadDataStep } from "../components/steps/LoadDataStep";

export default function HomePage() {

    const [sheetId, setSheetId, clearSheetId] = useSheetId();

    const [data, setData] = useState<any>(null);

    return (
        <div style={{fontFamily: 'sans-serif'}}>
            <h1>Google Sheets Demo</h1>
            
            <ol>
                <CreateSheetStep />
                <SelectSheetStep 
                    sheetId={sheetId} 
                    setSheetId={setSheetId} 
                    clearSheetId={clearSheetId} 
                />
                <AllowServiceAccountStep 
                    sheetId={sheetId}
                />
                <LoadDataStep 
                    sheetId={sheetId} 
                    setData={setData} 
                />
            </ol>

            {data && <pre>{data}</pre>}
        </div>
    );
}
