/**
 * Ryze Expense Capture - Mobile-First Internal Web App / PWA
 * Ryze Chemie
 */

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  FileSpreadsheet,
  Plus,
  BarChart3,
  AlertTriangle,
  Users,
  Settings,
  Sparkles,
  RefreshCw,
  FolderSync,
} from 'lucide-react';
import { AppConfig, EmployeeProfile, Expense } from './types';
import { INITIAL_CONFIG, INITIAL_EMPLOYEES } from './data/defaults';
import { fetchExpenses, fetchConfig, syncGoogleSheet } from './utils/api';

import { Navbar } from './components/Navbar';
import { AddExpenseModal } from './components/AddExpenseModal';
import { MyExpensesView } from './components/MyExpensesView';
import { MonthlySummaryView } from './components/MonthlySummaryView';
import { MissingBillsView } from './components/MissingBillsView';
import { ManagerView } from './components/ManagerView';
import { AdminConfigView } from './components/AdminConfigView';
import { ReceiptViewerModal } from './components/ReceiptViewerModal';

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [config, setConfig] = useState<AppConfig>(INITIAL_CONFIG);
  const [employees, setEmployees] = useState<EmployeeProfile[]>(INITIAL_EMPLOYEES);
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeProfile>(INITIAL_EMPLOYEES[0]);

  const [activeTab, setActiveTab] = useState<string>('my-expenses');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load initial data
  const loadData = async () => {
    try {
      const [expData, cfgData] = await Promise.all([fetchExpenses(), fetchConfig()]);
      if (expData && expData.length > 0) {
        setExpenses(expData);
      }
      if (cfgData) {
        setConfig(cfgData);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Trigger Google Sheet sync
  const handleSyncSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await syncGoogleSheet();
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Add new expense handler
  const handleExpenseCreated = (newExpense: Expense) => {
    setExpenses((prev) => [newExpense, ...prev]);
  };

  // Missing count
  const missingBillsCount = expenses.filter((e) => !e.billAvailable).length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans pb-20 md:pb-8">
      {/* Top Navigation Bar */}
      <Navbar
        currentEmployee={currentEmployee}
        employees={employees}
        onSelectEmployee={(emp) => setCurrentEmployee(emp)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onSyncSheet={handleSyncSheet}
        isSyncing={isSyncing}
        lastSynced={lastSynced}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* Quick Sync & Info Banner */}
        <div className="mb-4 flex flex-wrap items-center justify-between text-[11px] text-slate-500 bg-white/70 backdrop-blur px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-semibold text-slate-700">Live Register:</span>
            <span>Ryze Expense Register (Google Sheets)</span>
          </div>
          <div className="flex items-center space-x-3 mt-1 sm:mt-0">
            <span className="hidden sm:inline">
              Drive: <strong className="text-slate-700">{config.googleDriveRootFolder}</strong>
            </span>
            <span className="text-teal-700 font-semibold">Gemini Flash OCR: Active</span>
          </div>
        </div>

        {/* View Switcher */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <RefreshCw className="w-8 h-8 text-teal-700 animate-spin" />
            <p className="text-xs font-semibold text-slate-600">
              Connecting to Ryze Expense Register...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'my-expenses' && (
              <MyExpensesView
                expenses={expenses}
                onOpenAddModal={() => setIsAddModalOpen(true)}
                onSelectExpense={(exp) => setSelectedExpense(exp)}
                currentEmployeeEmail={currentEmployee.email}
              />
            )}

            {activeTab === 'summary' && (
              <MonthlySummaryView
                expenses={expenses}
                onSelectExpense={(exp) => setSelectedExpense(exp)}
                onOpenAddModal={() => setIsAddModalOpen(true)}
                currentEmployeeEmail={currentEmployee.email}
              />
            )}

            {activeTab === 'missing-bills' && (
              <MissingBillsView
                expenses={expenses}
                onSelectExpense={(exp) => setSelectedExpense(exp)}
                onRefreshExpenses={loadData}
                onOpenAddModal={() => setIsAddModalOpen(true)}
              />
            )}

            {activeTab === 'manager' && (
              <ManagerView
                expenses={expenses}
                currentEmployee={currentEmployee}
                onRefreshExpenses={loadData}
                onSelectExpense={(exp) => setSelectedExpense(exp)}
              />
            )}

            {activeTab === 'admin' && (
              <AdminConfigView
                config={config}
                employees={employees}
                onUpdateConfig={(newCfg) => setConfig(newCfg)}
                onRefreshExpenses={loadData}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Action Button (Mobile Only) for under 30-second capture */}
      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        <button
          id="btn-mobile-fab-add"
          onClick={() => setIsAddModalOpen(true)}
          className="w-14 h-14 rounded-full bg-teal-700 hover:bg-teal-800 text-white shadow-xl flex items-center justify-center ring-4 ring-white active:scale-95 transition-transform"
          aria-label="Add Expense"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar (True Mobile-First UX) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 py-1.5 px-2 flex items-center justify-around md:hidden">
        <button
          onClick={() => setActiveTab('my-expenses')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-colors ${
            activeTab === 'my-expenses' ? 'text-teal-800 font-bold' : 'text-slate-500'
          }`}
        >
          <Receipt className="w-5 h-5 mb-0.5" />
          <span>Expenses</span>
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-colors ${
            activeTab === 'summary' ? 'text-teal-800 font-bold' : 'text-slate-500'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span>Summary</span>
        </button>

        <button
          onClick={() => setActiveTab('missing-bills')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-colors relative ${
            activeTab === 'missing-bills' ? 'text-amber-800 font-bold' : 'text-slate-500'
          }`}
        >
          <AlertTriangle className="w-5 h-5 mb-0.5" />
          <span>Pending</span>
          {missingBillsCount > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 bg-amber-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {missingBillsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('manager')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-colors ${
            activeTab === 'manager' ? 'text-teal-800 font-bold' : 'text-slate-500'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span>Manager</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-colors ${
            activeTab === 'admin' ? 'text-teal-800 font-bold' : 'text-slate-500'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span>Admin</span>
        </button>
      </nav>

      {/* Add Expense Modal Flow */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleExpenseCreated}
        currentEmployee={currentEmployee}
        categories={config.categories}
        paymentModes={config.paymentModes}
        departments={config.departments}
      />

      {/* Expense Details & Receipt Viewer Modal */}
      <ReceiptViewerModal
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onAttachBill={async (id, file) => {
          await loadData();
          setSelectedExpense(null);
        }}
      />
    </div>
  );
}
