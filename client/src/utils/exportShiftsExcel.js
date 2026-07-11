import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const DAY_NAMES_FULL = [
  'יום ראשון',
  'יום שני',
  'יום שלישי',
  'יום רביעי',
  'יום חמישי',
  'יום שישי',
  'יום שבת',
];

const HEADER_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF0D7377' },
};

const DAY_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD6EAF8' },
};

const DATA_FILL_EVEN = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF8F9FA' },
};

const DATA_FILL_ODD = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFFFFF' },
};

const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12, name: 'Arial' };
const SUB_HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Arial' };
const DAY_FONT = { bold: true, size: 11, name: 'Arial', color: { argb: 'FF1B4F72' } };
const DATA_FONT = { size: 10, name: 'Arial' };

const THIN_BORDER = {
  top: { style: 'thin', color: { argb: 'FFB0B0B0' } },
  left: { style: 'thin', color: { argb: 'FFB0B0B0' } },
  bottom: { style: 'thin', color: { argb: 'FFB0B0B0' } },
  right: { style: 'thin', color: { argb: 'FFB0B0B0' } },
};

function toISODate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function platformLabel(platform) {
  return platform === 'telegram' ? 'טלגרם' : 'אונליפאנס';
}

function getShiftsForDayType(shifts, date, type) {
  const dateStr = toISODate(date);
  return shifts.filter((s) => {
    const shiftDate = s.date?.split('T')[0] || s.date;
    const isMatchDate = shiftDate === dateStr;
    const isMatchType =
      type === 'morning'
        ? s.shiftType === 'morning' || s.startTime === '12:00'
        : s.shiftType === 'evening' || s.startTime === '19:00';
    return isMatchDate && isMatchType;
  });
}

/**
 * @param {Date} weekStart
 * @param {Array} shifts - array of shift objects with populated chatterId and assignments
 */
