import { useAuth } from '@/context/auth-context';
import { useQueryClient } from '@tanstack/react-query';

import { useEffect, useRef, useState } from 'react';

import { getApartments } from '@/lib/firestore/apartments';
import { subscribeToCategories } from '@/lib/firestore/categories';
import {
  subscribeToBalanceSheets,
  subscribeToExpenses,
  subscribeToRelevantExpenses,
} from '@/lib/firestore/expenses';
import { subscribeToPayments } from '@/lib/firestore/payments';
import { subscribeToAllUsers, subscribeToUsers } from '@/lib/firestore/users';
import { requestNotificationPermission } from '@/lib/push-notifications';
import type { Apartment, BalanceSheet, Category, Expense, Payment, User } from '@/lib/types';
