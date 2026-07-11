import React, { useState, useCallback } from 'react';
import axios from 'axios';

interface PreviewRow {
  rowNum: number;
  date: string;
  creditCard: string;
  appPayment: string;
  detail: string;
  instPeriod: string;
  dueDate: string;
  paymentCode: string;
  totalAmt: number;
  pkAmt: number;
  ncAmt: number;
}

interface PreviewData {
  totalRows: number;
  sheets: string[];
  preview: PreviewRow[];
}

interface ImportResult {
  imported: number;
  skipped: number;
  creditCardsCreated: string[];
  paymentAppsCreated: string[];
  errors: string[];
}

type Step = 'upload' | 'preview' | 'result';

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv'))) {
      setFile(f);
      setError('');
    } else {
      setError('กรุณาใช้ไฟล์ .xlsx หรือ .csv เท่านั้น');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setError(''); }
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post('/api/import/preview', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreviewData(res.data);
      setStep('preview');
    } catch (err: any) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการอ่านไฟล์');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post('/api/import/confirm', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      setStep('result');
    } catch (err: any) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการ Import ข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setPreviewData(null);
    setImportResult(null);
    setError('');
  };

  const fmt = (n: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(n);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">นำเข้าข้อมูล</h1>
          <p className="text-zinc-400 mt-1">Import ข้อมูลจากไฟล์ Excel (.xlsx) ที่มี Sheet "MyExpense"</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {(['upload', 'preview', 'result'] as Step[]).map((s, i) => {
            const labels = ['อัพโหลดไฟล์', 'ตรวจสอบข้อมูล', 'ผลลัพธ์'];
            const active = step === s;
            const done = (step === 'preview' && i === 0) || (step === 'result' && i < 2);
            return (
              <React.Fragment key={s}>
                {i > 0 && <div className={`flex-1 h-px ${done ? 'bg-success' : 'bg-white/10'}`} />}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                  ${active ? 'bg-primary text-white' : done ? 'bg-success/20 text-success' : 'bg-white/5 text-zinc-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                    ${active ? 'bg-white/20' : done ? 'bg-success/30' : 'bg-white/10'}`}>
                    {done ? '✓' : i + 1}
                  </span>
                  {labels[i]}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl px-4 py-3 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* ─── STEP 1: Upload ───────────────────────────────────────── */}
        {step === 'upload' && (
          <div className="space-y-4">
            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              className={`glass-card p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all
                ${dragging ? 'border-primary/60 bg-primary/5 scale-[1.01]' : 'border-white/5 hover:border-white/20'}`}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <div className={`text-6xl mb-4 transition-transform ${dragging ? 'scale-125' : ''}`}>
                {file ? '📊' : '📂'}
              </div>
              {file ? (
                <>
                  <p className="text-lg font-semibold text-primary">{file.name}</p>
                  <p className="text-zinc-400 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB · คลิกเพื่อเปลี่ยนไฟล์</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-zinc-200">วางไฟล์ที่นี่ หรือคลิกเพื่อเลือก</p>
                  <p className="text-zinc-400 text-sm mt-1">รองรับ .xlsx, .xls ที่มี Sheet "MyExpense"</p>
                </>
              )}
              <input id="file-input" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
            </div>

            {/* Info Card */}
            <div className="glass-card p-5">
              <h3 className="font-semibold text-zinc-200 mb-3 flex items-center gap-2"><span>📋</span> โครงสร้างข้อมูลที่รองรับ (Sheet: MyExpense)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['Date', 'Credit Card', 'App Payment', 'Detail', 'Inst.Period', 'Due Date', 'Payment_Code', 'Total AMT', 'PK_AMT', 'NC_AMT'].map(c => (
                        <th key={c} className="text-left py-2 px-3 text-zinc-400 font-medium">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-zinc-500 text-xs">
                      <td className="py-2 px-3">11/07/2025</td>
                      <td className="py-2 px-3">Aeon Big C</td>
                      <td className="py-2 px-3">K PLUS</td>
                      <td className="py-2 px-3">BIG C-...</td>
                      <td className="py-2 px-3">000/000</td>
                      <td className="py-2 px-3">05/08/2025</td>
                      <td className="py-2 px-3 text-warning">S / P</td>
                      <td className="py-2 px-3">3452</td>
                      <td className="py-2 px-3 text-primary">2374</td>
                      <td className="py-2 px-3 text-secondary">1078</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning inline-block" /> Payment Code: <strong className="text-warning">P</strong> = Personal (PK เท่านั้น)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block" /> Payment Code: <strong className="text-success">S</strong> = Shared (PK + NC แบ่งกัน)</span>
              </div>
            </div>

            <button
              onClick={handlePreview}
              disabled={!file || loading}
              className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ กำลังอ่านไฟล์...' : '🔍 ตรวจสอบข้อมูลก่อน Import'}
            </button>
          </div>
        )}

        {/* ─── STEP 2: Preview ──────────────────────────────────────── */}
        {step === 'preview' && previewData && (
          <div className="space-y-4">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-zinc-100">ตัวอย่างข้อมูล</h2>
                  <p className="text-zinc-400 text-sm mt-0.5">
                    พบ <span className="text-primary font-semibold">{previewData.totalRows} แถว</span> ·
                    แสดงตัวอย่าง {previewData.preview.length} แถวแรก
                    {previewData.sheets.length > 0 && (
                      <> · Sheets: {previewData.sheets.join(', ')}</>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-sm font-medium">
                    {file?.name}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-sm">
                  <thead className="bg-white/5">
                    <tr>
                      {['#', 'วันที่', 'บัตรเครดิต', 'App', 'รายการ', 'งวด', 'Due Date', 'Code', 'Total', 'PK', 'NC'].map(h => (
                        <th key={h} className="text-left py-2.5 px-3 text-zinc-400 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.preview.map((row, i) => (
                      <tr key={i} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                        <td className="py-2 px-3 text-zinc-500">{row.rowNum}</td>
                        <td className="py-2 px-3 text-zinc-300 whitespace-nowrap">{row.date}</td>
                        <td className="py-2 px-3 text-zinc-300 max-w-[140px] truncate" title={row.creditCard}>{row.creditCard}</td>
                        <td className="py-2 px-3 text-zinc-400">{row.appPayment}</td>
                        <td className="py-2 px-3 text-zinc-200 max-w-[160px] truncate" title={row.detail}>{row.detail}</td>
                        <td className="py-2 px-3 text-zinc-400 whitespace-nowrap">{row.instPeriod}</td>
                        <td className="py-2 px-3 text-zinc-400 whitespace-nowrap">{row.dueDate}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-bold
                            ${row.paymentCode === 'P' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>
                            {row.paymentCode}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-zinc-200 text-right font-medium whitespace-nowrap">
                          {row.totalAmt.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-primary text-right whitespace-nowrap">
                          {row.pkAmt.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-secondary text-right whitespace-nowrap">
                          {row.ncAmt.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewData.totalRows > 30 && (
                <p className="text-center text-zinc-500 text-sm mt-3">
                  ... และอีก {previewData.totalRows - 30} แถว (จะ Import ทั้งหมด)
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={reset} className="btn-secondary flex-none px-6">← ย้อนกลับ</button>
              <button
                onClick={handleImport}
                disabled={loading}
                className="btn-primary flex-1 py-3 text-base disabled:opacity-50"
              >
                {loading
                  ? `⏳ กำลัง Import ${previewData.totalRows} แถว...`
                  : `✅ ยืนยัน Import ทั้งหมด ${previewData.totalRows} แถว`}
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Result ───────────────────────────────────────── */}
        {step === 'result' && importResult && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'นำเข้าสำเร็จ', value: importResult.imported, color: 'success', icon: '✅' },
                { label: 'ข้ามแถว', value: importResult.skipped, color: 'warning', icon: '⚠️' },
                { label: 'บัตรใหม่', value: importResult.creditCardsCreated.length, color: 'primary', icon: '💳' },
                { label: 'App ใหม่', value: importResult.paymentAppsCreated.length, color: 'secondary', icon: '📱' },
              ].map((card) => (
                <div key={card.label} className="glass-card p-5 text-center">
                  <div className="text-3xl mb-2">{card.icon}</div>
                  <div className={`text-3xl font-bold text-${card.color}`}>{card.value}</div>
                  <div className="text-zinc-400 text-sm mt-1">{card.label}</div>
                </div>
              ))}
            </div>

            {/* New Master Data Created */}
            {(importResult.creditCardsCreated.length > 0 || importResult.paymentAppsCreated.length > 0) && (
              <div className="glass-card p-5 space-y-3">
                <h3 className="font-semibold text-zinc-200">🆕 Master Data ที่สร้างใหม่อัตโนมัติ</h3>
                {importResult.creditCardsCreated.length > 0 && (
                  <div>
                    <p className="text-zinc-400 text-sm mb-2">บัตรเครดิตใหม่ ({importResult.creditCardsCreated.length} ใบ)</p>
                    <div className="flex flex-wrap gap-2">
                      {importResult.creditCardsCreated.map(c => (
                        <span key={c} className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-sm">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {importResult.paymentAppsCreated.length > 0 && (
                  <div>
                    <p className="text-zinc-400 text-sm mb-2">Payment App ใหม่</p>
                    <div className="flex flex-wrap gap-2">
                      {importResult.paymentAppsCreated.map(a => (
                        <span key={a} className="px-3 py-1 bg-secondary/20 text-secondary rounded-lg text-sm">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {importResult.errors.length > 0 && (
              <div className="glass-card p-5">
                <h3 className="font-semibold text-danger mb-2">❌ ข้อผิดพลาด ({importResult.errors.length} รายการ)</h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {importResult.errors.map((e, i) => (
                    <p key={i} className="text-zinc-400 text-sm">{e}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={reset} className="btn-secondary px-6">Import ไฟล์อื่น</button>
              <a href="/" className="btn-primary flex-1 text-center py-2.5">🏠 ไปหน้า Dashboard</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
