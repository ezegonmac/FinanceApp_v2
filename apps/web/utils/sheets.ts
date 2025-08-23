
export function colNumberToLetter(col: number): string {
  let letter = "";
  while (col > 0) {
    const rem = (col - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

export function transpose<T>(matrix: T[][]): T[][] {
  if (!matrix.length) return [];
  const rowCount = matrix.length;
  const colCount = Math.max(...matrix.map(row => row.length));

  return Array.from({ length: colCount }, (_, colIdx) =>
    Array.from({ length: rowCount }, (_, rowIdx) => matrix[rowIdx][colIdx] ?? null)
  );
}