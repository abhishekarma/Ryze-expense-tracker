import React, { useState } from 'react';
import {
  Settings,
  FolderTree,
  FileSpreadsheet,
  Plus,
  Trash2,
  Check,
  Copy,
  Download,
  ExternalLink,
  ShieldCheck,
  Code,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { AppConfig, EmployeeProfile, PaymentMode } from '../types';
import { saveConfig, syncGoogleSheet } from '../utils/api';

interface AdminConfigViewProps {
  config: AppConfig;
  employees: EmployeeProfile[];
  onUpdateConfig: (newConfig: AppConfig) => void;
  onRefreshExpenses: () => void;
}

export const AdminConfigView: React.FC<AdminConfigViewProps> = ({
  config,
  employees,
  onUpdateConfig,
  onRefreshExpenses,
}) => {
  const [categories, setCategories] = useState<string[]>([...config.categories]);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [departments, setDepartments] = useState<string[]>([...config.departments]);
  const [newDepartmentInput, setNewDepartmentInput] = useState('');
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([...config.paymentModes]);
  const [newPaymentModeInput, setNewPaymentModeInput] = useState('');
  const [googleSheetName, setGoogleSheetName] = useState(config.googleSheetName);
  const [googleDriveRootFolder, setGoogleDriveRootFolder] = useState(config.googleDriveRootFolder);
  const [googleAppsScriptUrl, setGoogleAppsScriptUrl] = useState(config.googleAppsScriptUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Add Category
  const handleAddCategory = () => {
    if (!newCategoryInput.trim()) return;
    if (!categories.includes(newCategoryInput.trim())) {
      setCategories([...categories, newCategoryInput.trim()]);
    }
    setNewCategoryInput('');
  };

  // Remove Category
  const handleRemoveCategory = (catToRemove: string) => {
    setCategories(categories.filter((c) => c !== catToRemove));
  };

  // Add Department
  const handleAddDepartment = () => {
    if (!newDepartmentInput.trim()) return;
    if (!departments.includes(newDepartmentInput.trim())) {
      setDepartments([...departments, newDepartmentInput.trim()]);
    }
    setNewDepartmentInput('');
  };

  // Remove Department
  const handleRemoveDepartment = (deptToRemove: string) => {
    setDepartments(departments.filter((d) => d !== deptToRemove));
  };

  // Add Payment Mode
  const handleAddPaymentMode = () => {
    if (!newPaymentModeInput.trim()) return;
    const mode = newPaymentModeInput.trim() as PaymentMode;
    if (!paymentModes.includes(mode)) {
      setPaymentModes([...paymentModes, mode]);
    }
    setNewPaymentModeInput('');
  };

  // Save Config
  const handleSaveAllConfig = async () => {
    setIsSaving(true);
    const updated: AppConfig = {
      ...config,
      categories,
      departments,
      paymentModes,
      googleSheetName,
      googleDriveRootFolder,
      googleAppsScriptUrl,
    };

    const res = await saveConfig(updated);
    setIsSaving(false);
    if (res.success) {
      onUpdateConfig(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Trigger Google Sheet sync
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    const res = await syncGoogleSheet();
    setIsSyncing(false);
    setSyncStatus(res.message);
    onRefreshExpenses();
  };

  // Ready-to-paste Google Apps Script snippet for users
  const appsScriptCode = `/**
 * Google Apps Script for Ryze Expense Capture
 * Deploy as Web App -> Execute as: Me -> Access: Anyone
 */
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Ryze Expense Register") || ss.getActiveSheet();
  
  if (data.action === "addExpense") {
    var exp = data.expense;
    sheet.appendRow([
      exp.id,
      exp.expenseDate,
      exp.submissionDate,
      exp.submissionTime,
      exp.employeeName,
      exp.department,
      exp.expenseCategory,
      exp.vendor,
      exp.description,
      exp.amount,
      exp.paymentMode,
      exp.billAvailable ? "Yes" : "No - Bill Missing",
      exp.driveFileName || "",
      exp.driveFileUrl || "",
      exp.driveFolder || "",
      exp.status,
      exp.approvalStatus,
      exp.approverComments || "",
      exp.submittedBy,
      exp.lastUpdated
    ]);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Admin Configuration &amp; Integrations
          </h1>
          <p className="text-xs text-slate-500">
            Manage Ryze Chemie master data, Google Sheets, and Google Drive structure
          </p>
        </div>

        <button
          onClick={handleSaveAllConfig}
          disabled={isSaving}
          className="flex items-center space-x-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Configuration'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Configuration saved successfully and synced across app.</span>
        </div>
      )}

      {/* Google Sheet & Drive Setup Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Google Sheet &amp; Drive Setup</h2>
            <p className="text-xs text-slate-500">
              Target register and automated folder hierarchy
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Google Sheet Register Name:
            </label>
            <input
              type="text"
              value={googleSheetName}
              onChange={(e) => setGoogleSheetName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 bg-slate-50 focus:bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Default: &quot;Ryze Expense Register&quot; (Contains 20 structured columns)
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Google Drive Root Folder:
            </label>
            <input
              type="text"
              value={googleDriveRootFolder}
              onChange={(e) => setGoogleDriveRootFolder(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 bg-slate-50 focus:bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Structure: Root &rarr; Year &rarr; Month &rarr; Employee Name
            </span>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Google Apps Script Webhook URL (Optional for Live Push):
            </label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={googleAppsScriptUrl}
              onChange={(e) => setGoogleAppsScriptUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 bg-slate-50 focus:bg-white"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Paste your Apps Script Web App URL to push every captured expense row directly into your Google Sheet and Drive.
            </span>
          </div>
        </div>

        {/* Sync & Export Actions */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <span>{isSyncing ? 'Syncing...' : 'Sync with Google Sheet'}</span>
          </button>

          <a
            href="/api/export-csv"
            download
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV (20 Columns for Google Sheets)</span>
          </a>

          {syncStatus && (
            <span className="text-xs text-teal-800 font-medium ml-2">{syncStatus}</span>
          )}
        </div>

        {/* Copyable Google Apps Script Code Snippet */}
        <div className="mt-4 p-3 bg-slate-900 text-slate-100 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-teal-400 flex items-center gap-1.5">
              <Code className="w-4 h-4" /> Ready-to-paste Google Apps Script code (Section 25)
            </span>
            <button
              onClick={handleCopyCode}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied!' : 'Copy Script'}</span>
            </button>
          </div>
          <pre className="text-[11px] font-mono overflow-x-auto text-slate-300 max-h-36 p-2 bg-slate-950/80 rounded-lg">
            {appsScriptCode}
          </pre>
        </div>
      </div>

      {/* Categories Management (Section 3: Administrator can add/modify categories) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Expense Categories</h2>
            <p className="text-xs text-slate-500">
              {categories.length} categories available in searchable dropdown
            </p>
          </div>
        </div>

        {/* Add Category Input */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Add new category (e.g. Patent Filing, Factory Safety)..."
            value={newCategoryInput}
            onChange={(e) => setNewCategoryInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-teal-600"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold"
          >
            + Add
          </button>
        </div>

        {/* Categories Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {categories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
            >
              <span>{cat}</span>
              <button
                type="button"
                onClick={() => handleRemoveCategory(cat)}
                className="text-slate-400 hover:text-rose-600"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Departments & Payment Modes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Departments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Departments</h2>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Add department..."
              value={newDepartmentInput}
              onChange={(e) => setNewDepartmentInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddDepartment()}
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
            />
            <button
              type="button"
              onClick={handleAddDepartment}
              className="px-3 py-1.5 bg-teal-700 text-white rounded-xl text-xs font-bold"
            >
              +
            </button>
          </div>
          <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
            {departments.map((dept) => (
              <div
                key={dept}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100"
              >
                <span className="text-slate-800 font-medium">{dept}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDepartment(dept)}
                  className="text-slate-400 hover:text-rose-600"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Modes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Allowed Payment Modes</h2>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Add payment mode..."
              value={newPaymentModeInput}
              onChange={(e) => setNewPaymentModeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPaymentMode()}
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
            />
            <button
              type="button"
              onClick={handleAddPaymentMode}
              className="px-3 py-1.5 bg-teal-700 text-white rounded-xl text-xs font-bold"
            >
              +
            </button>
          </div>
          <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
            {paymentModes.map((mode) => (
              <div
                key={mode}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100"
              >
                <span className="text-slate-800 font-medium">{mode}</span>
                <button
                  type="button"
                  onClick={() => setPaymentModes(paymentModes.filter((m) => m !== mode))}
                  className="text-slate-400 hover:text-rose-600"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
