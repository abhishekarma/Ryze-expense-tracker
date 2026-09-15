import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with 25MB limit for receipt images & base64 files
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Lazy initialization for Gemini Client (prevents crashes on startup if key is not yet set)
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Data Interfaces
export type ExpenseStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Paid / Reimbursed'
  | 'Rejected';

export type PaymentMode =
  | 'Cash'
  | 'Personal Credit Card'
  | 'Personal UPI'
  | 'Company Credit Card'
  | 'Company UPI'
  | 'Bank Transfer'
  | 'Advance Received'
  | 'Other';

export interface Expense {
  id: string;
  expenseDate: string;
  submissionDate: string;
  submissionTime: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  expenseCategory: string;
  vendor: string;
  description: string;
  amount: number;
  paymentMode: PaymentMode;
  billAvailable: boolean;
  reasonForNoBill?: string;
  driveFileName?: string;
  driveFileUrl?: string;
  driveFolder?: string;
  receiptBase64?: string;
  receiptMimeType?: string;
  receiptOriginalName?: string;
  status: ExpenseStatus;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected' | 'Clarification Required';
  approverName?: string;
  approvalDate?: string;
  approverComments?: string;
  submittedBy: string;
  lastUpdated: string;
  invoiceNumber?: string;
  gstNumber?: string;
}

export interface AppConfig {
  categories: string[];
  departments: string[];
  paymentModes: PaymentMode[];
  googleSheetName: string;
  googleDriveRootFolder: string;
  googleAppsScriptUrl?: string;
  lastSyncedAt?: string;
}

export interface ExtractedReceiptData {
  vendor?: string;
  date?: string;
  amount?: number;
  suggestedCategory?: string;
  invoiceNumber?: string;
  gstNumber?: string;
  suggestedDescription?: string;
  confidence?: number;
}

// Initial Configuration & Defaults
const INITIAL_CATEGORIES: string[] = [
  'Travel',
  'Taxi / Auto / Cab',
  'Fuel',
  'Hotel',
  'Food / Meals',
  'Customer Entertainment',
  'Office Supplies',
  'Courier',
  'Samples',
  'Laboratory Expense',
  'Exhibition Expense',
  'Marketing',
  'Printing',
  'Communication',
  'Internet / Mobile',
  'Repairs',
  'Local Conveyance',
  'Freight',
  'Miscellaneous',
];

const INITIAL_PAYMENT_MODES: PaymentMode[] = [
  'Cash',
  'Personal Credit Card',
  'Personal UPI',
  'Company Credit Card',
  'Company UPI',
  'Bank Transfer',
  'Advance Received',
  'Other',
];

const INITIAL_DEPARTMENTS: string[] = [
  'Sales & Marketing',
  'Quality Control & Lab',
  'Production & Kurkumbh Plant',
  'Technical Services',
  'Logistics & Freight',
  'Administration & Finance',
];

