import React, { useMemo, useState } from 'react';
import {
  PieChart,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  ArrowUpRight,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { Expense } from '../types';

interface MonthlySummaryViewProps {
  expenses: Expense[];
  onSelectExpense: (expense: Expense) => void;
  onOpenAddModal: () => void;
  currentEmployeeEmail: string;
}

export const MonthlySummaryView: React.FC<MonthlySummaryViewProps> = ({
  expenses,
  onSelectExpense,
  onOpenAddModal,
  currentEmployeeEmail,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('2026-09'); // Default September 2026

  // Calculate monthly stats
  const stats = useMemo(() => {
    // Filter expenses for selected month
    const monthExpenses = expenses.filter((e) => e.expenseDate.startsWith(selectedMonth));

    let totalExpense = 0;
    let submittedExpense = 0;
    let approvedExpense = 0;
    let pendingApprovalExpense = 0;
    let missingBillsCount = 0;

    const categoryMap: Record<string, { amount: number; count: number }> = {};

    monthExpenses.forEach((e) => {
      totalExpense += e.amount;

      if (e.status === 'Approved' || e.status === 'Paid / Reimbursed') {
        approvedExpense += e.amount;
      } else if (e.status === 'Submitted' || e.status === 'Under Review') {
        pendingApprovalExpense += e.amount;
        submittedExpense += e.amount;
      }

      if (!e.billAvailable) {
        missingBillsCount += 1;
      }

      const cat = e.expenseCategory || 'Miscellaneous';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { amount: 0, count: 0 };
      }
      categoryMap[cat].amount += e.amount;
      categoryMap[cat].count += 1;
    });

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalExpense,
      submittedExpense,
      approvedExpense,
      pendingApprovalExpense,
      missingBillsCount,
      categoryBreakdown,
      monthExpenses,
    };
  }, [expenses, selectedMonth]);

  // Format month title
  const monthTitle = useMemo(() => {
    const [year, m] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(m) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  return (
    <div className="space-y-5">
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Monthly Summary</h1>
          <p className="text-xs text-slate-500">
            Overview for {monthTitle} • Ryze Chemie Expense Register
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 outline-none"
          >
            <option value="2026-09">September 2026</option>
            <option value="2026-08">August 2026</option>
            <option value="2026-07">July 2026</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Expense */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
            Total Expense
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{stats.totalExpense.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {stats.monthExpenses.length} transactions
          </span>
        </div>

        {/* Approved */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
              Approved
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            ₹{stats.approvedExpense.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-600/80 mt-1 block">
            Ready for reimbursement
          </span>
        </div>

        {/* Pending Approval */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
              Pending Review
            </span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            ₹{stats.pendingApprovalExpense.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-blue-600/80 mt-1 block">
            Awaiting manager approval
          </span>
        </div>

        {/* Missing Bills */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
              Missing Bills
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {stats.missingBillsCount}
          </div>
          <span className="text-[11px] text-amber-600/80 mt-1 block">
            Receipts required
          </span>
        </div>
      </div>

      {/* Category Breakdown Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Expense Breakdown by Category
            </h2>
            <p className="text-xs text-slate-500">Distribution across business expense heads</p>
          </div>
          <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
            {stats.categoryBreakdown.length} Active Categories
          </span>
        </div>

        {stats.categoryBreakdown.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No categorized expenses recorded for this month.
          </p>
        ) : (
          <div className="space-y-3">
            {stats.categoryBreakdown.map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-800 font-semibold">{item.category}</span>
                  <div className="space-x-2">
                    <span className="text-slate-500">({item.count} items)</span>
                    <span className="text-slate-900 font-bold">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-700 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(item.percentage, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Recent Expenses List */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            My Recent Expenses
          </h2>
          <button
            onClick={onOpenAddModal}
            className="text-xs font-semibold text-teal-700 hover:text-teal-900"
          >
            + Add Expense
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {stats.monthExpenses.slice(0, 5).map((expense) => (
            <div
              key={expense.id}
              onClick={() => onSelectExpense(expense)}
              className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 font-bold flex items-center justify-center text-xs">
                  {expense.expenseCategory.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{expense.vendor}</h4>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                    <span>{expense.expenseCategory}</span>
                    <span>•</span>
                    <span>{expense.expenseDate}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold text-slate-900 block">
                  ₹{expense.amount.toLocaleString('en-IN')}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    expense.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700'
                      : expense.status === 'Submitted'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {expense.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
