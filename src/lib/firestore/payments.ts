import { getDoc, doc } from 'firebase/firestore';
import { type QuerySnapshot, database } from '../database';
import { computeApprovedExpensePaymentDeltas } from '../payments';
import type { Apartment, Category, Payment, User } from '../types';
import { getApartments } from './apartments';
import { getCategories } from './categories';
import { applyDeltasToBalanceSheets } from './expenses';
import { getUsers } from './users';

// Helper function to validate category
const validateCategory = async (categoryId: string): Promise<Category> => {
  const categoryDoc = await database.collection<Category>('categories').doc(categoryId).get();
  if (!categoryDoc.exists) {
    throw new Error(`Category ${categoryId} not found`);
  }

  const category = { id: categoryDoc.id, ...categoryDoc.data() } as Category;

  if (
    !category.isPaymentEvent ||
    !category.monthlyAmount ||
    typeof category.monthlyAmount !== 'number' ||
    category.monthlyAmount <= 0
  ) {
    throw new Error(
      `Category ${category.name} is not configured for payment events or has invalid monthlyAmount: ${category.monthlyAmount}`
    );
  }

  return category;
};

// Helper function to check if payment event exists
const checkExistingPayment = async (
  apartmentId: string,
  monthYear: string,
  categoryName: string
): Promise<boolean> => {
  const existingPayments = await getPayments(apartmentId, monthYear);
  return existingPayments.some(
    payment =>
      payment.reason?.includes('Monthly maintenance fee') || payment.reason?.includes(categoryName)
  );
};

// Helper function to create apartment payment
const createApartmentPayment = async (
  apartment: Apartment,
  category: Category,
  firstMember: User,
  monthYear: string
): Promise<Payment | null> => {
  const monthlyAmount = typeof category.monthlyAmount === 'number' ? category.monthlyAmount : 0;
  if (monthlyAmount <= 0) {
    console.warn(
      `Skipping payment event for category ${category.name} with invalid amount: ${monthlyAmount}`
    );
    return null;
  }

  const paymentEventData: Omit<Payment, 'id' | 'createdAt'> = {
    payerId: firstMember.id,
    payeeId: firstMember.id,
    apartmentId: apartment.id,
    category: 'income',
    amount: monthlyAmount,
    status: 'pending',
    monthYear,
    reason: `Monthly maintenance fee - ${category.name}`,
  };

  try {
    const createdPayment = await addPayment(paymentEventData);
    return createdPayment;
  } catch (error) {
    console.error(`Failed to create payment event for apartment ${apartment.id}:`, error);
    return null;
  }
};

export const getPayments = async (apartmentId?: string, monthYear?: string): Promise<Payment[]> => {
  const paymentsCollection = database.collection<Payment>('payments');
  let queryBuilder = paymentsCollection.query();
  if (apartmentId) {
    queryBuilder = queryBuilder.where({ field: 'apartmentId', operator: '==', value: apartmentId });
  }
  if (monthYear) {
    queryBuilder = queryBuilder.where({ field: 'monthYear', operator: '==', value: monthYear });
  }
  const paymentSnapshot = await queryBuilder.get();
  return paymentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Payment);
};

export const addPayment = async (payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> => {
  const paymentsCollection = database.collection<Omit<Payment, 'id'>>('payments');
  const newPayment = {
    ...payment,
    createdAt: new Date().toISOString(),
  };
  const docRef = await paymentsCollection.add(newPayment);
  // If this is already an approved expense, apply deltas to balanceSheets
  try {
    const deltas = computeApprovedExpensePaymentDeltas(undefined, {
      ...newPayment,
      id: docRef.id,
    } as Payment);
    if (deltas.length) {
      const map: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }> = {};
      deltas.forEach(d => {
        const key = `${d.apartmentId}|${d.monthYear}`;
        map[key] = map[key] || { totalIncomeDelta: 0, totalExpensesDelta: 0 };
        map[key].totalIncomeDelta += d.totalIncomeDelta || 0;
        map[key].totalExpensesDelta += d.totalExpensesDelta || 0;
      });
      // group by monthYear and apply
      const perMonth: Record<
        string,
        Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }>
      > = {};
      Object.entries(map).forEach(([key, delta]) => {
        const [apartmentId, monthYear] = key.split('|');
        perMonth[monthYear] = perMonth[monthYear] || {};
        perMonth[monthYear][apartmentId] = delta;
      });
      for (const [month, deltasByApt] of Object.entries(perMonth)) {
        await applyDeltasToBalanceSheets(deltasByApt, month);
      }
    }
  } catch (e) {
    console.error('Error updating balanceSheets after addPayment:', e);
  }
  return { id: docRef.id, ...newPayment } as Payment;
};

