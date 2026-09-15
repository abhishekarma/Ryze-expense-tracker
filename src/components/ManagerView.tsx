import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  MessageSquare,
  UserCheck,
  Search,
  Filter,
  Users,
  ChevronRight,
  Clock,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { Expense, ExpenseStatus, EmployeeProfile } from '../types';
import { updateExpense } from '../utils/api';

interface ManagerViewProps {
  expenses: Expense[];
  currentEmployee: EmployeeProfile;
  onRefreshExpenses: () => void;
  onSelectExpense: (expense: Expense) => void;
}

export const ManagerView: React.FC<ManagerViewProps> = ({
  expenses,
  currentEmployee,
  onRefreshExpenses,
  onSelectExpense,
}) => {
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('all');
  const [actionModalExpense, setActionModalExpense] = useState<Expense | null>(null);
  const [actionType, setActionType] = useState<'Approve' | 'Reject' | 'Clarification' | null>(null);
  const [managerComment, setManagerComment] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Summary by Employee
  const employeeSummaries = useMemo(() => {
    const summaryMap: Record<
      string,
      {
        name: string;
        email: string;
        department: string;
        totalExpense: number;
        count: number;
        missingBills: number;
        pendingApproval: number;
        approvedExpense: number;
      }
    > = {};

    expenses.forEach((e) => {
      if (!summaryMap[e.employeeName]) {
        summaryMap[e.employeeName] = {
          name: e.employeeName,
          email: e.employeeEmail,
          department: e.department,
          totalExpense: 0,
          count: 0,
          missingBills: 0,
          pendingApproval: 0,
          approvedExpense: 0,
        };
      }
      summaryMap[e.employeeName].totalExpense += e.amount;
      summaryMap[e.employeeName].count += 1;
      if (!e.billAvailable) summaryMap[e.employeeName].missingBills += 1;
      if (e.status === 'Submitted' || e.status === 'Under Review') {
        summaryMap[e.employeeName].pendingApproval += e.amount;
      }
      if (e.status === 'Approved' || e.status === 'Paid / Reimbursed') {
        summaryMap[e.employeeName].approvedExpense += e.amount;
      }
    });

    return Object.values(summaryMap);
  }, [expenses]);

  // Filtered expenses for manager review
  const filteredReviewExpenses = useMemo(() => {
    if (selectedEmployeeFilter === 'all') return expenses;
    return expenses.filter((e) => e.employeeName === selectedEmployeeFilter);
  }, [expenses, selectedEmployeeFilter]);

  // Handle Manager Action (Approve / Reject / Clarification)
  const handleConfirmAction = async () => {
    if (!actionModalExpense || !actionType) return;

    setIsProcessing(true);
    const todayStr = new Date().toISOString().split('T')[0];

    let newStatus: ExpenseStatus = actionModalExpense.status;
    let newApprovalStatus = actionModalExpense.approvalStatus;

    if (actionType === 'Approve') {
      newStatus = 'Approved';
      newApprovalStatus = 'Approved';
    } else if (actionType === 'Reject') {
      newStatus = 'Rejected';
      newApprovalStatus = 'Rejected';
    } else if (actionType === 'Clarification') {
      newStatus = 'Under Review';
      newApprovalStatus = 'Clarification Required';
    }

    const res = await updateExpense(actionModalExpense.id, {
      status: newStatus,
      approvalStatus: newApprovalStatus,
      approverName: currentEmployee.name,
      approvalDate: todayStr,
      approverComments: managerComment.trim() || undefined,
    });

    setIsProcessing(false);
    if (res.success) {
      setActionModalExpense(null);
      setActionType(null);
      setManagerComment('');
      onRefreshExpenses();
    } else {
      alert('Failed to update approval status. Please try again.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manager Review</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
              VP Sales &amp; Approvals
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Review and approve team business expenses for Ryze Chemie
          </p>
        </div>

        {/* Employee Filter */}
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-slate-400" />
          <select
            value={selectedEmployeeFilter}
            onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 outline-none"
          >
            <option value="all">All Team Members ({employeeSummaries.length})</option>
            {employeeSummaries.map((emp) => (
              <option key={emp.name} value={emp.name}>
                {emp.name} ({emp.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Team Summary Cards Section (Section 16 Specification) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Team Expense Rollup
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {employeeSummaries.map((emp) => (
            <div
              key={emp.name}
              onClick={() => setSelectedEmployeeFilter(emp.name)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedEmployeeFilter === emp.name
                  ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                  : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs">{emp.name}</h3>
                  <p className="text-[10px] text-slate-500">{emp.department}</p>
                </div>
                <span className="text-xs font-bold text-slate-900">
                  ₹{emp.totalExpense.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-200/60 text-[10px]">
                <div>
                  <span className="text-slate-400 block">Total Items</span>
                  <span className="font-bold text-slate-700">{emp.count}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Pending</span>
                  <span className="font-bold text-blue-700">
                    ₹{emp.pendingApproval.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Missing Bills</span>
                  <span
                    className={`font-bold ${
                      emp.missingBills > 0 ? 'text-amber-700' : 'text-slate-500'
                    }`}
                  >
                    {emp.missingBills}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review & Approval Queue */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Expenses Pending Approval &amp; History
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {filteredReviewExpenses.length} Records
          </span>
        </div>

        <div className="space-y-3">
          {filteredReviewExpenses.map((expense) => (
            <div
              key={expense.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all space-y-3 bg-white shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {expense.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600 font-semibold">
                      {expense.employeeName}
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-2 mt-1">
                    <h3 className="font-bold text-slate-900 text-sm">{expense.vendor}</h3>
                    <span className="text-xs text-slate-500">({expense.expenseCategory})</span>
                  </div>

                  {expense.description && (
                    <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {expense.description}
                    </p>
                  )}
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="text-xl font-black text-slate-900">
                    ₹{expense.amount.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-slate-400 block">{expense.paymentMode}</span>
                  {expense.billAvailable ? (
                    <span className="text-[11px] text-emerald-700 font-medium flex items-center sm:justify-end gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Bill Attached
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-700 font-medium flex items-center sm:justify-end gap-1 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Bill Missing
                    </span>
                  )}
                </div>
              </div>

              {/* Manager Actions Button Row */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => onSelectExpense(expense)}
                  className="text-teal-700 hover:text-teal-900 font-semibold"
                >
                  View Details &amp; Receipt &rarr;
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActionModalExpense(expense);
                      setActionType('Clarification');
                      setManagerComment('');
                    }}
                    className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-semibold text-xs transition-colors"
                  >
                    Request Clarification
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActionModalExpense(expense);
                      setActionType('Reject');
                      setManagerComment('');
                    }}
                    className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 font-semibold text-xs transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActionModalExpense(expense);
                      setActionType('Approve');
                      setManagerComment('Approved for business reimbursement.');
                    }}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    ✓ Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Dialog Modal */}
      {actionModalExpense && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base">
              {actionType === 'Approve' && 'Approve Expense'}
              {actionType === 'Reject' && 'Reject Expense'}
              {actionType === 'Clarification' && 'Request Clarification'}
            </h3>
            <p className="text-xs text-slate-600">
              For <strong>{actionModalExpense.employeeName}</strong> &bull; {actionModalExpense.vendor} (₹{actionModalExpense.amount.toLocaleString('en-IN')})
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Approver Comments (recorded in Google Sheet):
              </label>
              <textarea
                rows={3}
                placeholder="Enter feedback or clarification instructions for employee..."
                value={managerComment}
                onChange={(e) => setManagerComment(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-teal-600"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActionModalExpense(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmAction}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors ${
                  actionType === 'Approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : actionType === 'Reject'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {isProcessing ? 'Updating...' : `Confirm ${actionType}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