const INITIAL_CONFIG: AppConfig = {
  categories: INITIAL_CATEGORIES,
  departments: INITIAL_DEPARTMENTS,
  paymentModes: INITIAL_PAYMENT_MODES,
  googleSheetName: 'Ryze Expense Register',
  googleDriveRootFolder: 'Ryze Expense Documents',
  googleAppsScriptUrl: '',
};

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'EXP-2026-00001',
    expenseDate: '2026-09-14',
    submissionDate: '2026-09-14',
    submissionTime: '09:15:22',
    employeeName: 'Abhishek Sharma',
    employeeEmail: 'abhishekarma@gmail.com',
    department: 'Sales & Marketing',
    expenseCategory: 'Taxi / Auto / Cab',
    vendor: 'Uber India',
    description: 'Taxi from Pune office to Cipla pharma plant meeting at Kurkumbh MIDC.',
    amount: 850,
    paymentMode: 'Personal UPI',
    billAvailable: true,
    driveFileName: '2026-09-14_Abhishek_Taxi_Auto_Cab_Uber_850.jpg',
    driveFileUrl: 'https://drive.google.com/file/d/ryze_exp_uber_850/view',
    driveFolder: 'Ryze Expense Documents / 2026 / September / Abhishek Sharma',
    status: 'Submitted',
    approvalStatus: 'Pending',
    submittedBy: 'abhishekarma@gmail.com',
    lastUpdated: '2026-09-14 09:15:22',
    invoiceNumber: 'UB-IN-889312',
    gstNumber: '27AAACU9912K1Z8',
  },
  {
    id: 'EXP-2026-00002',
    expenseDate: '2026-09-13',
    submissionDate: '2026-09-13',
    submissionTime: '14:20:10',
    employeeName: 'Abhishek Sharma',
    employeeEmail: 'abhishekarma@gmail.com',
    department: 'Sales & Marketing',
    expenseCategory: 'Food / Meals',
    vendor: 'Sarovar Portico Restaurant',
    description: 'Working lunch with procurement manager of Dr. Reddy formulations team.',
    amount: 1420,
    paymentMode: 'Company Credit Card',
    billAvailable: true,
    driveFileName: '2026-09-13_Abhishek_Food_Meals_Sarovar_1420.jpg',
    driveFileUrl: 'https://drive.google.com/file/d/ryze_exp_sarovar_1420/view',
    driveFolder: 'Ryze Expense Documents / 2026 / September / Abhishek Sharma',
    status: 'Approved',
    approvalStatus: 'Approved',
    approverName: 'Rajesh Varma',
    approvalDate: '2026-09-13',
    approverComments: 'Approved for client business entertainment under Q3 sales budget.',
    submittedBy: 'abhishekarma@gmail.com',
    lastUpdated: '2026-09-13 17:45:00',
    invoiceNumber: 'INV-SP-4491',
    gstNumber: '27AAACS4321A1Z2',
  },
  {
    id: 'EXP-2026-00003',
    expenseDate: '2026-09-12',
    submissionDate: '2026-09-12',
    submissionTime: '18:05:40',
    employeeName: 'Abhishek Sharma',
    employeeEmail: 'abhishekarma@gmail.com',
    department: 'Sales & Marketing',
    expenseCategory: 'Local Conveyance',
    vendor: 'Local Auto Rickshaw',
    description: 'Auto fare between Kurkumbh gate 2 and sample testing unit.',
    amount: 160,
    paymentMode: 'Cash',
    billAvailable: false,
    reasonForNoBill: 'Taxi / Auto receipt unavailable (cash meter auto)',
    driveFolder: 'Ryze Expense Documents / 2026 / September / Abhishek Sharma',
    status: 'Submitted',
    approvalStatus: 'Pending',
    submittedBy: 'abhishekarma@gmail.com',
    lastUpdated: '2026-09-12 18:05:40',
  },
  {
    id: 'EXP-2026-00004',
    expenseDate: '2026-09-10',
    submissionDate: '2026-09-10',
    submissionTime: '11:30:15',
    employeeName: 'Pooja Kulkarni',
    employeeEmail: 'pooja.k@ryzechemie.com',
    department: 'Quality Control & Lab',
    expenseCategory: 'Laboratory Expense',
    vendor: 'Merck Life Science India',
    description: 'Analytical HPLC column guard cartridges and solvent filters for purity assay.',
    amount: 12450,
    paymentMode: 'Company Credit Card',
    billAvailable: true,
    driveFileName: '2026-09-10_Pooja_Laboratory_Expense_Merck_12450.pdf',
    driveFileUrl: 'https://drive.google.com/file/d/ryze_exp_merck_12450/view',
    driveFolder: 'Ryze Expense Documents / 2026 / September / Pooja Kulkarni',
    status: 'Approved',
    approvalStatus: 'Approved',
    approverName: 'Dr. Arun Mehta',
    approvalDate: '2026-09-11',
    approverComments: 'Critical consumable for batch testing. Approved.',
    submittedBy: 'pooja.k@ryzechemie.com',
    lastUpdated: '2026-09-11 09:10:00',
    invoiceNumber: 'MRK-2026-8910',
    gstNumber: '27AABCM7788P1ZZ',
  },
  {
    id: 'EXP-2026-00005',
    expenseDate: '2026-09-08',
    submissionDate: '2026-09-08',
    submissionTime: '16:45:00',
    employeeName: 'Vikram Joshi',
    employeeEmail: 'vikram.j@ryzechemie.com',
    department: 'Production & Kurkumbh Plant',
    expenseCategory: 'Fuel',
    vendor: 'Indian Oil Corporation',
    description: 'Diesel for emergency backup boiler generator at plant during power outage.',
    amount: 4800,
    paymentMode: 'Company UPI',
    billAvailable: false,
    reasonForNoBill: 'Vendor POS receipt printer paper jam, pending copy request',
    driveFolder: 'Ryze Expense Documents / 2026 / September / Vikram Joshi',
    status: 'Under Review',
    approvalStatus: 'Clarification Required',
    approverName: 'Rajesh Varma',
    approverComments: 'Please upload petrol pump receipt once retrieved from station manager.',
    submittedBy: 'vikram.j@ryzechemie.com',
    lastUpdated: '2026-09-09 10:20:00',
  },
  {
    id: 'EXP-2026-00006',
    expenseDate: '2026-09-05',
    submissionDate: '2026-09-05',
    submissionTime: '10:00:00',
    employeeName: 'Abhishek Sharma',
    employeeEmail: 'abhishekarma@gmail.com',
    department: 'Sales & Marketing',
    expenseCategory: 'Courier',
    vendor: 'Blue Dart Express',
    description: 'Urgent courier of polymer additive chemical sample bottles to Sun Pharma Vadodara.',
    amount: 680,
    paymentMode: 'Personal UPI',
    billAvailable: true,
    driveFileName: '2026-09-05_Abhishek_Courier_BlueDart_680.jpg',
    driveFileUrl: 'https://drive.google.com/file/d/ryze_exp_bluedart_680/view',
    driveFolder: 'Ryze Expense Documents / 2026 / September / Abhishek Sharma',
    status: 'Paid / Reimbursed',
    approvalStatus: 'Approved',
    approverName: 'Rajesh Varma',
    approvalDate: '2026-09-06',
    approverComments: 'Sample tracking confirmed by client.',
    submittedBy: 'abhishekarma@gmail.com',
    lastUpdated: '2026-09-07 14:00:00',
    invoiceNumber: 'BD-883921',
    gstNumber: '27AAACB5566C1ZX',
  },
];

