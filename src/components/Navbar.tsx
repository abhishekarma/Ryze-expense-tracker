import React, { useState } from 'react';
import {
  Receipt,
  FileSpreadsheet,
  FolderSync,
  PlusCircle,
  UserCheck,
  ChevronDown,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { EmployeeProfile } from '../types';

interface NavbarProps {
  currentEmployee: EmployeeProfile;
  employees: EmployeeProfile[];
  onSelectEmployee: (emp: EmployeeProfile) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAddModal: () => void;
  onSyncSheet: () => void;
  isSyncing: boolean;
  lastSynced: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentEmployee,
  employees,
  onSelectEmployee,
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onSyncSheet,
  isSyncing,
  lastSynced,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-700 to-teal-900 flex items-center justify-center text-white shadow-sm ring-2 ring-teal-600/20">
              <Receipt className="w-5 h-5 text-teal-100" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                  Ryze Expense
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60">
                  Chemie
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Capture • Google Sheet • Google Drive
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              id="nav-tab-my-expenses"
              onClick={() => setActiveTab('my-expenses')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'my-expenses'
                  ? 'bg-teal-50 text-teal-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              My Expenses
            </button>
            <button
              id="nav-tab-summary"
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'summary'
                  ? 'bg-teal-50 text-teal-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Monthly Summary
            </button>
            <button
              id="nav-tab-missing-bills"
              onClick={() => setActiveTab('missing-bills')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'missing-bills'
                  ? 'bg-amber-50 text-amber-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Pending Bills
            </button>
            <button
              id="nav-tab-manager"
              onClick={() => setActiveTab('manager')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'manager'
                  ? 'bg-teal-50 text-teal-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Manager View
            </button>
            <button
              id="nav-tab-admin"
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'admin'
                  ? 'bg-teal-50 text-teal-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Admin & Sync
            </button>
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Sheet Sync Button */}
            <button
              id="btn-sheet-sync"
              onClick={onSyncSheet}
              disabled={isSyncing}
              title="Sync with Ryze Expense Register in Google Sheets"
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <FileSpreadsheet className={`w-4 h-4 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline">Sheets Sync</span>
            </button>

            {/* + Add Expense CTA Button */}
            <button
              id="btn-add-expense-header"
              onClick={onOpenAddModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-sm font-semibold shadow-sm hover:shadow transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Expense</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                id="btn-profile-dropdown"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                  {currentEmployee.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="hidden xl:block text-left text-xs leading-tight pr-1">
                  <div className="font-semibold text-slate-800 truncate max-w-[120px]">
                    {currentEmployee.name}
                  </div>
                  <div className="text-slate-500 text-[10px] truncate max-w-[120px]">
                    {currentEmployee.department}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Menu Popover */}
              {showProfileMenu && (
                <div
                  id="profile-menu-popover"
                  className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs"
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Logged in Account
                    </p>
                    <p className="font-semibold text-slate-900 text-sm mt-0.5">
                      {currentEmployee.name}
                    </p>
                    <p className="text-slate-500">{currentEmployee.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-medium">
                      {currentEmployee.department}
                    </span>
                  </div>

                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                      Switch Active Employee
                    </p>
                    <div className="space-y-1">
                      {employees.map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => {
                            onSelectEmployee(emp);
                            setShowProfileMenu(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                            emp.id === currentEmployee.id
                              ? 'bg-teal-50 text-teal-900 font-semibold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="text-xs">{emp.name}</div>
                            <div className="text-[10px] text-slate-400">{emp.department}</div>
                          </div>
                          {emp.id === currentEmployee.id && (
                            <span className="text-[10px] text-teal-600 font-bold">Active</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="px-4 py-2 text-[11px] text-slate-400">
                    Google Sheets: <span className="text-slate-600 font-medium">Ryze Expense Register</span>
                    <br />
                    Drive: <span className="text-slate-600 font-medium">Ryze Expense Documents</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
