// Quick regression: category inference and CSV order
import fs from 'fs';

// mimic a couple of payments as the UI would see
const payments = [
  {
    id: '1',
    payerId: 'u1',
    amount: 200,
    status: 'pending',
    createdAt: '2025-08-18',
    monthYear: '2025-08',
    expenseId: 'e1',
  },
  {
    id: '2',
    payerId: 'u1',
    amount: 500,
    status: 'approved',
    createdAt: '2025-08-17',
    monthYear: '2025-08',
    category: 'income',
  },
] as any[];

const users = [{ id: 'u1', name: 'Alice', apartment: 'T1', role: 'user' }];

const getUserName = (id: string) => users.find(u => u.id === id)?.name || id;
const isApprover = (id: string) => !!users.find(u => u.id === id && (u as any).role === 'admin');

const headers = [
  'Apartment',
  'Owner',
  'Category',
  'Amount',
  'Status',
  'Created At',
  'Approved By',
  'MonthYear',
];
const rows = payments.map(p => {
  const payer = users.find(u => u.id === p.payerId);
  const category = p.category || (p.expenseId ? 'expense' : 'income');
  return [
    payer?.apartment || '',
    getUserName(p.payerId),
    category,
    p.amount,
    p.status,
    p.createdAt,
    p.approvedBy && isApprover(p.approvedBy) ? getUserName(p.approvedBy) : '',
    p.monthYear,
  ];
});
const csv = [headers, ...rows].map(r => r.join(',')).join('\n');

if (!csv.includes('expense') || !csv.includes('income')) {
  console.error('Category inference failed');
  process.exit(1);
}
if (!csv.startsWith('Apartment,Owner,Category')) {
  console.error('CSV column order incorrect');
  process.exit(2);
}
console.log('PASS: category inference and CSV order OK');