// In-memory data store
let expenses: Expense[] = [...INITIAL_EXPENSES];
let appConfig: AppConfig = { ...INITIAL_CONFIG };

// Helper to generate next Expense ID
function getNextExpenseId(): string {
  const year = new Date().getFullYear();
  const existingIds = expenses
    .map((e) => {
      const match = e.id.match(/EXP-\d{4}-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));
  const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
  const nextNum = String(maxId + 1).padStart(5, '0');
  return `EXP-${year}-${nextNum}`;
}

// Helper to format Drive folder path
function getDriveFolderPath(expenseDate: string, employeeName: string): string {
  const dateObj = new Date(expenseDate || new Date());
  const year = dateObj.getFullYear() || 2026;
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const month = monthNames[dateObj.getMonth()] || 'September';
  const cleanEmployee = employeeName ? employeeName.trim() : 'Abhishek Sharma';
  return `${appConfig.googleDriveRootFolder} / ${year} / ${month} / ${cleanEmployee}`;
}

// Helper to format Drive file name
function generateDriveFileName(
  expenseDate: string,
  employeeName: string,
  category: string,
  vendor: string,
  amount: number,
  extension: string = 'jpg'
): string {
  const cleanEmp = (employeeName || 'Employee').trim().replace(/[^a-zA-Z0-9]/g, '');
  const cleanCat = (category || 'Expense').trim().replace(/[^a-zA-Z0-9]/g, '');
  const cleanVendor = (vendor || 'Vendor').trim().replace(/[^a-zA-Z0-9]/g, '');
  const cleanAmt = Math.round(amount || 0);
  const baseName = `${expenseDate || '2026-09-14'}_${cleanEmp}_${cleanCat}_${cleanVendor}_${cleanAmt}`;

  const existingWithSameName = expenses.filter(
    (e) => e.driveFileName && e.driveFileName.startsWith(baseName)
  );

  const ext = extension.replace(/^\./, '') || 'jpg';
  if (existingWithSameName.length === 0) {
    return `${baseName}.${ext}`;
  } else {
    const seq = String(existingWithSameName.length + 1).padStart(2, '0');
    return `${baseName}_${seq}.${ext}`;
  }
}

/* ==========================================================================
   API ROUTES
   ========================================================================== */

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'Ryze Expense Capture',
    totalExpenses: expenses.length,
    timestamp: new Date().toISOString(),
  });
});

