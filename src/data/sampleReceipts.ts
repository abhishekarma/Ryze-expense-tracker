export interface SampleReceipt {
  id: string;
  label: string;
  vendor: string;
  date: string;
  amount: number;
  category: string;
  mimeType: string;
  fileName: string;
  dataUrl: string;
}

// Generate realistic SVG-based receipts converted to data URLs so Gemini can read them!
const createSvgReceiptDataUrl = (
  vendor: string,
  invoiceNo: string,
  date: string,
  items: { desc: string; amount: number }[],
  total: number,
  gstin: string,
  paymentMode: string,
  note: string
): string => {
  const itemsSvg = items
    .map(
      (item, idx) => `
    <text x="30" y="${180 + idx * 28}" font-family="Arial, sans-serif" font-size="14" fill="#1e293b">${item.desc}</text>
    <text x="370" y="${180 + idx * 28}" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="end" fill="#0f172a">₹${item.amount.toFixed(2)}</text>
  `
    )
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 550" width="400" height="550">
    <defs>
      <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.1" />
      </filter>
    </defs>
    <rect width="400" height="550" fill="#f1f5f9" />
    <rect x="15" y="15" width="370" height="520" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" filter="url(#shadow)" />
    
    <!-- Top jagged/receipt styling -->
    <path d="M 15 15 L 385 15 L 385 30 L 15 30 Z" fill="#0f766e" />
    
    <!-- Header -->
    <text x="200" y="65" font-family="'Helvetica Neue', Arial, sans-serif" font-size="22" font-weight="bold" text-anchor="middle" fill="#042f2e">${vendor.toUpperCase()}</text>
    <text x="200" y="85" font-family="Arial, sans-serif" font-size="11" text-anchor="middle" fill="#64748b">TAX INVOICE / OFFICIAL RECEIPT</text>
    <text x="200" y="102" font-family="monospace" font-size="11" text-anchor="middle" fill="#475569">GSTIN: ${gstin}</text>
    
    <line x1="30" y1="118" x2="370" y2="118" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="4" />
    
    <!-- Details -->
    <text x="30" y="136" font-family="Arial, sans-serif" font-size="12" fill="#64748b">Invoice No: <tspan font-weight="bold" fill="#1e293b">${invoiceNo}</tspan></text>
    <text x="370" y="136" font-family="Arial, sans-serif" font-size="12" text-anchor="end" fill="#64748b">Date: <tspan font-weight="bold" fill="#1e293b">${date}</tspan></text>
    
    <line x1="30" y1="152" x2="370" y2="152" stroke="#cbd5e1" stroke-width="1" />
    
    <!-- Items -->
    ${itemsSvg}
    
    <line x1="30" y1="360" x2="370" y2="360" stroke="#cbd5e1" stroke-width="1.5" />
    
    <!-- Total -->
    <text x="30" y="390" font-family="'Helvetica Neue', Arial, sans-serif" font-size="16" font-weight="bold" fill="#0f172a">TOTAL AMOUNT PAID</text>
    <text x="370" y="390" font-family="'Helvetica Neue', Arial, sans-serif" font-size="22" font-weight="900" text-anchor="end" fill="#0f766e">₹${total.toFixed(2)}</text>
    
    <text x="30" y="420" font-family="Arial, sans-serif" font-size="12" fill="#475569">Payment Method: <tspan font-weight="bold">${paymentMode}</tspan></text>
    <text x="30" y="440" font-family="Arial, sans-serif" font-size="11" fill="#64748b">Note: ${note}</text>
    
    <!-- Barcode simulation -->
    <rect x="80" y="470" width="240" height="24" fill="#0f172a" opacity="0.8" />
    <text x="200" y="512" font-family="monospace" font-size="10" text-anchor="middle" fill="#94a3b8">VALIDATED RECORD • RYZE CHEMIE INTERNAL</text>
  </svg>`;

  // Convert SVG string to base64 Data URL (safe for UTF-8)
  const base64 = typeof btoa !== 'undefined' 
    ? btoa(unescape(encodeURIComponent(svg)))
    : Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
};

export const SAMPLE_RECEIPTS: SampleReceipt[] = [
  {
    id: 'sample-uber',
    label: 'Uber Pune Taxi (₹850)',
    vendor: 'Uber India Systems Pvt Ltd',
    date: '2026-09-14',
    amount: 850,
    category: 'Taxi / Auto / Cab',
    mimeType: 'image/svg+xml',
    fileName: 'Uber_Receipt_Sep14.jpg',
    dataUrl: createSvgReceiptDataUrl(
      'Uber India Systems',
      'UB-IN-2026-98122',
      '2026-09-14',
      [
        { desc: 'Trip Fare (Baner Pune to Kurkumbh)', amount: 760.0 },
        { desc: 'Toll Charges (Solapur Hwy)', amount: 90.0 },
      ],
      850.0,
      '27AAACU9912K1Z8',
      'UPI / Online',
      'Client meeting at Cipla Plant, Kurkumbh'
    ),
  },
  {
    id: 'sample-fuel',
    label: 'Indian Oil Petrol (₹2,400)',
    vendor: 'Indian Oil Corporation',
    date: '2026-09-14',
    amount: 2400,
    category: 'Fuel',
    mimeType: 'image/svg+xml',
    fileName: 'IOCL_Fuel_Receipt_Sep14.jpg',
    dataUrl: createSvgReceiptDataUrl(
      'Indian Oil Petrol Pump',
      'IOCL-PUN-7721',
      '2026-09-14',
      [
        { desc: 'Petrol XP95 (23.4 Litres @ ₹102.56)', amount: 2400.0 },
      ],
      2400.0,
      '27AAACI1920H1ZX',
      'Company Credit Card',
      'Field visit company vehicle fuel refill'
    ),
  },
  {
    id: 'sample-merck',
    label: 'Merck Reagents (₹12,450)',
    vendor: 'Merck Life Science India',
    date: '2026-09-12',
    amount: 12450,
    category: 'Laboratory Expense',
    mimeType: 'image/svg+xml',
    fileName: 'Merck_Lab_Invoice_Sep12.pdf',
    dataUrl: createSvgReceiptDataUrl(
      'Merck Life Science',
      'MRK-INV-2026-4412',
      '2026-09-12',
      [
        { desc: 'HPLC Guard Cartridge Pack x 2', amount: 8200.0 },
        { desc: 'PTFE 0.45um Syringe Filters (100pk)', amount: 2350.0 },
        { desc: 'CGST 9% + SGST 9%', amount: 1900.0 },
      ],
      12450.0,
      '27AABCM7788P1ZZ',
      'Bank Transfer / PO',
      'Batch assay testing supplies for QC lab'
    ),
  },
  {
    id: 'sample-hotel',
    label: 'Taj Vivanta Hotel (₹4,800)',
    vendor: 'Vivanta Hotels & Resorts',
    date: '2026-09-11',
    amount: 4800,
    category: 'Hotel',
    mimeType: 'image/svg+xml',
    fileName: 'Vivanta_Stay_Folio_Sep11.jpg',
    dataUrl: createSvgReceiptDataUrl(
      'Vivanta Hotels',
      'VIV-BOM-89021',
      '2026-09-11',
      [
        { desc: 'Deluxe Room Stay (1 Night, Client Visit)', amount: 4100.0 },
        { desc: 'Breakfast & Taxes (18%)', amount: 700.0 },
      ],
      4800.0,
      '27AAACT0012D1ZE',
      'Company Credit Card',
      'Overnight stay for Sun Pharma audit in Mumbai'
    ),
  },
];