export const updatePayment = async (id: string, payment: Partial<Payment>): Promise<void> => {
  const paymentDoc = database.collection<Payment>('payments').doc(id);
  // Read old to compute deltas
  const oldSnap = await paymentDoc.get();
  const oldPayment = oldSnap.exists
    ? ({ ...(oldSnap.data() as Payment), id } as Payment)
    : undefined;
  await paymentDoc.update(payment);
  try {
    const deltas = computeApprovedExpensePaymentDeltas(oldPayment, { ...oldPayment, ...payment });
    if (deltas.length) {
      const map: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }> = {};
      deltas.forEach(d => {
        const key = `${d.apartmentId}|${d.monthYear}`;
        map[key] = map[key] || { totalIncomeDelta: 0, totalExpensesDelta: 0 };
        map[key].totalIncomeDelta += d.totalIncomeDelta || 0;
        map[key].totalExpensesDelta += d.totalExpensesDelta || 0;
      });
      const perMonth: Record<
        string,
        Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }>
      > = {};
      Object.entries(map).forEach(([key, delta]) => {
        const [apartmentId, monthYear] = key.split('|');
        perMonth[monthYear] = perMonth[monthYear] || {};
        perMonth[monthYear][apartmentId] = delta;
      });
      for (const [month, deltasByApt] of Object.entries(perMonth)) {
        await applyDeltasToBalanceSheets(deltasByApt, month);
      }
    }
  } catch (e) {
    console.error('Error updating balanceSheets after updatePayment:', e);
  }
};

export const deletePayment = async (id: string): Promise<void> => {
  const paymentDoc = database.collection<Payment>('payments').doc(id);
  // Read existing payment to possibly subtract its effect
  const snap = await paymentDoc.get();
  if (snap.exists) {
    try {
      const p = { ...(snap.data() as Payment), id } as Payment;
      const deltas = computeApprovedExpensePaymentDeltas(p, undefined);
      if (deltas.length) {
        const map: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }> = {};
        deltas.forEach(d => {
          const key = `${d.apartmentId}|${d.monthYear}`;
          map[key] = map[key] || { totalIncomeDelta: 0, totalExpensesDelta: 0 };
          map[key].totalIncomeDelta += d.totalIncomeDelta || 0;
          map[key].totalExpensesDelta += d.totalExpensesDelta || 0;
        });
        const perMonth: Record<
          string,
          Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }>
        > = {};
        Object.entries(map).forEach(([key, delta]) => {
          const [apartmentId, monthYear] = key.split('|');
          perMonth[monthYear] = perMonth[monthYear] || {};
          perMonth[monthYear][apartmentId] = delta;
        });
        for (const [month, deltasByApt] of Object.entries(perMonth)) {
          await applyDeltasToBalanceSheets(deltasByApt, month);
        }
      }
    } catch (e) {
      console.error('Error updating balanceSheets before deletePayment:', e);
    }
  }
  await paymentDoc.delete();
};

export const subscribeToPayments = async (
  callback: (payments: Payment[]) => void,
  apartmentId?: string,
  monthYear?: string
) => {
  const paymentsCollection = database.collection<Payment>('payments');
  const filters: Array<{
    field: string;
    operator:
      | '=='
      | '!='
      | '<'
      | '<='
      | '>'
      | '>='
      | 'array-contains'
      | 'in'
      | 'array-contains-any';
    value: any;
  }> = [];
  if (apartmentId) {
    filters.push({ field: 'apartmentId', operator: '==', value: apartmentId });
  }
  if (monthYear) {
    filters.push({ field: 'monthYear', operator: '==', value: monthYear });
  }
  return database.subscribeToCollection<Payment>(
    'payments',
    (snapshot: QuerySnapshot<Payment>) => {
      const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Payment);
      callback(payments);
    },
    filters
  );
};

// Generate monthly payment events for configured categories
export const generatePaymentEvents = async (
  categoryId: string,
  monthYear: string
): Promise<Payment[]> => {
  const category = await validateCategory(categoryId);
  const apartments = await getApartments();
  const allUsers = await getUsers();

  const createdPayments: Payment[] = [];

  for (const apartment of apartments) {
    const apartmentMembers = allUsers.filter(user => user.apartment === apartment.id);
    if (apartmentMembers.length === 0) {
      console.warn(
        `No members found for apartment ${apartment.id}, skipping payment event generation`
      );
      continue;
    }

    const firstMember = apartmentMembers[0];

    if (await checkExistingPayment(apartment.id, monthYear, category.name)) {
      console.log(`Payment event already exists for apartment ${apartment.id} in ${monthYear}`);
      continue;
    }

    const payment = await createApartmentPayment(apartment, category, firstMember, monthYear);
    if (payment) {
      createdPayments.push(payment);
    }
  }

  return createdPayments;
};

// Generate payment events for all configured categories for a specific month
export const generateAllPaymentEvents = async (monthYear: string): Promise<Payment[]> => {
  // Get all categories configured for payment events
  const categories = await getCategories();
  const paymentEventCategories = categories.filter(
    cat => cat.isPaymentEvent && cat.autoGenerate && cat.monthlyAmount && cat.monthlyAmount > 0
  );

  if (paymentEventCategories.length === 0) {
    // console.log('No categories configured for automatic payment event generation');
    return [];
  }

  const allCreatedPayments: Payment[] = [];

  for (const category of paymentEventCategories) {
    try {
      const payments = await generatePaymentEvents(category.id, monthYear);
      allCreatedPayments.push(...payments);
    } catch (error) {
      console.error(`Failed to generate payment events for category ${category.name}:`, error);
    }
  }

  return allCreatedPayments;
};
