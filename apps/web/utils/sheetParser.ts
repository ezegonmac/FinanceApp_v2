export function parseRawSheetToObject(sheetData: string[][]): Record<string, string[]> {

    const headers = sheetData[0];
    const sheetObj: Record<string, string[]> = {};

    headers.forEach((header, colIndex) => {
        const columnValues = sheetData
            .slice(1) // skip header row
            .map(row => row[colIndex] || '') // empty if missing
            .filter(v => v !== ''); // optional: skip empty strings

        sheetObj[header] = columnValues;
    });

    return sheetObj;
}
