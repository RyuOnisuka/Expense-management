import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import prisma from '../db';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// Convert Excel serial date number to JS Date
function excelDateToJS(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  return new Date(utcDays * 86400 * 1000);
}

// Parse "003/006" → { current: 3, total: 6 }
function parseInstallmentPeriod(period: string): { current: number; total: number } {
  if (!period || period === '000/000' || period === '0') return { current: 0, total: 0 };
  const parts = String(period).split('/');
  return {
    current: parseInt(parts[0]) || 0,
    total: parseInt(parts[1]) || 0,
  };
}

// Get row value by key (handles trimmed column names with spaces)
function getVal(row: any, key: string): string {
  // Direct match first
  if (row[key] !== undefined) return String(row[key] ?? '');
  // Try trimmed key match
  const trimmedKey = key.trim();
  for (const k of Object.keys(row)) {
    if (k.trim() === trimmedKey) return String(row[k] ?? '');
  }
  return '';
}

// Parse number from Excel string like ' 3,452.00 ' or numeric
function parseNum(row: any, key: string): number {
  const raw = getVal(row, key).replace(/,/g, '').trim();
  const n = parseFloat(raw);
  return isNaN(n) ? 0 : n;
}

// Parse date from string like '2/26/22' or serial number
function parseDate(val: any): Date {
  if (typeof val === 'number') return excelDateToJS(val);
  if (typeof val === 'string' && val.trim()) {
    const d = new Date(val.trim());
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

// ─── PREVIEW: Return parsed rows without saving ──────────────────────────────
router.post('/preview', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });

    if (!wb.SheetNames.includes('MyExpense')) {
      return res.status(400).json({ error: '"MyExpense" sheet not found in the file.' });
    }

    const ws = wb.Sheets['MyExpense'];
    const rows = XLSX.utils.sheet_to_json(ws) as any[];

    const preview = rows.slice(0, 30).map((row, i) => ({
      rowNum: i + 2,
      date: parseDate(row['Date']).toLocaleDateString('th-TH'),
      creditCard: getVal(row, 'Credit Card'),
      appPayment: getVal(row, 'App Payment'),
      detail: getVal(row, 'Detail'),
      instPeriod: getVal(row, 'Inst.Period') || '000/000',
      dueDate: parseDate(row['Due Date']).toLocaleDateString('th-TH'),
      paymentCode: getVal(row, 'Payment_Code') || 'S',
      totalAmt: parseNum(row, 'Total AMT'),
      pkAmt: parseNum(row, 'PK_AMT'),
      ncAmt: parseNum(row, 'NC_AMT'),
    }));

    res.json({
      totalRows: rows.length,
      sheets: wb.SheetNames,
      preview,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── IMPORT: Parse and save to MySQL ─────────────────────────────────────────
router.post('/confirm', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const results = {
    imported: 0,
    skipped: 0,
    creditCardsCreated: [] as string[],
    paymentAppsCreated: [] as string[],
    errors: [] as string[],
  };

  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets['MyExpense'];
    if (!ws) return res.status(400).json({ error: '"MyExpense" sheet not found.' });

    const rows = XLSX.utils.sheet_to_json(ws) as any[];

    for (const row of rows) {
      try {
        const detail = getVal(row, 'Detail').trim();
        const creditCardName = getVal(row, 'Credit Card').trim();
        const appPaymentName = getVal(row, 'App Payment').trim();
        const instPeriodStr = (getVal(row, 'Inst.Period') || '000/000').trim();
        const paymentCode = (getVal(row, 'Payment_Code') || 'S').trim().toUpperCase();
        const totalAmt = parseNum(row, 'Total AMT');
        const pkAmt = parseNum(row, 'PK_AMT');
        const ncAmt = parseNum(row, 'NC_AMT');

        if (!detail || !creditCardName) { results.skipped++; continue; }

        const date = parseDate(row['Date']);
        const dueDateRaw = row['Due Date'];
        const dueDate = (typeof dueDateRaw === 'number' || (typeof dueDateRaw === 'string' && dueDateRaw.trim()))
          ? parseDate(dueDateRaw) : null;
        const { current: instCurrent, total: instTotal } = parseInstallmentPeriod(instPeriodStr);

        // ── Upsert CreditCard ──
        let card = await prisma.creditCard.findFirst({ where: { name: creditCardName } });
        if (!card) {
          card = await prisma.creditCard.create({
            data: { name: creditCardName, statementCycleDay: 25, dueDateDay: 5, userId: 1 },
          });
          results.creditCardsCreated.push(creditCardName);
        }

        // ── Upsert PaymentApp ──
        let paymentApp = null;
        if (appPaymentName) {
          paymentApp = await prisma.paymentApp.upsert({
            where: { name: appPaymentName },
            update: {},
            create: { name: appPaymentName },
          });
          if (!results.paymentAppsCreated.includes(appPaymentName)) {
            results.paymentAppsCreated.push(appPaymentName);
          }
        }

        // ── Create Expense ──
        await prisma.expense.create({
          data: {
            title: detail,
            totalAmount: totalAmt,
            pkAmount: pkAmt,
            ncAmount: ncAmt,
            paymentCode,
            date,
            dueDate,
            installmentCurrent: instCurrent,
            installmentTotal: instTotal,
            userId: 1,
            creditCardId: card.id,
            paymentAppId: paymentApp?.id ?? null,
          },
        });

        results.imported++;
      } catch (rowErr: any) {
        results.errors.push(rowErr.message);
        results.skipped++;
      }
    }

    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
