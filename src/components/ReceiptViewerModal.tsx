import React, { useState } from 'react';
import {
  X,
  Receipt,
  FileText,
  ExternalLink,
  Calendar,
  Building,
  User,
  CreditCard,
  Folder,
  Tag,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Clock,
} from 'lucide-react';
import { Expense } from '../types';

interface ReceiptViewerModalProps {
  expense: Expense | null;
  onClose: () => void;
  onAttachBill?: (expenseId: string, file: File) => void;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  expense,
  onClose,
  onAttachBill,
}) => {
  const [isAttaching, setIsAttaching] = useState(false);

  if (!expense) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {expense.id}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  expense.status === 'Approved'
                    ? 'bg-emerald-50 text-emerald-700'
                    : expense.status === 'Submitted'
                    ? 'bg-blue-50 text-blue-700'
                    : expense.status === 'Rejected'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {expense.status}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">{expense.vendor}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Amount & Date Hero Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-medium">Expense Amount</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                ₹{expense.amount.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 font-medium">Expense Date</span>
              <div className="font-semibold text-slate-800 mt-0.5 flex items-center justify-end gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {expense.expenseDate}
              </div>
            </div>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium">Category</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{expense.expenseCategory}</span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium">Payment Mode</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{expense.paymentMode}</span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium">Employee / Submitter</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{expense.employeeName}</span>
              <span className="text-[10px] text-slate-500">{expense.employeeEmail}</span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium">Department</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{expense.department}</span>
            </div>
          </div>

          {/* Notes */}
          {expense.description && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Expense Notes
              </span>
              <p className="text-slate-800 leading-relaxed font-medium">{expense.description}</p>
            </div>
          )}

          {/* GST & Invoice if available */}
          {(expense.invoiceNumber || expense.gstNumber) && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between text-xs">
              {expense.invoiceNumber && (
                <div>
                  <span className="text-[10px] text-slate-400 block">Invoice / Bill No</span>
                  <span className="font-mono font-semibold text-slate-800">{expense.invoiceNumber}</span>
                </div>
              )}
              {expense.gstNumber && (
                <div>
                  <span className="text-[10px] text-slate-400 block">GSTIN</span>
                  <span className="font-mono font-semibold text-slate-800">{expense.gstNumber}</span>
                </div>
              )}
            </div>
          )}

          {/* Google Drive & Receipt Section */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Folder className="w-4 h-4 text-teal-700" />
                Google Drive Storage
              </span>
              {expense.billAvailable ? (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded text-[10px] border border-emerald-200">
                  Bill Attached
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-semibold rounded text-[10px] border border-amber-200">
                  Bill Missing
                </span>
              )}
            </div>

            <div className="space-y-1 text-[11px]">
              <div>
                <span className="text-slate-400">Target Folder:</span>
                <p className="font-mono text-teal-900 bg-teal-50/80 p-1.5 rounded mt-0.5 truncate">
                  {expense.driveFolder || 'Ryze Expense Documents'}
                </p>
              </div>

              {expense.driveFileName && (
                <div>
                  <span className="text-slate-400">Standardized File Name:</span>
                  <p className="font-mono text-slate-800 bg-white p-1.5 rounded border border-slate-200 mt-0.5 truncate">
                    {expense.driveFileName}
                  </p>
                </div>
              )}
            </div>

            {/* Receipt Preview */}
            {expense.receiptBase64 && (
              <div className="pt-2">
                <span className="text-slate-500 font-medium block mb-1">Receipt Preview:</span>
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100 max-h-64 flex items-center justify-center">
                  <img
                    src={expense.receiptBase64}
                    alt="Receipt"
                    className="max-h-60 object-contain w-auto mx-auto"
                  />
                </div>
              </div>
            )}

            {!expense.billAvailable && (
              <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80 text-amber-900">
                <span className="font-semibold block mb-0.5">Reason for No Bill:</span>
                <p className="text-amber-800">{expense.reasonForNoBill || 'Not specified'}</p>
              </div>
            )}
          </div>

          {/* Approver Timeline / Comments if present */}
          {(expense.approverComments || expense.approverName) && (
            <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                Approver Feedback
              </span>
              <p className="text-slate-800 font-medium">{expense.approverComments}</p>
              <div className="text-[10px] text-slate-500 pt-1">
                Reviewed by: <strong>{expense.approverName}</strong> on {expense.approvalDate}
              </div>
            </div>
          )}

          {/* Google Sheet Register Reference */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Registered in: <strong>Ryze Expense Register</strong></span>
            <span>Last Updated: {expense.lastUpdated}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold"
          >
            Close
          </button>
          {expense.driveFileUrl && (
            <a
              href={expense.driveFileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Google Drive</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