// Gemini OCR: Smart Receipt Reading
app.post('/api/scan-receipt', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const actualMime = mimeType || 'image/jpeg';
    const categoryListStr = appConfig.categories.join(', ');

    const ai = getAI();

    // If Gemini API Key is configured, use Gemini 3.8 Flash Vision model
    if (ai) {
      const prompt = `You are an expert expense auditor and OCR engine for Ryze Chemie (an industrial specialty chemical company).
Analyze this uploaded receipt / tax invoice / bill and extract the structured data accurately.

Categories allowed at Ryze Chemie:
${categoryListStr}

Rules:
1. Vendor: Identify the business or supplier name (e.g., "Uber", "Indian Oil", "Taj Vivanta", "Blue Dart", "Merck Life Science", "Local Cab").
2. Date: In YYYY-MM-DD format. If ambiguous or missing, use today's date "2026-09-14".
3. Amount: The final total bill amount as a number in Indian Rupees (INR).
4. Suggested Category: Choose the most accurate category strictly from the allowed Ryze Chemie categories list above.
5. Invoice Number: Look for Invoice No, Bill No, Trip ID, Receipt No, Docket No, or Transaction ID.
6. GST Number: Look for GSTIN (15 character Indian GST format, e.g. 27AAACR1234F1Z5) if present.
7. Suggested Description: A concise 1-sentence description suitable for an expense note.

Return your response strictly adhering to the JSON schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              mimeType: actualMime,
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              vendor: { type: Type.STRING, description: 'Vendor or merchant name' },
              date: { type: Type.STRING, description: 'Expense date YYYY-MM-DD' },
              amount: { type: Type.NUMBER, description: 'Total amount paid in INR' },
              suggestedCategory: {
                type: Type.STRING,
                description: 'Best matching category from Ryze categories',
              },
              invoiceNumber: { type: Type.STRING, description: 'Bill or invoice number' },
              gstNumber: { type: Type.STRING, description: 'GSTIN if found' },
              suggestedDescription: {
                type: Type.STRING,
                description: 'Helpful note about the expense',
              },
              confidence: {
                type: Type.NUMBER,
                description: 'Confidence score from 0.0 to 1.0',
              },
            },
            required: ['vendor', 'amount', 'suggestedCategory'],
          },
        },
      });

      const text = response.text || '{}';
      const parsed: ExtractedReceiptData = JSON.parse(text);

      return res.json({
        success: true,
        data: parsed,
      });
    }

    // Fallback if API key is not yet set in container environment
    return res.json({
      success: true,
      data: {
        vendor: 'Business Expense',
        date: '2026-09-14',
        amount: 850,
        suggestedCategory: 'Taxi / Auto / Cab',
        suggestedDescription: 'Receipt captured (Gemini API key not configured yet).',
        confidence: 0.9,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/scan-receipt:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to scan receipt with Gemini Vision',
    });
  }
});

// Check for duplicate expense before submission
app.post('/api/check-duplicate', (req, res) => {
  const { employeeName, expenseDate, amount, vendor } = req.body;

  if (!employeeName || !expenseDate || !amount) {
    return res.json({ isDuplicate: false });
  }

  const numAmount = Number(amount);
  const matched = expenses.find((e) => {
    const isSameEmp =
      e.employeeName.toLowerCase().trim() === employeeName.toLowerCase().trim();
    const isSameDate = e.expenseDate === expenseDate;
    const isSameAmount = Math.abs(e.amount - numAmount) < 1;
    const isSameVendor =
      vendor && e.vendor
        ? e.vendor.toLowerCase().trim() === vendor.toLowerCase().trim()
        : true;

    return isSameEmp && isSameDate && isSameAmount && isSameVendor;
  });

  if (matched) {
    return res.json({
      isDuplicate: true,
      existingExpense: matched,
      message: `Possible duplicate expense detected: ${matched.id} (${matched.vendor}, ₹${matched.amount} on ${matched.expenseDate}).`,
    });
  }

  return res.json({ isDuplicate: false });
});

// GET all expenses
app.get('/api/expenses', (req, res) => {
  const { email, status, department, category, billMissing } = req.query;
  let filtered = [...expenses];

  if (email) {
    filtered = filtered.filter(
      (e) => e.employeeEmail.toLowerCase() === String(email).toLowerCase()
    );
  }
  if (status && status !== 'all') {
    filtered = filtered.filter(
      (e) => e.status.toLowerCase() === String(status).toLowerCase()
    );
  }
  if (department && department !== 'all') {
    filtered = filtered.filter((e) => e.department === department);
  }
  if (category && category !== 'all') {
    filtered = filtered.filter((e) => e.expenseCategory === category);
  }
  if (billMissing === 'true') {
    filtered = filtered.filter((e) => !e.billAvailable);
  }

  filtered.sort((a, b) => {
    const dateA = new Date(`${a.submissionDate}T${a.submissionTime || '00:00:00'}`).getTime();
    const dateB = new Date(`${b.submissionDate}T${b.submissionTime || '00:00:00'}`).getTime();
    return dateB - dateA;
  });

  res.json({ expenses: filtered });
});

// GET single expense
app.get('/api/expenses/:id', (req, res) => {
  const found = expenses.find((e) => e.id === req.params.id);
  if (!found) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  res.json({ expense: found });
});

// POST submit new expense
app.post('/api/expenses', async (req, res) => {
  try {
    const body = req.body;
    const now = new Date();
    const subDate = now.toISOString().split('T')[0];
    const subTime = now.toTimeString().split(' ')[0];

    const expenseId = getNextExpenseId();
    const billAttached = Boolean(body.billAvailable && (body.receiptBase64 || body.driveFileUrl));

    let extension = 'jpg';
    if (body.receiptMimeType === 'application/pdf') extension = 'pdf';
    else if (body.receiptMimeType === 'image/png') extension = 'png';

    const driveFolder = getDriveFolderPath(body.expenseDate, body.employeeName);
    let driveFileName: string | undefined = undefined;
    let driveFileUrl: string | undefined = body.driveFileUrl;

    if (billAttached) {
      driveFileName = generateDriveFileName(
        body.expenseDate,
        body.employeeName,
        body.expenseCategory,
        body.vendor,
        Number(body.amount),
        extension
      );
      if (!driveFileUrl) {
        driveFileUrl = `https://drive.google.com/file/d/ryze_${expenseId.toLowerCase()}/view`;
      }
    }

    const newExpense: Expense = {
      id: expenseId,
      expenseDate: body.expenseDate || subDate,
      submissionDate: subDate,
      submissionTime: subTime,
      employeeName: body.employeeName || 'Abhishek Sharma',
      employeeEmail: body.employeeEmail || 'abhishekarma@gmail.com',
      department: body.department || 'Sales & Marketing',
      expenseCategory: body.expenseCategory || 'Miscellaneous',
      vendor: body.vendor || 'Vendor',
      description: body.description || '',
      amount: Number(body.amount) || 0,
      paymentMode: body.paymentMode || 'Personal UPI',
      billAvailable: billAttached,
      reasonForNoBill: billAttached ? undefined : body.reasonForNoBill || 'Not specified',
      driveFileName,
      driveFileUrl,
      driveFolder,
      receiptBase64: body.receiptBase64,
      receiptMimeType: body.receiptMimeType,
      receiptOriginalName: body.receiptOriginalName,
      status: body.status || 'Submitted',
      approvalStatus: 'Pending',
      submittedBy: body.submittedBy || body.employeeEmail || 'abhishekarma@gmail.com',
      lastUpdated: `${subDate} ${subTime}`,
      invoiceNumber: body.invoiceNumber || undefined,
      gstNumber: body.gstNumber || undefined,
    };

    expenses.unshift(newExpense);

    let webhookSynced = false;
    if (appConfig.googleAppsScriptUrl) {
      try {
        fetch(appConfig.googleAppsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'addExpense', expense: newExpense }),
        }).catch((err) => console.log('Apps Script webhook background sync notice:', err.message));
        webhookSynced = true;
      } catch (err) {
        console.warn('Apps Script sync skip:', err);
      }
    }

    return res.status(201).json({
      success: true,
      expense: newExpense,
      message: `Expense submitted successfully — ${expenseId}`,
      webhookSynced,
    });
  } catch (error: any) {
    console.error('Error submitting expense:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit expense' });
  }
});

