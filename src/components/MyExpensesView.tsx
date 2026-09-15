import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Receipt,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Folder,
  Calendar,
  CreditCard,
  Building,
  User,
  X,
  Eye,
  Plus,
} from 'lucide-react';
import { Expense, ExpenseStatus } from '../types';

interface MyExpensesViewProps {
  expenses: Expense[];
  onOpenAddModal: () => void;
  onSelectExpense: (expense: Expense) => void;
  currentEmployeeEmail: string;
}

export const MyExpensesView: React.FC<MyExpensesViewProps> = ({
  expenses,
  onOpenAddModal,
  onSelectExpense,
  currentEmployeeEmail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'today' | 'week' | 'month' | 'pending' | 'missing'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Derive unique categories present in expenses
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    expenses.forEach((e) => cats.add(e.expenseCategory));
    return Array.from(cats);
  }, [expenses]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    const now = new Date('2026-09-14'); // System reference date
    const todayStr = '2026-09-14';

    return expenses.filter((item) => {
      // Search matching vendor, description, category, ID, amount
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          item.vendor.toLowerCase().includes(q) ||
          item.expenseCategory.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.amount.toString().includes(q) ||
          item.employeeName.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && item.expenseCategory !== categoryFilter) {
        return false;
      }

      // Quick date / flag filters
      if (quickFilter === 'today') {
        return item.expenseDate === todayStr || item.submissionDate === todayStr;
      }
      if (quickFilter === 'pending') {
        return item.status === 'Submitted' || item.status === 'Under Review' || item.approvalStatus === 'Pending';
      }
      if (quickFilter === 'missing') {
        return !item.billAvailable;
      }
      if (quickFilter === 'month') {
        return item.expenseDate.startsWith('2026-09');
      }
      if (quickFilter === 'week') {
        // Between Sep 8 and Sep 14
        return item.expenseDate >= '2026-09-08' && item.expenseDate <= '2026-09-14';
      }

      return true;
    });
  }, [expenses, searchQuery, statusFilter, quickFilter, categoryFilter]);

  // Helper badge color
  const getStatusBadge = (status: ExpenseStatus) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'Submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200/80';
      case 'Under Review':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200/80';
      case 'Paid / Reimbursed':
        return 'bg-purple-50 text-purple-700 border-purple-200/80';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Fast Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Expenses</h1>
          <p className="text-xs text-slate-500">
            {filteredExpenses.length} record{filteredExpenses.length !== 1 ? 's' : ''} captured • Synced with Ryze Expense Register
          </p>
        </div>
        <button
          id="btn-add-expense-my-expenses"
          onClick={onOpenAddModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Expense</span>
        </button>
      </div>

      {/* Search Bar & Quick Filters */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by vendor, category, amount (₹), ID, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 rounded-xl text-xs text-slate-800 placeholder-slate-400 border border-slate-200 focus:outline-teal-600 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-700 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Paid / Reimbursed">Paid / Reimbursed</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Quick:
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'pending', label: 'Pending Approval' },
            { id: 'missing', label: 'Missing Bills' },
          ].map((q) => (
            <button
              key={q.id}
              onClick={() => setQuickFilter(q.id as any)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                quickFilter === q.id
                  ? 'bg-teal-700 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Grid in Exact Card Format Requested */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No expenses found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or quick filter, or capture a new business expense.
          </p>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs"
          >
            + Capture Expense
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredExpenses.map((expense) => (
            <div
              key={expense.id}
              id={`expense-card-${expense.id}`}
              onClick={() => onSelectExpense(expense)}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:shadow-md hover:border-teal-400/80 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    {/* Amount as prominent header */}
                    <div className="text-xl font-extrabold text-slate-900 tracking-tight">
                      ₹{expense.amount.toLocaleString('en-IN')}
                    </div>
                    {/* Vendor */}
                    <h3 className="font-bold text-slate-800 text-sm mt-0.5 group-hover:text-teal-800 transition-colors">
                      {expense.vendor}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                      expense.status
                    )}`}
                  >
                    {expense.status}
                  </span>
                </div>

                {/* Category & Date */}
                <div className="flex items-center space-x-2 mt-2 text-xs text-slate-500">
                  <span className="px-2 py-0.5 bg-slate-100 rounded-md font-medium text-slate-700">
                    {expense.expenseCategory}
                  </span>
                  <span>•</span>
                  <span>{expense.expenseDate}</span>
                </div>

                {/* Description Snippet if available */}
                {expense.description && (
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 bg-slate-50/60 p-2 rounded-lg border border-slate-100">
                    {expense.description}
                  </p>
                )}
              </div>

              {/* Card Footer: Bill Status & Google Drive Link */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                {expense.billAvailable ? (
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Bill Attached
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-700 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Bill Missing
                  </span>
                )}

                <div className="flex items-center space-x-1 text-slate-400 group-hover:text-teal-700 transition-colors font-medium">
                  <span className="font-mono text-[10px]">{expense.id}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
