import React, { useState, useRef } from 'react';
import {
  AlertTriangle,
  Upload,
  Camera,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building,
  User,
  ExternalLink,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { Expense } from '../types';
import { updateExpense } from '../utils/api';

interface MissingBillsViewProps {
  expenses: Expense[];
  onSelectExpense: (expense: Expense) => void;
  onRefreshExpenses: () => void;
  onOpenAddModal: () => void;
}

export const MissingBillsView: React.FC<MissingBillsViewProps> = ({
  expenses,
  onSelectExpense,
  onRefreshExpenses,
  onOpenAddModal,
}) => {
  const missingExpenses = expenses.filter((e) => !e.billAvailable);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTargetExpense, setActiveTargetExpense] = useState<Expense | null>(null);

  const handleUploadClick = (expense: Expense, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveTargetExpense(expense);
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTargetExpense) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setUploadingId(activeTargetExpense.id);

      const mime = file.type || 'image/jpeg';
      const ext = mime.includes('pdf') ? 'pdf' : 'jpg';
      const cleanEmp = activeTargetExpense.employeeName.replace(/[^a-zA-Z0-9]/g, '');
      const cleanCat = activeTargetExpense.expenseCategory.replace(/[^a-zA-Z0-9]/g, '');
      const cleanVen = activeTargetExpense.vendor.replace(/[^a-zA-Z0-9]/g, '');
      const fileName = `${activeTargetExpense.expenseDate}_${cleanEmp}_${cleanCat}_${cleanVen}_${Math.round(
        activeTargetExpense.amount
      )}.${ext}`;

      const res = await updateExpense(activeTargetExpense.id, {
        billAvailable: true,
        receiptBase64: base64,
        receiptMimeType: mime,
        receiptOriginalName: file.name,
        driveFileName: fileName,
        driveFileUrl: `https://drive.google.com/file/d/ryze_${activeTargetExpense.id.toLowerCase()}/view`,
        reasonForNoBill: undefined,
      });

      setUploadingId(null);
      if (res.success) {
        onRefreshExpenses();
      } else {
        alert('Failed to attach bill. Please try again.');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input for quick receipt upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pending Bills</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {missingExpenses.length} Missing
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Expenses submitted without an invoice or receipt slip
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Expense</span>
        </button>
      </div>

      {missingExpenses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">All Bills Attached!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Every submitted expense currently has an associated receipt stored in Google Drive.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {missingExpenses.map((expense) => (
            <div
              key={expense.id}
              onClick={() => onSelectExpense(expense)}
              className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {expense.id}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Bill Missing
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500">{expense.expenseDate}</span>
                </div>

                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-base font-bold text-slate-900">{expense.vendor}</span>
                  <span className="text-xs font-medium text-slate-600">({expense.expenseCategory})</span>
                  <span className="text-xs text-slate-400 font-normal">by {expense.employeeName}</span>
                </div>

                <p className="text-xs text-amber-900 bg-amber-50/60 px-2.5 py-1 rounded-lg border border-amber-200/50 inline-block">
                  <strong>Reason:</strong> {expense.reasonForNoBill || 'Not provided'}
                </p>
              </div>

              <div className="flex items-center space-x-3 sm:border-l sm:border-slate-100 sm:pl-4 justify-between sm:justify-end">
                <div className="text-left sm:text-right">
                  <div className="text-lg font-black text-slate-900">
                    ₹{expense.amount.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    {expense.paymentMode}
                  </span>
                </div>

                {/* Upload Bill Now Button */}
                <button
                  type="button"
                  disabled={uploadingId === expense.id}
                  onClick={(e) => handleUploadClick(expense, e)}
                  className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 flex items-center space-x-1.5 transition-colors shrink-0"
                >
                  <Upload className="w-3.5 h-3.5 text-teal-700" />
                  <span>{uploadingId === expense.id ? 'Attaching...' : 'Attach Bill'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