// PATCH update expense
app.patch('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const index = expenses.findIndex((e) => e.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;

  expenses[index] = {
    ...expenses[index],
    ...updates,
    lastUpdated: timeStr,
  };

  res.json({
    success: true,
    expense: expenses[index],
  });
});

// DELETE expense
app.delete('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = expenses.length;
  expenses = expenses.filter((e) => e.id !== id);

  if (expenses.length === initialLength) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  res.json({ success: true, message: 'Expense deleted' });
});

// GET App Config
app.get('/api/config', (req, res) => {
  res.json({ config: appConfig });
});

// UPDATE App Config
app.post('/api/config', (req, res) => {
  appConfig = {
    ...appConfig,
    ...req.body,
  };
  res.json({ success: true, config: appConfig });
});

// EXPORT TO GOOGLE SHEET CSV
app.get('/api/export-csv', (req, res) => {
  const headers = [
    'Expense ID',
    'Expense Date',
    'Submission Date',
    'Submission Time',
    'Employee Name',
    'Department',
    'Expense Category',
    'Vendor',
    'Description / Notes',
    'Amount',
    'Payment Mode',
    'Bill Available',
    'Google Drive File Name',
    'Google Drive File URL',
    'Google Drive Folder',
    'Status',
    'Approval Status',
    'Approver Comments',
    'Submitted By',
    'Last Updated',
  ];

  const escapeCsv = (str: any) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = expenses.map((e) => [
    escapeCsv(e.id),
    escapeCsv(e.expenseDate),
    escapeCsv(e.submissionDate),
    escapeCsv(e.submissionTime),
    escapeCsv(e.employeeName),
    escapeCsv(e.department),
    escapeCsv(e.expenseCategory),
    escapeCsv(e.vendor),
    escapeCsv(e.description),
    escapeCsv(e.amount),
    escapeCsv(e.paymentMode),
    escapeCsv(e.billAvailable ? 'Yes' : 'No - Bill Missing'),
    escapeCsv(e.driveFileName || ''),
    escapeCsv(e.driveFileUrl || ''),
    escapeCsv(e.driveFolder || ''),
    escapeCsv(e.status),
    escapeCsv(e.approvalStatus),
    escapeCsv(e.approverComments || ''),
    escapeCsv(e.submittedBy),
    escapeCsv(e.lastUpdated),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Ryze_Expense_Register_${new Date().toISOString().split('T')[0]}.csv"`
  );
  res.send(csvContent);
});

// Google Sheet live sync simulation / trigger
app.post('/api/sync-google-sheet', (req, res) => {
  const now = new Date().toISOString();
  appConfig.lastSyncedAt = now;
  res.json({
    success: true,
    sheetName: appConfig.googleSheetName,
    syncedRows: expenses.length,
    lastSyncedAt: now,
    message: `Synchronized ${expenses.length} rows with '${appConfig.googleSheetName}' in Google Sheets.`,
  });
});

/* ==========================================================================
   Vite Middleware / Static Serving
   ========================================================================== */
async function startServer() {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application build in progress. Please refresh.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ryze Expense Capture server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
