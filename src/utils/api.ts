import { AppConfig, Expense, ExtractedReceiptData } from '../types';

export async function fetchExpenses(): Promise<Expense[]> {
  try {
    const res = await fetch('/api/expenses');
    if (!res.ok) throw new Error('Failed to fetch expenses');
    const data = await res.json();
    return data.expenses || [];
  } catch (err) {
    console.error('fetchExpenses error:', err);
    return [];
  }
}

export async function submitExpense(
  payload: Partial<Expense>
): Promise<{ success: boolean; expense?: Expense; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit expense');
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Submission error' };
  }
}

export async function scanReceiptWithGemini(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<{ success: boolean; data?: ExtractedReceiptData; error?: string }> {
  try {
    const res = await fetch('/api/scan-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'OCR processing failed');
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error scanning receipt' };
  }
}

export async function checkDuplicateExpense(payload: {
  employeeName: string;
  expenseDate: string;
  amount: number;
  vendor: string;
}): Promise<{ isDuplicate: boolean; existingExpense?: Expense; message?: string }> {
  try {
    const res = await fetch('/api/check-duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    return { isDuplicate: false };
  }
}

export async function updateExpense(
  id: string,
  updates: Partial<Expense>
): Promise<{ success: boolean; expense?: Expense; error?: string }> {
  try {
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchConfig(): Promise<AppConfig | null> {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    return data.config || null;
  } catch (err) {
    return null;
  }
}

export async function saveConfig(
  config: Partial<AppConfig>
): Promise<{ success: boolean; config?: AppConfig }> {
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

export async function syncGoogleSheet(): Promise<{ success: boolean; message: string; rows?: number }> {
  try {
    const res = await fetch('/api/sync-google-sheet', { method: 'POST' });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to sync with Google Sheet' };
  }
}