export default async function exportShiftsExcel(weekStart, shifts) {
  const wb = new ExcelJS.Workbook();
  wb.views = [{ rightToLeft: true }];

  const ws = wb.addWorksheet('לוח משמרות', {
    views: [{ rightToLeft: true }],
  });

  // Column widths (A=ימים, B=צ'אטר morning, C=מיוצגת morning, D=צ'אטר evening, E=מיוצגת evening)
  ws.columns = [
    { width: 16 },
    { width: 18 },
    { width: 40 },
    { width: 18 },
    { width: 40 },
  ];

  // --- Row 1: main headers ---
  const headerRow1 = ws.getRow(1);
  ws.mergeCells('A1:A2');
  ws.getCell('A1').value = 'ימים';
  ws.getCell('A1').font = HEADER_FONT;
  ws.getCell('A1').fill = HEADER_FILL;
  ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl' };
  ws.getCell('A1').border = THIN_BORDER;

  ws.mergeCells('B1:C1');
  ws.getCell('B1').value = 'חלון עבודה – צהריים – 12:00-19:00';
  ws.getCell('B1').font = HEADER_FONT;
  ws.getCell('B1').fill = HEADER_FILL;
  ws.getCell('B1').alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl' };
  ws.getCell('B1').border = THIN_BORDER;
  ws.getCell('C1').border = THIN_BORDER;

  ws.mergeCells('D1:E1');
  ws.getCell('D1').value = 'חלון עבודה – ערב – 19:00-2:00';
  ws.getCell('D1').font = HEADER_FONT;
  ws.getCell('D1').fill = HEADER_FILL;
  ws.getCell('D1').alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl' };
  ws.getCell('D1').border = THIN_BORDER;
  ws.getCell('E1').border = THIN_BORDER;

  headerRow1.height = 30;

  // --- Row 2: sub-headers ---
  const subHeaders = ['', "צ'אטר", 'מיוצגת + פלטפורמה', "צ'אטר", 'מיוצגת + פלטפורמה'];
  const headerRow2 = ws.getRow(2);
  subHeaders.forEach((text, i) => {
    if (i === 0) return; // A2 is merged with A1
    const cell = headerRow2.getCell(i + 1);
    cell.value = text;
    cell.font = SUB_HEADER_FONT;
    cell.fill = HEADER_FILL;
    cell.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl' };
    cell.border = THIN_BORDER;
  });
  headerRow2.height = 26;

  // --- Data rows per day ---
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  let currentRow = 3;

  days.forEach((day, dayIdx) => {
    const morningShifts = getShiftsForDayType(shifts, day, 'morning');
    const eveningShifts = getShiftsForDayType(shifts, day, 'evening');

    const rowCount = Math.max(morningShifts.length, eveningShifts.length, 1);
    const startRow = currentRow;
    const endRow = currentRow + rowCount - 1;

    // Merge day name cell vertically
    if (rowCount > 1) {
      ws.mergeCells(startRow, 1, endRow, 1);
    }
    const dayCell = ws.getCell(startRow, 1);
    dayCell.value = DAY_NAMES_FULL[day.getDay()];
    dayCell.font = DAY_FONT;
    dayCell.fill = DAY_FILL;
    dayCell.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl', wrapText: true };
    dayCell.border = THIN_BORDER;

    for (let r = 0; r < rowCount; r++) {
      const rowNum = startRow + r;
      const row = ws.getRow(rowNum);
      const fill = r % 2 === 0 ? DATA_FILL_EVEN : DATA_FILL_ODD;

      // Day column: apply fill/border to merged area cells too
      if (r > 0) {
        const dc = ws.getCell(rowNum, 1);
        dc.fill = DAY_FILL;
        dc.border = THIN_BORDER;
      }

      // Morning shift data
      const mShift = morningShifts[r];
      const mChatterCell = row.getCell(2);
      const mModelsCell = row.getCell(3);

      if (mShift) {
        mChatterCell.value = mShift.chatterId?.name || '';
        const modelsList = (mShift.assignments || [])
          .map((a) => `${a.modelName || a.model?.name || ''} – ${platformLabel(a.platform)}`)
          .join(', ');
        mModelsCell.value = modelsList;
      } else {
        mChatterCell.value = '';
        mModelsCell.value = '';
      }

      mChatterCell.font = DATA_FONT;
      mChatterCell.fill = fill;
      mChatterCell.alignment = { horizontal: 'right', vertical: 'middle', readingOrder: 'rtl', wrapText: true };
      mChatterCell.border = THIN_BORDER;

      mModelsCell.font = DATA_FONT;
      mModelsCell.fill = fill;
      mModelsCell.alignment = { horizontal: 'right', vertical: 'middle', readingOrder: 'rtl', wrapText: true };
      mModelsCell.border = THIN_BORDER;

      // Evening shift data
      const eShift = eveningShifts[r];
      const eChatterCell = row.getCell(4);
      const eModelsCell = row.getCell(5);

      if (eShift) {
        eChatterCell.value = eShift.chatterId?.name || '';
        const modelsList = (eShift.assignments || [])
          .map((a) => `${a.modelName || a.model?.name || ''} – ${platformLabel(a.platform)}`)
          .join(', ');
        eModelsCell.value = modelsList;
      } else {
        eChatterCell.value = '';
        eModelsCell.value = '';
      }

      eChatterCell.font = DATA_FONT;
      eChatterCell.fill = fill;
      eChatterCell.alignment = { horizontal: 'right', vertical: 'middle', readingOrder: 'rtl', wrapText: true };
      eChatterCell.border = THIN_BORDER;

      eModelsCell.font = DATA_FONT;
      eModelsCell.fill = fill;
      eModelsCell.alignment = { horizontal: 'right', vertical: 'middle', readingOrder: 'rtl', wrapText: true };
      eModelsCell.border = THIN_BORDER;

      row.height = 24;
    }

    currentRow = endRow + 1;
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `לוח-משמרות-${toISODate(weekStart)}.xlsx`);
}
