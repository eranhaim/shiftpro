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
  fgColor: { argb: 'FF4A5D80' },
};

const DAY_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD6EAF8' },
};

// ירוק בהיר לימים זוגיים, כחול בהיר לימים אי-זוגיים
const DAY_COLOR_EVEN = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } }; // ירוק
const DAY_COLOR_ODD  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } }; // כחול

const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12, name: 'Arial' };
const SUB_HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Arial' };
const DAY_FONT = { bold: true, size: 11, name: 'Arial', color: { argb: 'FF000000' } };
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
 * Column layout (RTL view):
 * A = ימים          ← מימין ביותר בתצוגת RTL
 * B = צ'אטר (צהריים)
 * C = מיוצגת + פלטפורמה (צהריים)
 * D = צ'אטר (ערב)
 * E = מיוצגת + פלטפורמה (ערב)
 */
export default async function exportShiftsExcel(weekStart, shifts) {
  const wb = new ExcelJS.Workbook();
  wb.views = [{ rightToLeft: true }];

  const ws = wb.addWorksheet('לוח משמרות', {
    views: [{ rightToLeft: true }],
  });

  ws.columns = [
    { width: 16 }, // A - ימים
    { width: 18 }, // B - צ'אטר צהריים
    { width: 65 }, // C - מיוצגת צהריים
    { width: 18 }, // D - צ'אטר ערב
    { width: 65 }, // E - מיוצגת ערב
  ];

  // --- Row 1: main headers ---
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

  ws.getRow(1).height = 30;

  // --- Row 2: sub-headers ---
  const headerRow2 = ws.getRow(2);
  [
    { col: 'B', text: "צ'אטר" },
    { col: 'C', text: 'מיוצגת + פלטפורמה' },
    { col: 'D', text: "צ'אטר" },
    { col: 'E', text: 'מיוצגת + פלטפורמה' },
  ].forEach(({ col, text }) => {
    const cell = ws.getCell(`${col}2`);
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

    const dayFill = dayIdx % 2 === 0 ? DAY_COLOR_EVEN : DAY_COLOR_ODD;

    // Merge day name cell (col A) vertically
    if (rowCount > 1) {
      ws.mergeCells(startRow, 1, endRow, 1);
    }
    const dayCell = ws.getCell(startRow, 1);
    dayCell.value = DAY_NAMES_FULL[day.getDay()];
    dayCell.font = DAY_FONT;
    dayCell.fill = dayFill;
    dayCell.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl', wrapText: true };
    dayCell.border = THIN_BORDER;

    for (let r = 0; r < rowCount; r++) {
      const rowNum = startRow + r;
      const row = ws.getRow(rowNum);
      const fill = dayFill;

      if (r > 0) {
        const dc = ws.getCell(rowNum, 1);
        dc.fill = dayFill;
        dc.border = {
          top: { style: 'thin', color: { argb: 'FFB0B0B0' } },
          left: { style: 'thin', color: { argb: 'FFB0B0B0' } },
          bottom: { style: 'thin', color: { argb: 'FFB0B0B0' } },
          right: { style: 'thin', color: { argb: 'FFB0B0B0' } },
        };
      }

      // Morning: B = צ'אטר, C = מיוצגת
      const mShift = morningShifts[r];
      const mChatterCell = row.getCell(2); // B
      const mModelsCell = row.getCell(3);  // C

      if (mShift) {
        mChatterCell.value = mShift.chatterId?.name || '';
        const modelsList = (mShift.assignments || [])
          .map((a) => `${a.modelName || a.model?.name || ''} – ${platformLabel(a.platform)}`)
          .join(' | ');
        mModelsCell.value = modelsList;
      } else {
        mChatterCell.value = '';
        mModelsCell.value = '';
      }

      mChatterCell.font = { ...DATA_FONT, bold: true };
      mChatterCell.fill = fill;
      mChatterCell.alignment = { horizontal: 'right', vertical: 'middle', readingOrder: 'rtl', wrapText: true };
      mChatterCell.border = THIN_BORDER;

      mModelsCell.font = DATA_FONT;
      mModelsCell.fill = fill;
      mModelsCell.alignment = { horizontal: 'right', vertical: 'middle', readingOrder: 'rtl', wrapText: true };
      mModelsCell.border = THIN_BORDER;

      // Evening: D = צ'אטר, E = מיוצגת
      const eShift = eveningShifts[r];
      const eChatterCell = row.getCell(4); // D
      const eModelsCell = row.getCell(5);  // E

      if (eShift) {
        eChatterCell.value = eShift.chatterId?.name || '';
        const modelsList = (eShift.assignments || [])
          .map((a) => `${a.modelName || a.model?.name || ''} – ${platformLabel(a.platform)}`)
          .join(' | ');
        eModelsCell.value = modelsList;
      } else {
        eChatterCell.value = '';
        eModelsCell.value = '';
      }

      eChatterCell.font = { ...DATA_FONT, bold: true };
      eChatterCell.fill = fill;
      eChatterCell.alignment = { horizontal: 'right', vertical: 'middle', readingOrder: 'rtl', wrapText: true };
      eChatterCell.border = THIN_BORDER;

      eModelsCell.font = DATA_FONT;
      eModelsCell.fill = fill;
      eModelsCell.alignment = { horizontal: 'right', vertical: 'middle', readingOrder: 'rtl', wrapText: true };
      eModelsCell.border = THIN_BORDER;


      row.height = 16;
    }

    currentRow = endRow + 1;

    // שורה לבנה בין ימים
    if (dayIdx < days.length - 1) {
      const sepRow = ws.getRow(currentRow);
      sepRow.height = 16;
      for (let colNum = 1; colNum <= 5; colNum++) {
        const cell = ws.getCell(currentRow, colNum);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        cell.border = {};
      }
      currentRow += 1;
    }
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `לוח-משמרות-${toISODate(weekStart)}.xlsx`);
}
