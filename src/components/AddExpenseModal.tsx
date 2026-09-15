import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Mic,
  MicOff,
  X,
  RefreshCw,
  Search,
  Check,
  ChevronRight,
  HelpCircle,
  ExternalLink,
  Receipt,
  Eye,
} from 'lucide-react';
import { EmployeeProfile, Expense, ExtractedReceiptData, PaymentMode } from '../types';
import { SAMPLE_RECEIPTS, SampleReceipt } from '../data/sampleReceipts';
import { scanReceiptWithGemini, checkDuplicateExpense, submitExpense } from '../utils/api';
import { SpeechHandler } from '../utils/speech';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newExpense: Expense) => void;
  currentEmployee: EmployeeProfile;
  categories: string[];
  paymentModes: PaymentMode[];
  departments: string[];
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentEmployee,
  categories,
  paymentModes,
  departments,
}) => {
  if (!isOpen) return null;

  // Form states
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [employeeName, setEmployeeName] = useState<string>(currentEmployee.name);
  const [department, setDepartment] = useState<string>(currentEmployee.department);
  const [expenseCategory, setExpenseCategory] = useState<string>('Taxi / Auto / Cab');
  const [amount, setAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Personal UPI');
  const [vendor, setVendor] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [gstNumber, setGstNumber] = useState<string>('');

  // Bill / receipt states
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [receiptMimeType, setReceiptMimeType] = useState<string>('image/jpeg');
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [isBillMissing, setIsBillMissing] = useState<boolean>(false);
  const [reasonForNoBill, setReasonForNoBill] = useState<string>('Taxi receipt unavailable');
  const [customReason, setCustomReason] = useState<string>('');

  // OCR scanning states
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [ocrResult, setOcrResult] = useState<ExtractedReceiptData | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Voice to text
  const [isListening, setIsListening] = useState<boolean>(false);
  const speechHandlerRef = useRef<SpeechHandler | null>(null);

  // Duplicate check
  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Success screen
  const [submittedExpense, setSubmittedExpense] = useState<Expense | null>(null);

  // Search category modal
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');
  const [isSelectingCategory, setIsSelectingCategory] = useState<boolean>(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    speechHandlerRef.current = new SpeechHandler();
    return () => {
      speechHandlerRef.current?.stop();
    };
  }, []);

  // Handle uploaded receipt file (Image / PDF)
  const handleFile = (file: File) => {
    if (!file) return;

    const mime = file.type || 'image/jpeg';
    setReceiptMimeType(mime);
    setReceiptFileName(file.name);
    setIsBillMissing(false);
    setOcrError(null);
    setOcrResult(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setReceiptBase64(base64);

      // Trigger Gemini Smart OCR automatically
      triggerGeminiOcr(base64, mime);
    };
    reader.readAsDataURL(file);
  };

  // 1-Click sample receipt selection
  const handleSelectSample = (sample: SampleReceipt) => {
    setReceiptBase64(sample.dataUrl);
    setReceiptMimeType(sample.mimeType);
    setReceiptFileName(sample.fileName);
    setIsBillMissing(false);
    setOcrError(null);
    setOcrResult(null);

    // Call OCR directly with the sample receipt
    triggerGeminiOcr(sample.dataUrl, sample.mimeType);
  };

  // Gemini OCR execution
  const triggerGeminiOcr = async (base64: string, mime: string) => {
    setIsScanning(true);
    setOcrError(null);
    try {
      const res = await scanReceiptWithGemini(base64, mime);
      if (res.success && res.data) {
        setOcrResult(res.data);
      } else {
        setOcrError(res.error || 'Gemini could not parse receipt');
      }
    } catch (err: any) {
      setOcrError(err.message || 'Error running receipt OCR');
    } finally {
      setIsScanning(false);
    }
  };

  // Apply OCR suggested details to form
  const applyOcrDetails = () => {
    if (!ocrResult) return;

    if (ocrResult.vendor) setVendor(ocrResult.vendor);
    if (ocrResult.date) setExpenseDate(ocrResult.date);
    if (ocrResult.amount) setAmount(String(ocrResult.amount));
    if (ocrResult.invoiceNumber) setInvoiceNumber(ocrResult.invoiceNumber);
    if (ocrResult.gstNumber) setGstNumber(ocrResult.gstNumber);
    if (ocrResult.suggestedCategory && categories.includes(ocrResult.suggestedCategory)) {
      setExpenseCategory(ocrResult.suggestedCategory);
    } else if (ocrResult.suggestedCategory) {
      // Find closest match
      const matched = categories.find((c) =>
        c.toLowerCase().includes(ocrResult.suggestedCategory!.toLowerCase())
      );
      if (matched) setExpenseCategory(matched);
    }
    if (ocrResult.suggestedDescription && !description) {
      setDescription(ocrResult.suggestedDescription);
    }
  };

  // Toggle Voice-to-Text
  const toggleVoiceToText = () => {
    if (!speechHandlerRef.current) return;

    if (isListening) {
      speechHandlerRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      speechHandlerRef.current.start(
        (transcript: string) => {
          setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
        },
        () => {
          setIsListening(false);
        },
        (error: string) => {
          setIsListening(false);
          console.warn('Speech error:', error);
        }
      );
    }
  };

  // Validate and submit expense
  const handleSubmit = async (overrideDuplicate = false) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }
    if (!vendor.trim()) {
      alert('Please specify the vendor or supplier name.');
      return;
    }

    // Duplicate check if not overridden
    if (!overrideDuplicate) {
      const dupCheck = await checkDuplicateExpense({
        employeeName,
        expenseDate,
        amount: numAmount,
        vendor,
      });

      if (dupCheck.isDuplicate) {
        setDuplicateWarning(dupCheck.existingExpense);
        return;
      }
    }

    setIsSubmitting(true);
    setDuplicateWarning(null);

    const effectiveReasonForNoBill =
      reasonForNoBill === 'Other' ? customReason || 'Other' : reasonForNoBill;

    const payload: Partial<Expense> = {
      expenseDate,
      employeeName,
      employeeEmail: currentEmployee.email,
      department,
      expenseCategory,
      vendor: vendor.trim(),
      description: description.trim(),
      amount: numAmount,
      paymentMode,
      billAvailable: !isBillMissing && Boolean(receiptBase64),
      reasonForNoBill: isBillMissing ? effectiveReasonForNoBill : undefined,
      receiptBase64: !isBillMissing ? receiptBase64 || undefined : undefined,
      receiptMimeType: !isBillMissing ? receiptMimeType : undefined,
      receiptOriginalName: receiptFileName || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
      gstNumber: gstNumber.trim() || undefined,
    };

    const res = await submitExpense(payload);
    setIsSubmitting(false);

    if (res.success && res.expense) {
      setSubmittedExpense(res.expense);
      onSuccess(res.expense);
    } else {
      alert(res.error || 'Failed to submit expense. Please check your connection.');
    }
  };

  // Reset form for next capture
  const handleResetForNext = () => {
    setSubmittedExpense(null);
    setReceiptBase64(null);
    setReceiptFileName('');
    setOcrResult(null);
    setOcrError(null);
    setAmount('');
    setVendor('');
    setDescription('');
    setInvoiceNumber('');
    setGstNumber('');
    setIsBillMissing(false);
    setExpenseDate(new Date().toISOString().split('T')[0]);
  };

  // Filtered categories for searchable dropdown
  const filteredCategories = categories.filter((c) =>
    c.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Capture Expense
              </h2>
              <p className="text-xs text-slate-500">
                Photo • Confirm • Submit &lt; 30s
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {submittedExpense ? (
            /* SUCCESS CONFIRMATION VIEW */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Google Sheet & Drive Synced
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  Expense Submitted Successfully!
                </h3>
                <p className="text-sm font-semibold text-teal-700 font-mono mt-0.5">
                  {submittedExpense.id}
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-200/80 text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-bold text-slate-900 text-sm">
                    ₹{submittedExpense.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Vendor</span>
                  <span className="font-semibold text-slate-800">{submittedExpense.vendor}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Category</span>
                  <span className="font-medium text-slate-700">{submittedExpense.expenseCategory}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Google Sheet Register</span>
                  <span className="font-medium text-emerald-700">Ryze Expense Register (Row Saved)</span>
                </div>
                {submittedExpense.billAvailable && (
                  <div className="py-1">
                    <span className="text-slate-500 block mb-0.5">Google Drive Path:</span>
                    <span className="font-mono text-[11px] text-teal-800 bg-teal-50 px-2 py-1 rounded block truncate">
                      {submittedExpense.driveFolder} / {submittedExpense.driveFileName}
                    </span>
                  </div>
                )}
                {!submittedExpense.billAvailable && (
                  <div className="flex justify-between py-1">
                    <span className="text-amber-600 font-medium">Bill Missing</span>
                    <span className="text-slate-600">{submittedExpense.reasonForNoBill}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  id="btn-capture-next"
                  onClick={handleResetForNext}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold shadow-sm transition-colors"
                >
                  + Capture Next Expense
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-medium transition-colors"
                >
                  Close & View Expenses
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE CAPTURE FORM */
            <div className="space-y-5">
              {/* STEP 1: RECEIPT PHOTO / UPLOAD (STARTING POINT) */}
              <div className="bg-gradient-to-br from-teal-50/80 to-slate-50 p-4 rounded-2xl border border-teal-100/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-teal-700 text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <label className="text-xs font-bold uppercase tracking-wider text-teal-900">
                      Receipt / Bill Photo (Recommended)
                    </label>
                  </div>
                  {!isBillMissing && receiptBase64 && (
                    <button
                      onClick={() => {
                        setReceiptBase64(null);
                        setReceiptFileName('');
                        setOcrResult(null);
                      }}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Remove Bill
                    </button>
                  )}
                </div>

                {/* Upload or Camera Area */}
                {!isBillMissing && !receiptBase64 && (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Mobile Camera Button */}
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex items-center justify-center space-x-2 py-3.5 px-4 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-semibold text-xs shadow-sm active:scale-[0.98] transition-all"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Take Photo (Camera)</span>
                      </button>

                      {/* File Upload Button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center space-x-2 py-3.5 px-4 bg-white border border-teal-200 text-teal-800 hover:bg-teal-50/50 rounded-xl font-semibold text-xs transition-all shadow-xs"
                      >
                        <UploadCloud className="w-4 h-4 text-teal-600" />
                        <span>Upload File (JPG / PDF)</span>
                      </button>

                      {/* Hidden file inputs */}
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFile(e.target.files[0]);
                        }}
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFile(e.target.files[0]);
                        }}
                      />
                    </div>

                    {/* 1-Click Sample Receipts Row for instant testing */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                        <span className="font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" /> Quick test sample receipts:
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsBillMissing(true)}
                          className="text-amber-700 hover:text-amber-800 font-medium hover:underline text-[11px]"
                        >
                          No Bill Available?
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {SAMPLE_RECEIPTS.map((sample) => (
                          <button
                            key={sample.id}
                            type="button"
                            onClick={() => handleSelectSample(sample)}
                            className="p-1.5 text-left rounded-lg bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 text-[10px] text-slate-700 font-medium truncate transition-all shadow-xs"
                          >
                            <span className="block font-semibold text-slate-900 truncate">
                              {sample.vendor.split(' ')[0]}
                            </span>
                            <span className="text-teal-700 font-bold">₹{sample.amount}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Receipt Preview & OCR Status */}
                {receiptBase64 && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 bg-white p-2.5 rounded-xl border border-teal-200">
                      {receiptMimeType.includes('image') || receiptMimeType.includes('svg') ? (
                        <img
                          src={receiptBase64}
                          alt="Receipt Preview"
                          className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-red-50 text-red-600 flex flex-col items-center justify-center border border-red-200">
                          <FileText className="w-6 h-6" />
                          <span className="text-[9px] font-bold mt-1">PDF</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {receiptFileName || 'Scanned Receipt'}
                        </p>
                        <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Bill attached for Google Drive
                        </p>
                        <button
                          type="button"
                          onClick={() => triggerGeminiOcr(receiptBase64, receiptMimeType)}
                          disabled={isScanning}
                          className="text-[11px] text-teal-700 hover:underline font-semibold flex items-center gap-1 mt-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
                          Re-scan with Gemini
                        </button>
                      </div>
                    </div>

                    {/* Scanning Animation */}
                    {isScanning && (
                      <div className="bg-teal-800 text-white rounded-xl p-3 flex items-center space-x-3 animate-pulse">
                        <Sparkles className="w-5 h-5 text-teal-300 animate-spin" />
                        <div className="text-xs">
                          <p className="font-semibold">Gemini Vision AI is reading your bill...</p>
                          <p className="text-teal-200 text-[11px]">
                            Extracting vendor, amount, date &amp; GSTIN
                          </p>
                        </div>
                      </div>
                    )}

                    {/* OCR Results Pill */}
                    {ocrResult && !isScanning && (
                      <div className="bg-white rounded-xl p-3 border-2 border-emerald-500/50 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            Extracted Bill Details
                          </span>
                          <button
                            type="button"
                            id="btn-use-ocr-details"
                            onClick={applyOcrDetails}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Use These Details
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-2 rounded-lg">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Vendor</span>
                            <span className="font-semibold text-slate-900 truncate block">
                              {ocrResult.vendor || 'Unknown'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Amount</span>
                            <span className="font-bold text-emerald-700 block">
                              ₹{ocrResult.amount?.toLocaleString('en-IN') || '0'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Date</span>
                            <span className="font-medium text-slate-800 block">
                              {ocrResult.date || expenseDate}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Category</span>
                            <span className="font-medium text-slate-800 block truncate">
                              {ocrResult.suggestedCategory || 'Other'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {ocrError && !isScanning && (
                      <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{ocrError}. You can enter the details below manually.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Missing Bill Form */}
                {isBillMissing && (
                  <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Submitting Without Bill (Bill Missing)
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsBillMissing(false)}
                        className="text-xs text-teal-700 font-semibold hover:underline"
                      >
                        I have a bill
                      </button>
                    </div>
                    <label className="text-[11px] font-medium text-slate-600 block">
                      Reason for No Bill:
                    </label>
                    <select
                      value={reasonForNoBill}
                      onChange={(e) => setReasonForNoBill(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg bg-white border border-amber-200 focus:outline-teal-600"
                    >
                      <option value="Taxi receipt unavailable">Taxi / Auto receipt unavailable</option>
                      <option value="Small cash expense">Small cash expense / Tea / Refreshment</option>
                      <option value="Vendor did not provide invoice">Vendor did not provide invoice</option>
                      <option value="Paper slip lost / damaged">Paper slip lost / damaged</option>
                      <option value="Other">Other reason...</option>
                    </select>
                    {reasonForNoBill === 'Other' && (
                      <input
                        type="text"
                        placeholder="Please describe why bill is unavailable..."
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg bg-white border border-amber-200 mt-1"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* STEP 2: CONFIRM CORE DETAILS (FAST CONFIRMATION) */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-teal-700 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Confirm Key Details
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Amount Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Amount (₹ INR) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                        ₹
                      </span>
                      <input
                        id="input-expense-amount"
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-lg font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  {/* Vendor Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Vendor / Supplier Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-expense-vendor"
                      type="text"
                      placeholder="e.g. Uber, Indian Oil, Cipla..."
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
                    />
                  </div>

                  {/* Category Selector with Search Modal Trigger */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Expense Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="select-expense-category"
                        value={expenseCategory}
                        onChange={(e) => setExpenseCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Expense Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Expense Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-expense-date"
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
                    />
                  </div>

                  {/* Payment Mode */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Payment Mode
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {paymentModes.map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setPaymentMode(mode)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                            paymentMode === mode
                              ? 'bg-teal-700 text-white font-semibold shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 3: NOTES & VOICE-TO-TEXT */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Expense Notes
                  </label>
                  {/* Speech to text toggle */}
                  <button
                    type="button"
                    onClick={toggleVoiceToText}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isListening
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isListening ? 'Listening...' : 'Voice-to-Text'}</span>
                  </button>
                </div>
                <textarea
                  id="textarea-expense-notes"
                  rows={2}
                  placeholder="Example: Taxi from office to Cipla meeting at Kurkumbh."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none placeholder:text-slate-400"
                />
              </div>

              {/* AUTOMATION PREVIEW INFO */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Google Sheet Target:</span>
                  <span className="font-semibold text-slate-800">Ryze Expense Register</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Google Drive Folder:</span>
                  <span className="font-mono text-[10px] text-teal-800">
                    Ryze Expense Documents / 2026 / September / {employeeName}
                  </span>
                </div>
              </div>

              {/* DUPLICATE WARNING MODAL / ALERT */}
              {duplicateWarning && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    Possible duplicate expense detected!
                  </div>
                  <p className="text-xs text-amber-800">
                    An existing expense with identical details was found:{' '}
                    <strong>{duplicateWarning.id}</strong> ({duplicateWarning.vendor}, ₹
                    {duplicateWarning.amount} on {duplicateWarning.expenseDate}).
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSubmit(true)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
                    >
                      Submit Anyway
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuplicateWarning(null)}
                      className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-medium"
                    >
                      Review Form
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!submittedExpense && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              id="btn-submit-expense"
              type="button"
              disabled={isSubmitting || isScanning}
              onClick={() => handleSubmit(false)}
              className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Syncing to Sheets &amp; Drive...</span>
                </>
              ) : (
                <span>Submit Expense</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
