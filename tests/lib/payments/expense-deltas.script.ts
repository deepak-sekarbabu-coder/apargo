import { computeApprovedExpensePaymentDeltas } from '../../../src/lib/payments/payments';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
}

// Case 1: pending -> approved expense adds amount
let res = computeApprovedExpensePaymentDeltas(
  {
    status: 'pending',
    category: 'expense',
    apartmentId: 'T1',
    monthYear: '2025-08',
    amount: 400,
  } as any,
  {
    status: 'approved',
    category: 'expense',
    apartmentId: 'T1',
    monthYear: '2025-08',
    amount: 400,
  } as any
);
assert(
  res.length === 1 && res[0].totalExpensesDelta === 400,
  'pending->approved should add amount'
);

// Case 2: approved expense -> rejected removes amount
res = computeApprovedExpensePaymentDeltas(
  {
    status: 'approved',
    category: 'expense',
    apartmentId: 'T1',
    monthYear: '2025-08',
    amount: 400,
  } as any,
  {
    status: 'rejected',
    category: 'expense',
    apartmentId: 'T1',
    monthYear: '2025-08',
    amount: 400,
  } as any
);
assert(
  res.length === 1 && res[0].totalExpensesDelta === -400,
  'approved->rejected should subtract amount'
);

// Case 3: approved expense amount changed (same month/apt)
res = computeApprovedExpensePaymentDeltas(
  {
    status: 'approved',
    category: 'expense',
    apartmentId: 'T1',
    monthYear: '2025-08',
    amount: 400,
  } as any,
  {
    status: 'approved',
    category: 'expense',
    apartmentId: 'T1',
    monthYear: '2025-08',
    amount: 250,
  } as any
);
assert(res.length === 1 && res[0].totalExpensesDelta === -150, 'amount change should net delta');

// Case 4: approved expense moved month
res = computeApprovedExpensePaymentDeltas(
  {
    status: 'approved',
    category: 'expense',
    apartmentId: 'T1',
    monthYear: '2025-08',
    amount: 400,
  } as any,
  {
    status: 'approved',
    category: 'expense',
    apartmentId: 'T1',
    monthYear: '2025-09',
    amount: 400,
  } as any
);
assert(res.length === 2, 'move month should produce two deltas');

console.log('PASS: approved expense payment deltas OK');
