/**
 * Calculate the crop region for a screen in a matrix display.
 * Assumes the composition is divided into a uniform grid.
 * 
 * @param compWidth - Composition width in pixels
 * @param compHeight - Composition height in pixels
 * @param matrixRow - Row index of this screen (0-based)
 * @param matrixCol - Column index of this screen (0-based)
 * @param totalRows - Total number of rows in the matrix
 * @param totalCols - Total number of columns in the matrix
 * @returns Crop region { x, y, width, height } in composition coordinates
 */
export function calculateMatrixCrop(
  compWidth: number,
  compHeight: number,
  matrixRow: number,
  matrixCol: number,
  totalRows: number,
  totalCols: number
) {
  const sectionWidth = compWidth / totalCols;
  const sectionHeight = compHeight / totalRows;

  return {
    x: matrixCol * sectionWidth,
    y: matrixRow * sectionHeight,
    width: sectionWidth,
    height: sectionHeight,
  };
}

/**
 * Infer the total matrix dimensions by looking at screen assignments.
 * Scans all screens to find max row and column indices.
 */
export function inferMatrixDimensions(screens: Array<{ matrixRow: number | null; matrixCol: number | null }>) {
  let maxRow = 0;
  let maxCol = 0;

  for (const screen of screens) {
    if (screen.matrixRow !== null && screen.matrixRow > maxRow) {
      maxRow = screen.matrixRow;
    }
    if (screen.matrixCol !== null && screen.matrixCol > maxCol) {
      maxCol = screen.matrixCol;
    }
  }

  // Return actual grid size (indices 0-based, so add 1)
  return {
    totalRows: maxRow + 1,
    totalCols: maxCol + 1,
  };
}
